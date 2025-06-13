
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Filter, X } from 'lucide-react';

interface FiltroFechasProps {
  onFiltroChange: (fechaInicio?: string, fechaFin?: string) => void;
  fechaInicio?: string;
  fechaFin?: string;
}

export const FiltroFechas = ({ onFiltroChange, fechaInicio, fechaFin }: FiltroFechasProps) => {
  const [fechaInicioLocal, setFechaInicioLocal] = useState(fechaInicio || '');
  const [fechaFinLocal, setFechaFinLocal] = useState(fechaFin || '');

  const handleAplicarFiltro = () => {
    onFiltroChange(fechaInicioLocal || undefined, fechaFinLocal || undefined);
  };

  const handleLimpiarFiltro = () => {
    setFechaInicioLocal('');
    setFechaFinLocal('');
    onFiltroChange();
  };

  const obtenerFechaHoy = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  const obtenerFechaAyer = () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    return ayer.toISOString().split('T')[0];
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Filtrar por Fecha</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="fechaInicio">Fecha Inicio</Label>
            <Input
              id="fechaInicio"
              type="date"
              value={fechaInicioLocal}
              onChange={(e) => setFechaInicioLocal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fechaFin">Fecha Fin</Label>
            <Input
              id="fechaFin"
              type="date"
              value={fechaFinLocal}
              onChange={(e) => setFechaFinLocal(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleAplicarFiltro} className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            <Button variant="outline" onClick={handleLimpiarFiltro}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const ayer = obtenerFechaAyer();
                setFechaInicioLocal(ayer);
                setFechaFinLocal(ayer);
              }}
            >
              Ayer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const hoy = obtenerFechaHoy();
                setFechaInicioLocal(hoy);
                setFechaFinLocal(hoy);
              }}
            >
              Hoy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
