import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus, ShoppingCart, Send, Trash2 } from 'lucide-react';
import { usePedidos } from '@/hooks/usePedidos';
import { useProductos } from '@/hooks/useProductos';
import { Producto } from '@/types/pedido';
import { formatNumber } from "@/lib/formatNumber";
import { useSearchParams } from 'react-router-dom';

// ✅ CATEGORÍAS PERMITIDAS
const CATEGORIAS_PERMITIDAS = ['alimentos', 'bebidas'] as const;
type CategoriaPermitida = typeof CATEGORIAS_PERMITIDAS[number];

const ClientesPedidos = () => {
  const { productos, isLoading } = useProductos();
  const { crearPedido, isCreating } = usePedidos();
  const [cart, setCart] = useState<Producto[]>([]);
  const [searchParams] = useSearchParams();
  
  // ✅ OBTENER MESA DEL QR (sin mostrar selector)
  const mesaFromUrl = searchParams.get('mesa');
  const numeroMesa = mesaFromUrl ? parseInt(mesaFromUrl) : 1;

  // ✅ FILTRAR PRODUCTOS DISPONIBLES
  const productosDisponibles = productos.filter(p => 
    p.disponible && CATEGORIAS_PERMITIDAS.includes(p.categoria as CategoriaPermitida)
  );

  // ✅ FUNCIONES DEL CARRITO
  const getProductQuantity = (productId: string) => {
    return cart.find(item => item.id === productId)?.quantity || 0;
  };

  const handleAddToCart = (producto: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === producto.id);
      if (existing) {
        return prev.map(item =>
          item.id === producto.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: producto.id,
        name: producto.nombre,
        price: producto.precio,
        quantity: 1
      }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleCreateOrder = () => {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    crearPedido({
      numero_mesa: numeroMesa,
      productos: cart,
      total
    });
    setCart([]);
  };

  const totalCarrito = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-12 w-12 sm:h-16 sm:w-16 animate-spin rounded-full border-4 sm:border-8 border-gray-300 border-t-blue-600 mx-auto mb-4 sm:mb-6"></div>
          <p className="text-lg sm:text-2xl text-gray-700 font-medium">Cargando menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        
        {/* ✅ HEADER SIMPLE - SIN SELECTOR DE MESA */}
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Menú del Casino
          </h1>
          {/* ✅ INFO DE MESA DISCRETA (solo si viene del QR) */}
          {mesaFromUrl && (
            <p className="text-sm sm:text-lg text-gray-600">Mesa {numeroMesa}</p>
          )}
        </div>

        {/* ✅ PRODUCTOS - SIN SEPARADORES DE CATEGORÍA */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {productosDisponibles.map((producto) => {
            const quantity = getProductQuantity(producto.id);
            
            return (
              <Card key={producto.id} className="border-2 border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                        {producto.nombre}
                      </h3>
                      <p className="text-xl sm:text-3xl font-bold text-green-700 mb-1 sm:mb-2">
                        ${formatNumber(producto.precio)}
                      </p>
                      {producto.descripcion && (
                        <p className="text-sm sm:text-lg text-gray-600 line-clamp-2">
                          {producto.descripcion}
                        </p>
                      )}
                    </div>
                    
                    {/* ✅ BOTONES RESPONSIVOS */}
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                      {quantity === 0 ? (
                        <Button
                          onClick={() => handleAddToCart(producto)}
                          className="h-12 sm:h-16 px-4 sm:px-8 text-base sm:text-xl font-bold bg-blue-600 hover:bg-blue-700 min-w-[80px] sm:min-w-[120px]"
                        >
                          <Plus className="h-4 w-4 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline">Agregar</span>
                          <span className="xs:hidden">+</span>
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <Button
                            onClick={() => handleUpdateQuantity(producto.id, quantity - 1)}
                            className="h-12 w-12 sm:h-16 sm:w-16 text-base sm:text-xl bg-red-600 hover:bg-red-700 p-0"
                          >
                            <Minus className="h-4 w-4 sm:h-6 sm:w-6" />
                          </Button>
                          
                          <span className="text-2xl sm:text-4xl font-bold text-gray-900 min-w-[2rem] sm:min-w-[4rem] text-center">
                            {quantity}
                          </span>
                          
                          <Button
                            onClick={() => handleUpdateQuantity(producto.id, quantity + 1)}
                            className="h-12 w-12 sm:h-16 sm:w-16 text-base sm:text-xl bg-green-600 hover:bg-green-700 p-0"
                          >
                            <Plus className="h-4 w-4 sm:h-6 sm:w-6" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ✅ CARRITO - SIEMPRE VISIBLE SI HAY ITEMS */}
        {cart.length > 0 && (
          <div className="bg-gray-50 border-2 sm:border-4 border-gray-300 rounded-lg sm:rounded-xl p-4 sm:p-8 sticky bottom-0 shadow-lg">
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center flex items-center justify-center space-x-2 sm:space-x-3">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8" />
              <span>Mi Pedido ({totalItems})</span>
            </h2>

            {/* ✅ RESUMEN COMPACTO DEL CARRITO */}
            <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-8 max-h-40 sm:max-h-60 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 sm:border-2 rounded-md sm:rounded-lg p-2 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-xl font-bold text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs sm:text-lg text-gray-600">
                        ${formatNumber(item.price)} × {item.quantity} = <span className="font-bold">${formatNumber(item.price * item.quantity)}</span>
                      </p>
                    </div>
                    <Button
                      onClick={() => handleUpdateQuantity(item.id, 0)}
                      className="h-8 w-8 sm:h-12 sm:w-12 bg-red-600 hover:bg-red-700 p-0 flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ TOTAL Y ENVÍO RESPONSIVO */}
            <div className="text-center space-y-3 sm:space-y-6">
              <div className="bg-green-100 border-2 sm:border-4 border-green-300 rounded-lg sm:rounded-xl p-3 sm:p-6">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">TOTAL:</p>
                <p className="text-3xl sm:text-5xl font-bold text-green-700">
                  ${formatNumber(totalCarrito)}
                </p>
              </div>
              
              <Button
                onClick={handleCreateOrder}
                disabled={isCreating}
                className="h-14 sm:h-20 px-6 sm:px-12 text-lg sm:text-2xl font-bold bg-blue-600 hover:bg-blue-700 w-full max-w-sm sm:max-w-md mx-auto"
              >
                {isCreating ? (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="h-4 w-4 sm:h-6 sm:w-6 animate-spin rounded-full border-2 sm:border-3 border-white border-t-transparent"></div>
                    <span>Enviando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Send className="h-5 w-5 sm:h-6 sm:w-6" />
                    <span>ENVIAR PEDIDO</span>
                  </div>
                )}
              </Button>
              
              {/* ✅ INFO DISCRETA DE MESA */}
              <p className="text-xs sm:text-sm text-gray-500">
                Mesa {numeroMesa} • {totalItems} productos
              </p>
            </div>
          </div>
        )}

        {/* ✅ MENSAJE CUANDO CARRITO VACÍO */}
        {cart.length === 0 && (
          <div className="text-center py-8 sm:py-12 bg-gray-50 border-2 sm:border-4 border-gray-200 rounded-lg sm:rounded-xl">
            <ShoppingCart className="h-12 w-12 sm:h-20 sm:w-20 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-lg sm:text-2xl text-gray-600 font-medium">
              Tu carrito está vacío
            </p>
            <p className="text-sm sm:text-xl text-gray-500 mt-1 sm:mt-2">
              Selecciona productos para continuar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientesPedidos;