// src/hooks/useWebpayCreate.ts
// Hook TanStack Query para crear transacciones Webpay
// Usa supabase.functions.invoke() para incluir el Authorization header automáticamente

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient } from '@/integrations/supabase/client';

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
  const supabase = getSupabaseClient();

  const mutation = useMutation({
    mutationFn: async (data: WebpayCreateRequest): Promise<WebpayCreateResponse> => {
      const { data: result, error } = await supabase.functions.invoke('webpay-create', {
        body: data,
      });

      if (error) {
        throw new Error(error.message || 'Error al iniciar el pago');
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
