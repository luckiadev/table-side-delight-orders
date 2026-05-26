// supabase/functions/serve.ts
// ============================================================================
// Servidor local Deno que replica las Edge Functions de Webpay
// ============================================================================
// Ejecutar con:
//   deno run --allow-net --allow-env --allow-read serve.ts
//
// ¿Qué hace?
//   - Escucha en http://localhost:5678
//   - POST /webpay-create   → crea transacción Transbank + registra en DB
//   - GET/POST /webpay-confirm → recibe callback de Transbank, actualiza DB
//   - Importa los helpers de _shared/transbank.ts (mismos que Edge Functions)
// ============================================================================

import {
  getConfig,
  createTransaction,
  commitTransaction,
  generateBuyOrder,
  generateSessionId,
  corsHeaders,
} from './_shared/transbank.ts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cargar variables de entorno desde .env.functions
import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';

const envPath = new URL('./.env.functions', import.meta.url).pathname
  .replace(/^\/([A-Z]:)/, '$1');
try {
  await load({ envPath, export: true });
  console.log('[serve] Variables cargadas desde .env.functions');
} catch {
  console.log('[serve] Usando variables de entorno del sistema');
}

// Cliente Supabase con service_role (bypass RLS)
function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

const PORT = 5678;

// ============================================================================
// HANDLER: webpay-create (con validación server-side de precios)
// ============================================================================
const MAX_QUANTITY_PER_ITEM = 20;
const MAX_MESA = 500;

async function handleCreate(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido' }, 405);
  }

  const { productos, numero_mesa, nota } = await req.json();

  // Validar mesa
  if (!numero_mesa || numero_mesa < 0 || numero_mesa > MAX_MESA) {
    return jsonResponse({ error: `numero_mesa debe estar entre 0 y ${MAX_MESA}` }, 400);
  }

  // Validar que vengan productos
  if (!Array.isArray(productos) || productos.length === 0) {
    return jsonResponse({ error: 'productos es requerido (array de {id, quantity})' }, 400);
  }

  // Validar cantidades
  for (const item of productos) {
    if (!item.id || !item.quantity || item.quantity < 1) {
      return jsonResponse({ error: 'Cada producto necesita id y quantity >= 1' }, 400);
    }
    if (item.quantity > MAX_QUANTITY_PER_ITEM) {
      return jsonResponse({ error: `Máximo ${MAX_QUANTITY_PER_ITEM} unidades por producto` }, 400);
    }
  }

  const supabase = getSupabase();

  // Idempotencia: no duplicar transacciones PENDING
  const { data: existing } = await supabase
    .from('payment_transactions')
    .select('id, buy_order')
    .eq('numero_mesa', numero_mesa)
    .in('status', ['CREATED', 'PENDING'])
    .limit(1)
    .maybeSingle();

  if (existing) {
    return jsonResponse({
      error: 'Ya existe transacción en curso para esta mesa',
      existing_order: existing.buy_order,
    }, 409);
  }

  // Verificar suspensión server-side
  const { data: suspConfig } = await supabase
    .from('configuracion_sitio')
    .select('valor')
    .eq('clave', 'suspension')
    .single();

  if (suspConfig?.valor) {
    const susp = suspConfig.valor as any;
    const now = Date.now();
    let suspendido = false;
    if (susp.activa) suspendido = true;
    if (susp.desde && susp.hasta) {
      const desde = new Date(susp.desde).getTime();
      const hasta = new Date(susp.hasta).getTime();
      if (now >= desde && now <= hasta) suspendido = true;
    }
    if (suspendido) {
      return jsonResponse({ error: 'El servicio está temporalmente suspendido' }, 503);
    }
  }

  // ★ VALIDACIÓN SERVER-SIDE DE PRECIOS ★
  // Consultar precios reales desde la base de datos
  const productIds = productos.map((p: any) => p.id);
  const { data: dbProducts, error: dbError } = await supabase
    .from('productos')
    .select('id, nombre, precio, disponible')
    .in('id', productIds);

  if (dbError) throw new Error(`Error consultando productos: ${dbError.message}`);
  if (!dbProducts || dbProducts.length === 0) {
    return jsonResponse({ error: 'Productos no encontrados' }, 400);
  }

  // Verificar disponibilidad y calcular total real
  const priceMap = new Map(dbProducts.map((p: any) => [p.id, p]));
  let totalVerificado = 0;
  const productosVerificados = [];

  for (const item of productos) {
    const dbProduct = priceMap.get(item.id);
    if (!dbProduct) {
      return jsonResponse({ error: `Producto ${item.id} no encontrado` }, 400);
    }
    if (!dbProduct.disponible) {
      return jsonResponse({ error: `${dbProduct.nombre} no está disponible` }, 400);
    }
    totalVerificado += Math.round(dbProduct.precio * item.quantity);
    productosVerificados.push({
      id: dbProduct.id,
      name: dbProduct.nombre,
      price: dbProduct.precio,
      quantity: item.quantity,
    });
  }

  const amount = totalVerificado;
  console.log(`[create] Precio verificado server-side: $${amount} (mesa ${numero_mesa})`);

  const buy_order = generateBuyOrder(numero_mesa);
  const session_id = generateSessionId();
  const config = getConfig();

  // URL de retorno: Transbank redirige aquí después del pago
  const return_url = `http://localhost:${PORT}/webpay-confirm`;

  // Registrar en DB antes de llamar a Transbank
  const { error: insertError } = await supabase
    .from('payment_transactions')
    .insert({ buy_order, session_id, amount, numero_mesa, status: 'CREATED' });

  if (insertError) throw new Error(`DB insert: ${insertError.message}`);

  // Crear transacción en Transbank
  const tbk = await createTransaction({
    buy_order, session_id, amount, return_url,
  });

  // Actualizar con token de Transbank
  await supabase
    .from('payment_transactions')
    .update({ tbk_token: tbk.token, status: 'PENDING' })
    .eq('buy_order', buy_order);

  console.log(`[create] OK → order=${buy_order} amount=$${amount} token=${tbk.token.slice(0,8)}...`);
  return jsonResponse({
    token: tbk.token,
    url: tbk.url,
    buy_order,
    amount,
    productos: productosVerificados,
  });
}

