import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient, isSupabaseConfigured, supabaseConfigError } from '@/integrations/supabase/client';

export interface SuspensionConfig {
  activa: boolean;
  mensaje: string;
  hasta: string | null; // ISO date string or null
}

const QUERY_KEY = ['configuracion', 'suspension'];

export const useConfiguracion = () => {
  if (!isSupabaseConfigured) {
    throw supabaseConfigError ?? new Error('Supabase no esta configurado.');
  }

  const supabase = getSupabaseClient();
  const queryClient = useQueryClient();

  const DEFAULT_SUSPENSION: SuspensionConfig = { activa: false, mensaje: '', hasta: null };

  const { data: suspension, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracion_sitio')
        .select('valor')
        .eq('clave', 'suspension')
        .single();

      // Si la tabla no existe (404) o no hay registro, devolver config por defecto
      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('Not Found')) {
          return DEFAULT_SUSPENSION;
        }
        throw error;
      }

      return data.valor as unknown as SuspensionConfig;
    },
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
    retry: 1,
  });

  const actualizarSuspensionMutation = useMutation({
    mutationFn: async (config: Partial<SuspensionConfig>) => {
      // Merge con la configuración actual
      const current = suspension ?? { activa: false, mensaje: '', hasta: null };
      const merged = { ...current, ...config };

      const { data, error } = await supabase
        .from('configuracion_sitio')
        .update({ valor: merged as unknown as Record<string, unknown> })
        .eq('clave', 'suspension')
        .select('valor')
        .single();

      if (error) throw error;

      return data.valor as unknown as SuspensionConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Verificar si la suspensión está activa considerando la fecha "hasta"
  const isSuspendido = (): boolean => {
    if (!suspension?.activa) return false;

    if (suspension.hasta) {
      const hastaDate = new Date(suspension.hasta);
      if (hastaDate <= new Date()) {
        // La suspensión expiró — desactivar automáticamente
        actualizarSuspensionMutation.mutate({ activa: false, hasta: null });
        return false;
      }
    }

    return true;
  };

  return {
    suspension: suspension ?? DEFAULT_SUSPENSION,
    isLoading,
    isSuspendido,
    actualizarSuspension: actualizarSuspensionMutation.mutate,
    isUpdating: actualizarSuspensionMutation.isPending,
  };
};
