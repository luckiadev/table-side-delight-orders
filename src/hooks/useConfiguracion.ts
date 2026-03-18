import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient, isSupabaseConfigured, supabaseConfigError } from '@/integrations/supabase/client';

export interface SuspensionConfig {
  // Override manual: forzar suspensión independiente del horario
  activa: boolean;
  mensaje: string;
  // Horario de suspensión: la plataforma se desactiva dentro de este rango
  // Se guardan como datetime-local strings: "2026-03-18T19:13" (sin timezone, siempre hora local)
  desde: string | null;  // suspendida DESDE esta hora
  hasta: string | null;  // suspendida HASTA esta hora
}

export type MotivoSuspension = 'manual' | 'horario_programado' | null;

const QUERY_KEY = ['configuracion', 'suspension'];

const DEFAULT_SUSPENSION: SuspensionConfig = {
  activa: false,
  mensaje: '',
  desde: null,
  hasta: null,
};

/**
 * Parsea un datetime-local string a timestamp comparable.
 * Soporta tanto "2026-03-18T19:13" (sin tz) como "2026-03-18T19:13:00-03:00" (con tz).
 * Para strings sin timezone, los trata como hora local del browser.
 */
const parseLocalDatetime = (value: string): number => {
  // Si no tiene timezone info (formato datetime-local puro), forzar interpretación local
  // agregando offset explícito
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    // Formato: "2026-03-18T19:13" o "2026-03-18T19:13:00" — sin Z ni offset
    // new Date() en la mayoría de browsers lo trata como local, pero para seguridad:
    const parts = value.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (parts) {
      const [, y, mo, d, h, mi] = parts;
      return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi)).getTime();
    }
  }
  // Para formatos con timezone, Date lo parsea correctamente
  return new Date(value).getTime();
};

export const useConfiguracion = () => {
  if (!isSupabaseConfigured) {
    throw supabaseConfigError ?? new Error('Supabase no esta configurado.');
  }

  const supabase = getSupabaseClient();
  const queryClient = useQueryClient();

  const { data: suspension, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracion_sitio')
        .select('valor')
        .eq('clave', 'suspension')
        .single();

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
      const current = suspension ?? DEFAULT_SUSPENSION;
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

  /**
   * Determina si la plataforma está suspendida y por qué motivo.
   *
   * Prioridad:
   * 1. Override manual (`activa: true`) → suspendida
   * 2. Dentro del rango desde-hasta → suspendida (horario programado)
   * 3. Caso contrario → activa
   *
   * La lógica es "desactivar desde-hasta": la plataforma está activa por defecto
   * y se suspende solo durante el rango configurado.
   */
  const getMotivoSuspension = (): MotivoSuspension => {
    const cfg = suspension ?? DEFAULT_SUSPENSION;
    const nowTs = Date.now();

    // 1. Override manual
    if (cfg.activa) return 'manual';

    // 2. Suspensión programada: estamos dentro del rango desde-hasta
    if (cfg.desde && cfg.hasta) {
      const desdeTs = parseLocalDatetime(cfg.desde);
      const hastaTs = parseLocalDatetime(cfg.hasta);
      if (nowTs >= desdeTs && nowTs <= hastaTs) return 'horario_programado';
    } else if (cfg.desde && !cfg.hasta) {
      // Solo "desde": suspendida desde esa hora en adelante
      const desdeTs = parseLocalDatetime(cfg.desde);
      if (nowTs >= desdeTs) return 'horario_programado';
    } else if (!cfg.desde && cfg.hasta) {
      // Solo "hasta": suspendida hasta esa hora
      const hastaTs = parseLocalDatetime(cfg.hasta);
      if (nowTs <= hastaTs) return 'horario_programado';
    }

    return null;
  };

  const isSuspendido = (): boolean => {
    return getMotivoSuspension() !== null;
  };

  return {
    suspension: suspension ?? DEFAULT_SUSPENSION,
    isLoading,
    isSuspendido,
    getMotivoSuspension,
    actualizarSuspension: actualizarSuspensionMutation.mutate,
    isUpdating: actualizarSuspensionMutation.isPending,
  };
};