// ============================================================================
// HANDLER: webpay-confirm (los 4 flujos de retorno)
// ============================================================================
async function handleConfirm(req: Request): Promise<Response> {
  const config = getConfig();
  const appUrl = config.appUrl;
  const supabase = getSupabase();

  // Extraer params de GET y POST
  const url = new URL(req.url);
  const params = new URLSearchParams(url.search);

  if (req.method === 'POST') {
    try {
      const body = await req.text();
      for (const [k, v] of new URLSearchParams(body).entries()) {
        params.set(k, v);
      }
    } catch { /* ignorar */ }
  }

  const token_ws = params.get('token_ws');
  const TBK_TOKEN = params.get('TBK_TOKEN');
  const TBK_ORDEN_COMPRA = params.get('TBK_ORDEN_COMPRA');

  const redirect = (qs: string) => new Response(null, {
    status: 302,
    headers: { 'Location': `${appUrl}/pago/resultado?${qs}` },
  });

  // FLUJO 1: Normal (aprobado/rechazado) — token_ws presente
  if (token_ws && !TBK_TOKEN) {
    console.log(`[confirm] Flujo normal, token: ${token_ws.slice(0,8)}...`);
    const tbk = await commitTransaction(token_ws);

    const { data: tx } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('tbk_token', token_ws)
      .single();

    if (!tx) return redirect('status=error&reason=tx_not_found');

    const isApproved = tbk.response_code === 0;
    await supabase
      .from('payment_transactions')
      .update({
        status: isApproved ? 'AUTHORIZED' : 'FAILED',
        response_code: tbk.response_code,
        authorization_code: tbk.authorization_code,
        payment_type_code: tbk.payment_type_code,
        installments_number: tbk.installments_number,
        card_number: tbk.card_detail?.card_number,
        transaction_date: tbk.transaction_date,
        raw_response: tbk,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', tx.id);

    console.log(`[confirm] ${isApproved ? 'APROBADO' : 'RECHAZADO'} code=${tbk.response_code}`);
    if (isApproved) {
      return redirect(`status=success&order=${tx.buy_order}&mesa=${tx.numero_mesa}&amount=${tx.amount}`);
    }
    return redirect(`status=failed&order=${tx.buy_order}&code=${tbk.response_code}`);
  }

  // FLUJO 3: Cancelado — TBK_TOKEN presente
  if (TBK_TOKEN) {
    console.log(`[confirm] Cancelación`);
    await supabase
      .from('payment_transactions')
      .update({ status: 'CANCELLED', confirmed_at: new Date().toISOString() })
      .eq('tbk_token', TBK_TOKEN);
    return redirect(`status=cancelled&order=${TBK_ORDEN_COMPRA || 'unknown'}`);
  }

  // FLUJO 2: Timeout — solo TBK_ORDEN_COMPRA
  if (TBK_ORDEN_COMPRA && !token_ws && !TBK_TOKEN) {
    console.log(`[confirm] Timeout`);
    await supabase
      .from('payment_transactions')
      .update({ status: 'TIMEOUT', confirmed_at: new Date().toISOString() })
      .eq('buy_order', TBK_ORDEN_COMPRA);
    return redirect(`status=timeout&order=${TBK_ORDEN_COMPRA}`);
  }

  console.warn(`[confirm] Flujo desconocido`, Object.fromEntries(params));
  return redirect('status=error&reason=unknown_flow');
}

// ============================================================================
// HELPERS Y SERVIDOR
// ============================================================================
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Router principal
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${req.method} ${path}`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (path.includes('webpay-create')) return await handleCreate(req);
    if (path.includes('webpay-confirm')) return await handleConfirm(req);

    return jsonResponse({
      status: 'Webpay Functions Server running',
      routes: ['POST /webpay-create', 'GET|POST /webpay-confirm'],
    });
  } catch (error) {
    console.error('[ERROR]', error);
    return jsonResponse({ error: error.message || 'Error interno' }, 500);
  }
}

// Arrancar servidor
console.log(`\n========================================`);
console.log(`  Webpay Functions Server`);
console.log(`  http://localhost:${PORT}`);
console.log(`========================================\n`);

Deno.serve({ port: PORT }, handler);
