// src/hooks/useWebpayCreate.ts
// Hook TanStack Query para crear transacciones Webpay
// Llama a la Edge Function en Supabase cloud (proyecto separado del cliente principal)

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// URL del proyecto Supabase cloud donde están desplegadas las Edge Functions
const FUNCTIONS_URL = import.meta.env.VITE_WEBPAY_FUNCTIONS_URL || '';

// Anon key del proyecto Supabase cloud (distinta a la de Easypanel)
const FUNCTIONS_ANON_KEY = import.meta.env.VITE_SUPABASE_FUNCTIONS_ANON_KEY || '';

interface WebpayCreateRequest {
  productos: Array<{ id: string; quantity: number }>;
  numero_mesa: number;
  nota?: string;
}

interface WebpayCreateResponse {
  token: string;
  url: string;
  buy_order: string;
  amount: number;
  productos: Array<{ id: string; name: string; price: number; quantity: number }>;
}

export const useWebpayCreate = () => {
  const { toastError } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: WebpayCreateRequest): Promise<WebpayCreateResponse> => {
      const response = await fetch(`${FUNCTIONS_URL}/webpay-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FUNCTIONS_ANON_KEY}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Error ${response.status}`);
      }

      return result as WebpayCreateResponse;
    },
    onError: (error: Error) => {
      console.error('[useWebpayCreate] Error:', error);
      toastError(error.message || 'Error al iniciar el pago');
    },
  });

  return {
    crearTransaccion: mutation.mutate,
    crearTransaccionAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
};
