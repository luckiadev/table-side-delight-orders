import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import { Power, PowerOff, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export const SuspensionControl = () => {
  const { suspension, isSuspendido, actualizarSuspension, isUpdating } = useConfiguracion();
  const [expanded, setExpanded] = useState(false);
  const [mensaje, setMensaje] = useState(suspension.mensaje);
  const [hasta, setHasta] = useState(suspension.hasta ?? '');

  const suspendido = isSuspendido();

  const handleToggle = () => {
    if (suspendido) {
      // Desactivar
      actualizarSuspension({ activa: false, hasta: null });
      setHasta('');
    } else {
      // Activar con los valores actuales del form
      actualizarSuspension({
        activa: true,
        mensaje: mensaje || 'Servicio temporalmente suspendido. Volveremos pronto.',
        hasta: hasta || null,
      });
    }
  };

  const handleGuardarConfig = () => {
    actualizarSuspension({
      mensaje: mensaje || 'Servicio temporalmente suspendido. Volveremos pronto.',
      hasta: hasta || null,
    });
  };

  // Formatear fecha "hasta" para mostrar
  const formatHasta = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString('es-CL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className={`border-2 transition-all duration-300 ${
      suspendido
        ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <CardContent className="p-4">
        {/* Fila principal: estado + toggle */}
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
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  Página de pedidos
                </span>
                <Badge variant={suspendido ? 'destructive' : 'default'} className="text-xs">
                  {suspendido ? 'Suspendida' : 'Activa'}
                </Badge>
              </div>
              {suspendido && suspension.hasta && (
                <div className="flex items-center space-x-1 mt-0.5">
                  <Clock className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-600">
                    Hasta {formatHasta(suspension.hasta)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={suspendido}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
              className="data-[state=checked]:bg-red-600"
            />
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

        {/* Panel expandible: configuración */}
        {expanded && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-4">
            {suspendido && (
              <div className="flex items-start space-x-2 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  La página de pedidos está suspendida. Los clientes ven un mensaje de suspensión en lugar del menú.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="suspension-mensaje" className="text-sm font-medium">
                Mensaje para los clientes
              </Label>
              <Textarea
                id="suspension-mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Ej: Cerrado por evento privado, Mantenimiento programado..."
                className="h-20 resize-none text-sm"
                maxLength={300}
              />
              <p className="text-xs text-gray-400 text-right">{mensaje.length}/300</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suspension-hasta" className="text-sm font-medium">
                Suspender hasta (opcional)
              </Label>
              <Input
                id="suspension-hasta"
                type="datetime-local"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                Si defines una fecha, la página se reactivará automáticamente al llegar esa hora.
                Déjalo vacío para suspensión indefinida (hasta que la reactives manualmente).
              </p>
            </div>

            <Button
              onClick={handleGuardarConfig}
              disabled={isUpdating}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isUpdating ? 'Guardando...' : 'Guardar configuración'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
