import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pedido } from '@/types/pedido';
import { Clock, MapPin, DollarSign, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { formatNumber } from "@/lib/formatNumber";
import { useBreakpoint } from '@/hooks/use-mobile';

interface PedidoCardProps {
  pedido: Pedido;
  onUpdateEstado: (id: string, estado: Pedido['estado']) => void;
  isUpdating: boolean;
}

const getEstadoConfig = (estado: Pedido['estado']) => {
  switch (estado) {
    case 'Pendiente':
      return {
        color: 'bg-yellow-500 text-white',
        icon: AlertCircle,
        borderColor: 'border-l-yellow-500'
      };
    case 'En Preparación':
      return {
        color: 'bg-blue-500 text-white',
        icon: Package,
        borderColor: 'border-l-blue-500'
      };
    case 'Preparado':
      return {
        color: 'bg-green-500 text-white',
        icon: CheckCircle,
        borderColor: 'border-l-green-500'
      };
    case 'Entregado':
      return {
        color: 'bg-gray-500 text-white',
        icon: CheckCircle,
        borderColor: 'border-l-gray-400'
      };
    default:
      return {
        color: 'bg-gray-500 text-white',
        icon: AlertCircle,
        borderColor: 'border-l-gray-400'
      };
  }
};

export const PedidoCard = ({ pedido, onUpdateEstado, isUpdating }: PedidoCardProps) => {
  const { isMobile } = useBreakpoint();
  const estadoConfig = getEstadoConfig(pedido.estado);
  const IconComponent = estadoConfig.icon;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Hace menos de 1 min';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `Hace ${diffHours}h ${diffMinutes % 60}min`;
  };

  return (
    <Card className={`w-full hover:shadow-lg transition-all duration-200 border-l-4 ${estadoConfig.borderColor} ${
      pedido.estado === 'Preparado' ? 'ring-2 ring-green-100' : ''
    }`}>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-lg sm:text-xl font-bold flex items-center space-x-2">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            <span>Mesa {pedido.numero_mesa}</span>
          </CardTitle>
          
          <Badge className={`${estadoConfig.color} flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1`}>
            <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{pedido.estado}</span>
          </Badge>
        </div>
        
        {/* Información de tiempo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{formatTime(pedido.fecha_pedido)}</span>
          </div>
          
          <div className="text-xs text-gray-500">
            {getTimeAgo(pedido.fecha_pedido)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Lista de Productos */}
        <div className="space-y-2">
          {pedido.productos.map((producto, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center text-sm py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium">
                  {producto.quantity}x {producto.name}
                </span>
                {isMobile && (
                  <div className="text-xs text-gray-600 mt-1">
                    ${formatNumber(producto.price)} c/u
                  </div>
                )}
              </div>
              
              <div className="text-right ml-2">
                <span className="font-semibold text-sm sm:text-base">
                  ${formatNumber(producto.price * producto.quantity)}
                </span>
                {!isMobile && (
                  <div className="text-xs text-gray-500">
                    ${formatNumber(producto.price)} c/u
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Total y Tiempo */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <div>
              <span className="text-xs text-gray-500 block sm:inline sm:mr-2">Total:</span>
              <span className="font-bold text-lg sm:text-xl text-green-600">
                ${formatNumber(pedido.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Selector de Estado */}
        {pedido.estado !== 'Entregado' && (
          <div className="pt-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Cambiar estado:
            </div>
            <Select
              value={pedido.estado}
              onValueChange={(value) => onUpdateEstado(pedido.id, value as Pedido['estado'])}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-10 sm:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente" className="flex items-center">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <span>Pendiente</span>
                  </div>
                </SelectItem>
                <SelectItem value="En Preparación">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span>En Preparación</span>
                  </div>
                </SelectItem>
                <SelectItem value="Preparado">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Preparado</span>
                  </div>
                </SelectItem>
                <SelectItem value="Entregado">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                    <span>Entregado</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Marca de entregado */}
        {pedido.estado === 'Entregado' && (
          <div className="pt-3">
            <div className="flex items-center justify-center space-x-2 py-2 px-4 bg-gray-100 rounded-lg">
              <CheckCircle className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600 font-medium">Pedido Entregado</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};