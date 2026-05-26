// supabase/functions/webpay-create/index.ts
// Crea una transacción en Transbank y registra en payment_transactions
// Llamado por el frontend React cuando el cliente presiona "Pagar"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getConfig,
  createTransaction,
  generateBuyOrder,
  generateSessionId,
  corsHeaders,
} from '../_shared/transbank.ts';

Deno.serve(async (req: Request) => {
  // Preflight CORS
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
    const { amount, numero_mesa } = await req.json();

    if (!amount || !numero_mesa) {
      return new Response(
        JSON.stringify({ error: 'amount y numero_mesa son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'amount debe ser un entero positivo (CLP sin decimales)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Cliente Supabase con service_role (bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Idempotencia: verificar que no haya transacción PENDING para esta mesa
    const { data: existing } = await supabase
      .from('payment_transactions')
      .select('id, buy_order, tbk_token, status')
      .eq('numero_mesa', numero_mesa)
      .in('status', ['CREATED', 'PENDING'])
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Ya hay una transacción en curso para esta mesa
      return new Response(
        JSON.stringify({
          error: 'Ya existe una transacción en curso para esta mesa',
          existing_order: existing.buy_order,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Generar identificadores
    const buy_order = generateBuyOrder(numero_mesa);
    const session_id = generateSessionId();
    const config = getConfig();

    // 5. URL de retorno: Transbank redirige al usuario aquí después del pago
    // Debe apuntar a la Edge Function webpay-confirm (URL pública)
    const confirmFnUrl = Deno.env.get('WEBPAY_CONFIRM_URL')
      || `${Deno.env.get('SUPABASE_URL')}/functions/v1/webpay-confirm`;
    const return_url = confirmFnUrl;

    // 6. Insertar registro CREATED en DB antes de llamar a Transbank
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        buy_order,
        session_id,
        amount,
        numero_mesa,
        status: 'CREATED',
      });

    if (insertError) {
      console.error('Error insertando transacción:', insertError);
      throw new Error(`DB insert error: ${insertError.message}`);
    }

    // 7. Llamar a Transbank para crear la transacción
    const tbkResponse = await createTransaction({
      buy_order,
      session_id,
      amount,
      return_url,
    });

    // 8. Actualizar registro con token y estado PENDING
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        tbk_token: tbkResponse.token,
        status: 'PENDING',
      })
      .eq('buy_order', buy_order);

    if (updateError) {
      console.error('Error actualizando transacción:', updateError);
    }

    // 9. Retornar token y URL al frontend
    // El frontend hará un POST con form hidden a tbkResponse.url + token_ws
    return new Response(
      JSON.stringify({
        token: tbkResponse.token,
        url: tbkResponse.url,
        buy_order,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error en webpay-create:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
