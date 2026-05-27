// supabase/functions/webpay-confirm/index.ts
// Recibe el retorno de Transbank después de que el cliente paga/cancela/timeout.
//
// FLUJOS:
// 1. Normal (aprobado/rechazado): GET ?token_ws=xxx
// 2. Timeout:                     GET ?TBK_ORDEN_COMPRA=xxx (sin token_ws ni TBK_TOKEN)
// 3. Cancelado:                   POST/GET con TBK_TOKEN=xxx

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

async function commitTransaction(token: string) {
  const config = getConfig();
  const url = `${config.baseUrl}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: tbkHeaders(config),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Transbank commit error ${response.status}: ${errorBody}`);
  }
  return await response.json();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// ============================================================================
// Handler principal
// ============================================================================
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const config = getConfig();
  const appUrl = config.appUrl;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const url = new URL(req.url);
  const params = new URLSearchParams(url.search);

  if (req.method === 'POST') {
    try {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        params.set(key, value.toString());
      }
    } catch {
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

  function redirectToApp(queryString: string) {
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${appUrl}/pago/resultado?${queryString}` },
    });
  }

  try {
    // FLUJO 1: Normal (aprobado o rechazado)
    if (token_ws && !TBK_TOKEN) {
      console.log('[webpay-confirm] Flujo normal, token_ws:', token_ws);

      const tbkResult = await commitTransaction(token_ws);
      console.log('[webpay-confirm] Commit result:', JSON.stringify(tbkResult));

      const { data: tx } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('tbk_token', token_ws)
        .single();

      if (!tx) {
        console.error('[webpay-confirm] Transacción no encontrada para token:', token_ws);
        return redirectToApp('status=error&reason=tx_not_found');
      }

      const isApproved = tbkResult.response_code === 0;

      await supabase
        .from('payment_transactions')
        .update({
          status: isApproved ? 'AUTHORIZED' : 'FAILED',
          response_code: tbkResult.response_code,
          authorization_code: tbkResult.authorization_code,
          payment_type_code: tbkResult.payment_type_code,
          installments_number: tbkResult.installments_number,
          card_number: tbkResult.card_detail?.card_number,
          transaction_date: tbkResult.transaction_date,
          raw_response: tbkResult,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', tx.id);

      if (isApproved) {
        return redirectToApp(`status=success&order=${tx.buy_order}&mesa=${tx.numero_mesa}&amount=${tx.amount}`);
      } else {
        return redirectToApp(`status=failed&order=${tx.buy_order}&code=${tbkResult.response_code}`);
      }
    }

    // FLUJO 3: Cancelado
    if (TBK_TOKEN) {
      console.log('[webpay-confirm] Flujo cancelación, TBK_TOKEN:', TBK_TOKEN);

      await supabase
        .from('payment_transactions')
        .update({ status: 'CANCELLED', confirmed_at: new Date().toISOString() })
        .eq('tbk_token', TBK_TOKEN);

      const order = TBK_ORDEN_COMPRA || 'unknown';
      return redirectToApp(`status=cancelled&order=${order}`);
    }

    // FLUJO 2: Timeout
    if (TBK_ORDEN_COMPRA && !token_ws && !TBK_TOKEN) {
      console.log('[webpay-confirm] Flujo timeout, orden:', TBK_ORDEN_COMPRA);

      await supabase
        .from('payment_transactions')
        .update({ status: 'TIMEOUT', confirmed_at: new Date().toISOString() })
        .eq('buy_order', TBK_ORDEN_COMPRA);

      return redirectToApp(`status=timeout&order=${TBK_ORDEN_COMPRA}`);
    }

    console.warn('[webpay-confirm] Flujo desconocido. Params:', Object.fromEntries(params));
    return redirectToApp('status=error&reason=unknown_flow');

  } catch (error) {
    console.error('[webpay-confirm] Error:', error);
    return redirectToApp(`status=error&reason=${encodeURIComponent(error.message || 'internal_error')}`);
  }
});
