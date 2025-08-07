import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Plus, Minus, StickyNote } from 'lucide-react';
import { Producto } from '@/types/pedido';
import { useState, useEffect } from 'react';
import { formatNumber } from "@/lib/formatNumber";
import { useBreakpoint } from '@/hooks/use-mobile';

interface CarritoComprasProps {
  cart: Producto[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCreateOrder: (numeroMesa: number, nota: string) => void;
  isCreating: boolean;
  numeroMesaInicial?: number;
}

export const CarritoCompras = ({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCreateOrder, 
  isCreating,
  numeroMesaInicial
}: CarritoComprasProps) => {
  const [numeroMesa, setNumeroMesa] = useState<number>(numeroMesaInicial || 1);
  const [nota, setNota] = useState<string>('');
  const { isMobile, isTablet } = useBreakpoint();

  useEffect(() => {
    if (numeroMesaInicial !== undefined) {
      setNumeroMesa(numeroMesaInicial);
    }
  }, [numeroMesaInicial]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCreateOrder = () => {
    if (cart.length === 0) return;
    if (numeroMesa < 0 || numeroMesa > 500) return;
    onCreateOrder(numeroMesa, nota);
    setNota('');
  };

  if (cart.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center justify-center sm:justify-start space-x-2 text-lg sm:text-xl">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Carrito</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 sm:py-12">
            <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
            <p className="text-gray-500 text-sm sm:text-base">
              El carrito está vacío
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Agrega productos del menú
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-lg sm:text-xl">Carrito Test</span>
            <span className="bg-primary text-primary-foreground text-xs sm:text-sm px-2 py-0.5 rounded-full">
              {cart.length}
            </span>
          </div>
          {isMobile && (
            <div className="text-right">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-lg font-bold">${formatNumber(total)}</div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Lista de Productos */}
        <div className="space-y-3">
          {cart.map((item) => (
            <div 
              key={item.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base truncate">
                  {item.name}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  ${formatNumber(item.price)} c/u
                </div>
                {isMobile && (
                  <div className="text-sm font-medium text-gray-800 mt-1">
                    Subtotal: ${formatNumber(item.price * item.quantity)}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between sm:justify-end space-x-3">
                {/* Controles de Cantidad */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <div className="w-12 text-center">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-full h-8 text-center text-sm"
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Botón Eliminar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Total (Solo en Desktop/Tablet) */}
        {!isMobile && (
          <div className="flex justify-between items-center font-bold text-lg sm:text-xl">
            <span>Total:</span>
            <span>${formatNumber(total)}</span>
          </div>
        )}

        {/* Mesa Input */}
        <div className="space-y-2">
          <Label htmlFor="mesa" className="text-sm sm:text-base">
            Número de Mesa (0-500)
            {numeroMesaInicial !== undefined && (
              <span className="text-xs sm:text-sm text-blue-600 font-normal ml-2">
                (Pre-configurado)
              </span>
            )}
          </Label>
          <Input
            id="mesa"
            type="number"
            min="0"
            max="500"
            value={numeroMesa}
            onChange={(e) => setNumeroMesa(parseInt(e.target.value) || 0)}
            placeholder="Ingrese número de mesa"
            disabled={numeroMesaInicial !== undefined}
            className={`h-10 sm:h-11 text-base ${numeroMesaInicial !== undefined ? "bg-blue-50" : ""}`}
          />
        </div>

        {/* Input para Nota */}
        <div className="space-y-2">
          <Label htmlFor="nota" className="text-sm sm:text-base flex items-center space-x-1">
            <StickyNote className="h-4 w-4 text-blue-600" />
            <span>Nota del pedido</span>
            <span className="text-xs text-gray-500 font-normal">(Opcional)</span>
          </Label>
          <Textarea
            id="nota"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: Mesero Juan, Cliente directo, Mesa VIP, etc..."
            className="h-20 sm:h-24 resize-none text-sm sm:text-base"
            maxLength={200}
          />
          <div className="text-xs text-gray-400 text-right">
            {nota.length}/200 caracteres
          </div>
        </div>


        {/* Botón Crear Pedido */}
        <Button
          onClick={handleCreateOrder}
          disabled={isCreating || cart.length === 0 || numeroMesa < 0 || numeroMesa > 500}
          className="w-full h-11 sm:h-12 text-base sm:text-lg font-medium"
        >
          {isCreating ? (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
              <span>Creando pedido...</span>
            </div>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Crear Pedido
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};