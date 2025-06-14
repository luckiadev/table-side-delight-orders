import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePedidos } from '@/hooks/usePedidos';
import { MenuProductos } from '@/components/MenuProductos';
import { CarritoCompras } from '@/components/CarritoCompras';
import { Producto } from '@/types/pedido';
import { ShoppingCart } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const ClientesPedidos = () => {
  const { crearPedido, isCreating } = usePedidos();
  const [cart, setCart] = useState<Producto[]>([]);
  const [searchParams] = useSearchParams();
  
  // Obtener número de mesa desde la URL
  const mesaFromUrl = searchParams.get('mesa');
  const [numeroMesa, setNumeroMesa] = useState<number | undefined>();

  useEffect(() => {
    if (mesaFromUrl) {
      const mesa = parseInt(mesaFromUrl);
      if (!isNaN(mesa) && mesa >= 0 && mesa <= 500) {
        setNumeroMesa(mesa);
      }
    }
  }, [mesaFromUrl]);

  const handleAddToCart = (producto: Producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === producto.id);
      if (existing) {
        return prev.map(item =>
          item.id === producto.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, producto];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleCreateOrder = (numeroMesaFinal: number) => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    crearPedido({
      numero_mesa: numeroMesaFinal,
      productos: cart,
      total
    });
    setCart([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center space-x-2">
          <ShoppingCart className="h-10 w-10" />
          <span>Realizar Pedido</span>
        </h1>
        <p className="text-gray-600">Selecciona tus productos y realiza tu pedido</p>
        {numeroMesa !== undefined && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 inline-block">
            <p className="text-blue-800 font-medium">Mesa: {numeroMesa}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Menú de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <MenuProductos
                onAddToCart={handleAddToCart}
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
              />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <CarritoCompras
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCreateOrder={handleCreateOrder}
            isCreating={isCreating}
            numeroMesaInicial={numeroMesa}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientesPedidos;
