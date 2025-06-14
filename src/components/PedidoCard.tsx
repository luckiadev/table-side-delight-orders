import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pedido } from '@/types/pedido';
import { Clock, MapPin, DollarSign } from 'lucide-react';
import { formatNumber } from "@/lib/formatNumber";

interface PedidoCardProps {
  pedido: Pedido;
  onUpdateEstado: (id: string, estado: Pedido['estado']) => void;
  isUpdating: boolean;
}

const getEstadoColor = (estado: Pedido['estado']) => {
  switch (estado) {
    case 'Pendiente':
      return 'bg-yellow-500';
    case 'En Preparación':
      return 'bg-blue-500';
    case 'Preparado':
      return 'bg-green-500';
    case 'Entregado':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

export const PedidoCard = ({ pedido, onUpdateEstado, isUpdating }: PedidoCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">
          Mesa {pedido.numero_mesa}
        </CardTitle>
        <Badge className={getEstadoColor(pedido.estado)}>
          {pedido.estado}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {pedido.productos.map((producto, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span>
                {producto.quantity}x {producto.name}
              </span>
              <span className="font-medium">
                ${formatNumber(producto.price * producto.quantity)}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span className="font-bold text-lg">
              ${formatNumber(pedido.total)}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              {new Date(pedido.fecha_pedido).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {pedido.estado !== 'Entregado' && (
          <div className="pt-2">
            <Select
              value={pedido.estado}
              onValueChange={(value) => onUpdateEstado(pedido.id, value as Pedido['estado'])}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="En Preparación">En Preparación</SelectItem>
                <SelectItem value="Preparado">Preparado</SelectItem>
                <SelectItem value="Entregado">Entregado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
