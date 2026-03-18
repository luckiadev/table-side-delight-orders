import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import { Power, PowerOff, Clock, AlertTriangle, ChevronDown, ChevronUp, Calendar, Ban } from 'lucide-react';

/**
 * Formatea un datetime-local string ("2026-03-18T19:13") a texto legible 24h.
 * No usa new Date() para evitar problemas de timezone.
 */
const formatFechaLocal = (datetimeLocal: string) => {
  if (!datetimeLocal) return '';
  // Parsear manualmente: "2026-03-18T19:13" o "2026-03-18T19:13:00-03:00"
  // Usar new Date() solo para toLocaleString con hora local del browser
  const date = new Date(datetimeLocal);
  return date.toLocaleString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * Convierte cualquier formato de fecha guardado al formato datetime-local del input.
 * Siempre usa la hora local del browser.
 */
const toDatetimeLocal = (value: string): string => {
  if (!value) return '';
  // Si ya tiene formato datetime-local (sin timezone), devolver tal cual
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
  // Si tiene timezone u otro formato, convertir via Date a local
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${d}T${h}:${mi}`;
};

export const SuspensionControl = () => {
  const { suspension, isSuspendido, getMotivoSuspension, actualizarSuspension, isUpdating } = useConfiguracion();
  const [expanded, setExpanded] = useState(false);
  const [mensaje, setMensaje] = useState(suspension.mensaje);
  const [desde, setDesde] = useState(toDatetimeLocal(suspension.desde ?? ''));
  const [hasta, setHasta] = useState(toDatetimeLocal(suspension.hasta ?? ''));

  // Sincronizar estado local cuando cambia la config remota
  useEffect(() => {
    setMensaje(suspension.mensaje);
    setDesde(toDatetimeLocal(suspension.desde ?? ''));
    setHasta(toDatetimeLocal(suspension.hasta ?? ''));
  }, [suspension.mensaje, suspension.desde, suspension.hasta]);

  const suspendido = isSuspendido();
  const motivo = getMotivoSuspension();
  const tieneHorario = Boolean(suspension.desde || suspension.hasta);

  // Toggle de suspensión manual
  const handleToggleManual = () => {
    if (suspension.activa) {
      actualizarSuspension({ activa: false });
    } else {
      actualizarSuspension({
        activa: true,
        mensaje: mensaje || 'Servicio temporalmente suspendido. Volveremos pronto.',
      });
    }
  };

  // Guardar horario — guardar como datetime-local puro (sin timezone)
  const handleGuardarHorario = () => {
    actualizarSuspension({
      mensaje: mensaje || 'Servicio temporalmente suspendido. Volveremos pronto.',
      desde: desde || null,
      hasta: hasta || null,
    });
  };

  // Limpiar horario
  const handleLimpiarHorario = () => {
    setDesde('');
    setHasta('');
    actualizarSuspension({ desde: null, hasta: null });
  };

  // Texto descriptivo del estado
  const getEstadoTexto = () => {
    if (!suspendido) {
      if (tieneHorario) return 'Activa (suspensión programada)';
      return 'Activa';
    }
    switch (motivo) {
      case 'manual': return 'Suspendida manualmente';
      case 'horario_programado': return 'Suspendida (programada)';
      default: return 'Suspendida';
    }
  };

  return (
    <Card className={`border-2 transition-all duration-300 ${
      suspendido
        ? 'border-red-300 bg-red-50/50'
        : 'border-green-200 bg-green-50/30'
    }`}>
      <CardContent className="p-4">
        {/* Fila principal: estado + controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {suspendido ? (
              <div className="relative">
                <PowerOff className="h-5 w-5 text-red-600" />
                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-ping" />
              </div>
            ) : (
              <Power className="h-5 w-5 text-green-600" />
            )}
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-semibold text-sm text-gray-900">
                  Página de pedidos
                </span>
                <Badge variant={suspendido ? 'destructive' : 'default'} className="text-xs">
                  {getEstadoTexto()}
                </Badge>
              </div>
              {/* Info de suspensión programada */}
              {tieneHorario && !suspension.activa && (
                <div className="flex items-center space-x-1 mt-0.5">
                  <Clock className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-600">
                    {suspension.desde && suspension.hasta
                      ? `Suspendida: ${formatFechaLocal(suspension.desde)} → ${formatFechaLocal(suspension.hasta)}`
                      : suspension.desde
                        ? `Suspendida desde ${formatFechaLocal(suspension.desde)}`
                        : `Suspendida hasta ${formatFechaLocal(suspension.hasta!)}`
                    }
                  </span>
                </div>
              )}
              {suspension.activa && (
                <div className="flex items-center space-x-1 mt-0.5">
                  <Ban className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-600">Suspensión forzada por administrador</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Panel expandible */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-5">

            {/* SECCIÓN 1: Suspensión programada (desde - hasta) */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-sm text-gray-900">Suspensión programada</span>
              </div>
              <p className="text-xs text-gray-500">
                La plataforma se desactiva automáticamente durante el rango definido.
                Los clientes verán un mensaje de cierre en ese período.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="horario-desde" className="text-sm font-medium text-red-700">
                    Desactivar desde
                  </Label>
                  <Input
                    id="horario-desde"
                    type="datetime-local"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                    className="text-sm border-red-200 focus:border-red-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="horario-hasta" className="text-sm font-medium text-green-700">
                    Reactivar a las
                  </Label>
                  <Input
                    id="horario-hasta"
                    type="datetime-local"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                    className="text-sm border-green-200 focus:border-green-400"
                  />
                </div>
              </div>

              {/* Validación visual: desde debe ser antes que hasta */}
              {desde && hasta && new Date(desde) >= new Date(hasta) && (
                <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs text-yellow-700">
                    La fecha "desde" debe ser anterior a la fecha "hasta".
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={handleGuardarHorario}
                  disabled={isUpdating}
                  size="sm"
                  className="flex-1"
                >
                  {isUpdating ? 'Guardando...' : 'Guardar horario'}
                </Button>
                {tieneHorario && (
                  <Button
                    onClick={handleLimpiarHorario}
                    disabled={isUpdating}
                    variant="outline"
                    size="sm"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: Suspensión manual (override) */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Ban className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-sm text-gray-900">Suspensión manual</span>
                </div>
                <Switch
                  checked={suspension.activa}
                  onCheckedChange={handleToggleManual}
                  disabled={isUpdating}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
              <p className="text-xs text-gray-500">
                Fuerza la suspensión inmediata, sin importar el horario configurado.
                Útil para emergencias o eventos especiales.
              </p>

              {suspension.activa && (
                <div className="flex items-start space-x-2 p-3 bg-red-100 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    La página está suspendida manualmente. Los clientes ven el mensaje de suspensión.
                  </p>
                </div>
              )}
            </div>

            {/* SECCIÓN 3: Mensaje personalizado */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="suspension-mensaje" className="text-sm font-medium">
                Mensaje para los clientes
              </Label>
              <Textarea
                id="suspension-mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Ej: Cerrado por evento privado, Abrimos a las 12:00, etc..."
                className="h-20 resize-none text-sm"
                maxLength={300}
              />
              <p className="text-xs text-gray-400 text-right">{mensaje.length}/300</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
