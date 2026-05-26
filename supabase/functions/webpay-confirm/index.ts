// supabase/functions/webpay-confirm/index.ts
// Recibe el retorno de Transbank después de que el cliente paga/cancela/timeout
// Maneja los 4 flujos de retorno y redirige a la SPA con el resultado
//
// FLUJOS:
// 1. Normal (aprobado/rechazado): GET ?token_ws=xxx
// 2. Timeout:                     GET ?TBK_ORDEN_COMPRA=xxx (sin token_ws ni TBK_TOKEN)
// 3. Cancelado:                   POST/GET con TBK_TOKEN=xxx
// 4. Cierre pestaña:              No hay callback (limpieza por job)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getConfig, commitTransaction, corsHeaders } from '../_shared/transbank.ts';

Deno.serve(async (req: Request) => {
  // CORS preflight (por si se llama desde JS, aunque normalmente es redirect)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const config = getConfig();
  const appUrl = config.appUrl;

  // Supabase client con service_role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Extraer parámetros de GET (query string) y POST (form body)
  const url = new URL(req.url);
  const params = new URLSearchParams(url.search);

  // Si es POST, también leer form data (Transbank puede enviar POST en cancelación)
  if (req.method === 'POST') {
    try {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        params.set(key, value.toString());
      }
    } catch {
      // Si falla el parse de form data, intentar con body text
      try {
        const body = await req.text();
        const bodyParams = new URLSearchParams(body);
        for (const [key, value] of bodyParams.entries()) {
          params.set(key, value);
        }
      } catch { /* ignorar */ }
    }
  }

  const token_ws = params.get('token_ws');
  const TBK_TOKEN = params.get('TBK_TOKEN');
  const TBK_ORDEN_COMPRA = params.get('TBK_ORDEN_COMPRA');

  // Helper para redirigir a la SPA
  function redirectToApp(queryString: string) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${appUrl}/pago/resultado?${queryString}`,
      },
    });
  }

  try {
    // ================================================================
    // FLUJO 1: Normal (aprobado o rechazado)
    // Transbank envía GET con ?token_ws=xxx
    // ================================================================
    if (token_ws && !TBK_TOKEN) {
      console.log('[webpay-confirm] Flujo normal, token_ws:', token_ws);

      // Confirmar con Transbank (commit)
      const tbkResult = await commitTransaction(token_ws);
      console.log('[webpay-confirm] Commit result:', JSON.stringify(tbkResult));

      // Buscar la transacción en nuestra DB por token
      const { data: tx } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('tbk_token', token_ws)
        .single();

      if (!tx) {
        console.error('[webpay-confirm] Transacción no encontrada para token:', token_ws);
        return redirectToApp('status=error&reason=tx_not_found');
      }

      // Verificar response_code: 0 = aprobado, otro = rechazado
      const isApproved = tbkResult.response_code === 0;

      // Actualizar transacción en DB
      const updateData: Record<string, any> = {
        status: isApproved ? 'AUTHORIZED' : 'FAILED',
        response_code: tbkResult.response_code,
        authorization_code: tbkResult.authorization_code,
        payment_type_code: tbkResult.payment_type_code,
        installments_number: tbkResult.installments_number,
        card_number: tbkResult.card_detail?.card_number,
        transaction_date: tbkResult.transaction_date,
        raw_response: tbkResult,
        confirmed_at: new Date().toISOString(),
      };

      await supabase
        .from('payment_transactions')
        .update(updateData)
        .eq('id', tx.id);

      if (isApproved) {
        // Redirigir con datos de éxito
        const qs = `status=success&order=${tx.buy_order}&mesa=${tx.numero_mesa}&amount=${tx.amount}`;
        return redirectToApp(qs);
      } else {
        // Pago rechazado
        const qs = `status=failed&order=${tx.buy_order}&code=${tbkResult.response_code}`;
        return redirectToApp(qs);
      }
    }

    // ================================================================
    // FLUJO 3: Usuario canceló en el formulario de Transbank
    // Transbank envía TBK_TOKEN + TBK_ORDEN_COMPRA
    // ================================================================
    if (TBK_TOKEN) {
      console.log('[webpay-confirm] Flujo cancelación, TBK_TOKEN:', TBK_TOKEN);

      await supabase
        .from('payment_transactions')
        .update({
          status: 'CANCELLED',
          confirmed_at: new Date().toISOString(),
        })
        .eq('tbk_token', TBK_TOKEN);

      const order = TBK_ORDEN_COMPRA || 'unknown';
      return redirectToApp(`status=cancelled&order=${order}`);
    }

    // ================================================================
    // FLUJO 2: Timeout — solo llega TBK_ORDEN_COMPRA sin tokens
    // ================================================================
    if (TBK_ORDEN_COMPRA && !token_ws && !TBK_TOKEN) {
      console.log('[webpay-confirm] Flujo timeout, orden:', TBK_ORDEN_COMPRA);

      await supabase
        .from('payment_transactions')
        .update({
          status: 'TIMEOUT',
          confirmed_at: new Date().toISOString(),
        })
        .eq('buy_order', TBK_ORDEN_COMPRA);

      return redirectToApp(`status=timeout&order=${TBK_ORDEN_COMPRA}`);
    }

    // ================================================================
    // FLUJO DESCONOCIDO: no se recibió ningún parámetro esperado
    // ================================================================
    console.warn('[webpay-confirm] Flujo desconocido. Params:', Object.fromEntries(params));
    return redirectToApp('status=error&reason=unknown_flow');

  } catch (error) {
    console.error('[webpay-confirm] Error:', error);
    return redirectToApp(`status=error&reason=${encodeURIComponent(error.message || 'internal_error')}`);
  }
});
