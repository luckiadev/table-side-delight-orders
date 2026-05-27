// supabase/functions/webpay-create/index.ts
// Crea una transacción en Transbank validando precios server-side desde Supabase.
// El cliente envía IDs y cantidades; el servidor consulta precios reales.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// Transbank helpers (inlineados para evitar problemas de resolución de imports)
// ============================================================================
const ENVS = {
  integration: {
    baseUrl: 'https://webpay3gint.transbank.cl',
    commerceCode: '597055555532',
    apiKey: '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
  },
  production: {
    baseUrl: 'https://webpay3g.transbank.cl',
    commerceCode: '',
    apiKey: '',
  },
} as const;

function getConfig() {
  const env = (Deno.env.get('TRANSBANK_ENV') || 'integration') as keyof typeof ENVS;
  const defaults = ENVS[env] || ENVS.integration;
  return {
    baseUrl: defaults.baseUrl,
    commerceCode: Deno.env.get('TBK_COMMERCE_CODE') || defaults.commerceCode,
    apiKey: Deno.env.get('TBK_API_KEY') || defaults.apiKey,
    appUrl: Deno.env.get('APP_URL') || 'http://localhost:8080',
  };
}

function tbkHeaders(config: ReturnType<typeof getConfig>) {
  return {
    'Tbk-Api-Key-Id': config.commerceCode,
    'Tbk-Api-Key-Secret': config.apiKey,
    'Content-Type': 'application/json',
  };
}

async function createTransaction(req: {
  buy_order: string;
  session_id: string;
  amount: number;
  return_url: string;
}): Promise<{ token: string; url: string }> {
  const config = getConfig();
  const url = `${config.baseUrl}/rswebpaytransaction/api/webpay/v1.2/transactions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: tbkHeaders(config),
    body: JSON.stringify(req),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Transbank create error ${response.status}: ${errorBody}`);
  }
  return await response.json();
}

function generateBuyOrder(mesa: number): string {
  const ts = Date.now().toString(36).toUpperCase();
  return `M${mesa}-${ts}`.substring(0, 26);
}

function generateSessionId(): string {
  return `s-${crypto.randomUUID()}`;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// ============================================================================
// Handler principal
// ============================================================================
const MAX_QUANTITY_PER_ITEM = 20;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Parsear body
    const body = await req.json();
    const { productos: itemsCliente, numero_mesa, nota } = body;

    if (!Array.isArray(itemsCliente) || itemsCliente.length === 0) {
      return new Response(
        JSON.stringify({ error: 'productos es requerido y debe ser un array no vacío' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!numero_mesa || !Number.isInteger(numero_mesa) || numero_mesa <= 0) {
      return new Response(
        JSON.stringify({ error: 'numero_mesa debe ser un entero positivo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const item of itemsCliente) {
      if (typeof item.id !== 'string' || !item.id) {
        return new Response(
          JSON.stringify({ error: 'Cada producto debe tener un id válido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > MAX_QUANTITY_PER_ITEM) {
        return new Response(
          JSON.stringify({ error: `Cantidad inválida para producto ${item.id}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Cliente Supabase con service_role (bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Consultar precios reales desde la BD
    const ids = itemsCliente.map((i: { id: string }) => i.id);
    const { data: productosDB, error: dbError } = await supabase
      .from('productos')
      .select('id, nombre, precio, disponible')
      .in('id', ids);

    if (dbError) {
      throw new Error(`Error consultando productos: ${dbError.message}`);
    }

    const productosMap = new Map(productosDB.map((p: any) => [p.id, p]));

    for (const item of itemsCliente) {
      const prod = productosMap.get(item.id);
      if (!prod) {
        return new Response(
          JSON.stringify({ error: `Producto no encontrado: ${item.id}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!prod.disponible) {
        return new Response(
          JSON.stringify({ error: `Producto no disponible: ${prod.nombre}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Calcular total con precios reales
    const productosVerificados = itemsCliente.map((item: { id: string; quantity: number }) => {
      const prod = productosMap.get(item.id);
      return { id: prod.id, name: prod.nombre, price: prod.precio, quantity: item.quantity };
    });

    const amount = productosVerificados.reduce(
      (sum: number, p: { price: number; quantity: number }) => sum + p.price * p.quantity,
      0
    );

    if (!Number.isInteger(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'El total calculado no es válido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Idempotencia: verificar transacción PENDING para esta mesa
    const { data: existing } = await supabase
      .from('payment_transactions')
      .select('id, buy_order, tbk_token, status')
      .eq('numero_mesa', numero_mesa)
      .in('status', ['CREATED', 'PENDING'])
      .limit(1)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          error: 'Ya existe una transacción en curso para esta mesa',
          existing_order: existing.buy_order,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Generar identificadores
    const buy_order = generateBuyOrder(numero_mesa);
    const session_id = generateSessionId();
    const config = getConfig();

    const confirmFnUrl = Deno.env.get('WEBPAY_CONFIRM_URL')
      || `${Deno.env.get('SUPABASE_URL')}/functions/v1/webpay-confirm`;

    // 7. Insertar registro CREATED en DB
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        buy_order,
        session_id,
        amount,
        numero_mesa,
        nota: nota || null,
        productos: productosVerificados,
        status: 'CREATED',
      });

    if (insertError) {
      throw new Error(`DB insert error: ${insertError.message}`);
    }

    // 8. Llamar a Transbank
    const tbkResponse = await createTransaction({
      buy_order,
      session_id,
      amount,
      return_url: confirmFnUrl,
    });

    // 9. Actualizar con token y estado PENDING
    await supabase
      .from('payment_transactions')
      .update({ tbk_token: tbkResponse.token, status: 'PENDING' })
      .eq('buy_order', buy_order);

    // 10. Retornar al frontend con precios verificados
    return new Response(
      JSON.stringify({
        token: tbkResponse.token,
        url: tbkResponse.url,
        buy_order,
        amount,
        productos: productosVerificados,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en webpay-create:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
