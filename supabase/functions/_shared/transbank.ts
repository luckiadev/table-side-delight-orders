// supabase/functions/_shared/transbank.ts
// Helpers para comunicación con Transbank REST API via fetch()
// NO usa el SDK de Node.js — llamadas directas a la API REST

// ============================================================================
// Configuración por entorno
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

export function getConfig() {
  const env = (Deno.env.get('TRANSBANK_ENV') || 'integration') as keyof typeof ENVS;
  const defaults = ENVS[env] || ENVS.integration;

  return {
    baseUrl: defaults.baseUrl,
    commerceCode: Deno.env.get('TBK_COMMERCE_CODE') || defaults.commerceCode,
    apiKey: Deno.env.get('TBK_API_KEY') || defaults.apiKey,
    appUrl: Deno.env.get('APP_URL') || 'http://localhost:8080',
  };
}

// ============================================================================
// Headers comunes para Transbank
// ============================================================================
function tbkHeaders(config: ReturnType<typeof getConfig>) {
  return {
    'Tbk-Api-Key-Id': config.commerceCode,
    'Tbk-Api-Key-Secret': config.apiKey,
    'Content-Type': 'application/json',
  };
}

// ============================================================================
// Crear transacción en Transbank
// POST /rswebpaytransaction/api/webpay/v1.2/transactions
// ============================================================================
export interface CreateTxRequest {
  buy_order: string;
  session_id: string;
  amount: number;
  return_url: string;
}

export interface CreateTxResponse {
  token: string;
  url: string;
}

export async function createTransaction(req: CreateTxRequest): Promise<CreateTxResponse> {
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

  return await response.json() as CreateTxResponse;
}

// ============================================================================
// Confirmar (commit) transacción en Transbank
// PUT /rswebpaytransaction/api/webpay/v1.2/transactions/{token}
// ============================================================================
export interface CommitTxResponse {
  vci: string;
  amount: number;
  status: string;
  buy_order: string;
  session_id: string;
  card_detail: { card_number: string };
  accounting_date: string;
  transaction_date: string;
  authorization_code: string;
  payment_type_code: string;
  response_code: number;
  installments_number: number;
}

export async function commitTransaction(token: string): Promise<CommitTxResponse> {
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

  return await response.json() as CommitTxResponse;
}

// ============================================================================
// Generar buy_order compatible con Transbank (máx 26 chars)
// Formato: M{mesa}-{timestamp}
// ============================================================================
export function generateBuyOrder(mesa: number): string {
  const ts = Date.now().toString(36).toUpperCase();
  const order = `M${mesa}-${ts}`;
  return order.substring(0, 26);
}

// ============================================================================
// Generar session_id (máx 61 chars)
// ============================================================================
export function generateSessionId(): string {
  return `s-${crypto.randomUUID()}`;
}

// ============================================================================
// CORS headers para respuestas desde Edge Functions
// ============================================================================
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
