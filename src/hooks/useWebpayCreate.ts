// src/hooks/useWebpayCreate.ts
// Hook TanStack Query para crear transacciones Webpay
// JWT desactivado en webpay-create (requerido: clientes anónimos + instancia Supabase separada)
// Seguridad: precios y disponibilidad validados server-side en la Edge Function

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const FUNCTIONS_URL = import.meta.env.VITE_WEBPAY_FUNCTIONS_URL || '';

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
        headers: { 'Content-Type': 'application/json' },
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
