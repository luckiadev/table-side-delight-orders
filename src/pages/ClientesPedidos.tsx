import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  
  // ✅ NÚMERO DE MESA
  const mesaFromUrl = searchParams.get('mesa');
  const [numeroMesa, setNumeroMesa] = useState<number>(mesaFromUrl ? parseInt(mesaFromUrl) : 1);

  useEffect(() => {
    if (mesaFromUrl) {
      const mesa = parseInt(mesaFromUrl);
      if (!isNaN(mesa) && mesa >= 0 && mesa <= 500) {
        setNumeroMesa(mesa);
      }
    }
  }, [mesaFromUrl]);

  // ✅ FILTRAR SOLO PRODUCTOS DISPONIBLES DE CATEGORÍAS PERMITIDAS
  const productosDisponibles = productos.filter(p => 
    p.disponible && CATEGORIAS_PERMITIDAS.includes(p.categoria as CategoriaPermitida)
  );

  // ✅ AGRUPAR POR CATEGORÍA
  const alimentos = productosDisponibles.filter(p => p.categoria === 'alimentos');
  const bebidas = productosDisponibles.filter(p => p.categoria === 'bebidas');

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-8 border-gray-300 border-t-blue-600 mx-auto mb-6"></div>
          <p className="text-2xl text-gray-700 font-medium">Cargando menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6">
        
        {/* ✅ HEADER EXTREMADAMENTE SIMPLE */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Menú del Casino
          </h1>
          
          {/* ✅ NÚMERO DE MESA - MUY VISIBLE */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8 max-w-md mx-auto">
            <label className="block text-xl font-semibold text-gray-800 mb-3">
              Número de Mesa:
            </label>
            <Input
              type="number"
              value={numeroMesa}
              onChange={(e) => setNumeroMesa(parseInt(e.target.value) || 1)}
              className="text-center text-3xl font-bold h-16 border-4 border-blue-300 text-blue-800"
              min="1"
              max="500"
            />
          </div>
        </div>

        {/* ✅ LAYOUT SÚPER SIMPLE - UNA COLUMNA */}
        <div className="space-y-8">
          
          {/* ✅ SECCIÓN ALIMENTOS */}
          {alimentos.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center bg-orange-50 py-4 rounded-xl border-2 border-orange-200">
                🍽️ ALIMENTOS
              </h2>
              
              <div className="grid gap-4">
                {alimentos.map((producto) => {
                  const quantity = getProductQuantity(producto.id);
                  
                  return (
                    <Card key={producto.id} className="border-4 border-gray-200 hover:border-orange-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              {producto.nombre}
                            </h3>
                            <p className="text-3xl font-bold text-green-700">
                              ${formatNumber(producto.precio)}
                            </p>
                            {producto.descripcion && (
                              <p className="text-lg text-gray-600 mt-2">
                                {producto.descripcion}
                              </p>
                            )}
                          </div>
                          
                          {/* ✅ BOTONES EXTRA GRANDES */}
                          <div className="flex items-center space-x-4">
                            {quantity === 0 ? (
                              <Button
                                onClick={() => handleAddToCart(producto)}
                                className="h-16 px-8 text-xl font-bold bg-orange-600 hover:bg-orange-700"
                              >
                                <Plus className="h-6 w-6 mr-2" />
                                Agregar
                              </Button>
                            ) : (
                              <div className="flex items-center space-x-4">
                                <Button
                                  onClick={() => handleUpdateQuantity(producto.id, quantity - 1)}
                                  className="h-16 w-16 text-xl bg-red-600 hover:bg-red-700"
                                >
                                  <Minus className="h-6 w-6" />
                                </Button>
                                
                                <span className="text-4xl font-bold text-gray-900 min-w-[4rem] text-center">
                                  {quantity}
                                </span>
                                
                                <Button
                                  onClick={() => handleUpdateQuantity(producto.id, quantity + 1)}
                                  className="h-16 w-16 text-xl bg-green-600 hover:bg-green-700"
                                >
                                  <Plus className="h-6 w-6" />
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
            </div>
          )}

          {/* ✅ SECCIÓN BEBIDAS */}
          {bebidas.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center bg-blue-50 py-4 rounded-xl border-2 border-blue-200">
                🥤 BEBIDAS
              </h2>
              
              <div className="grid gap-4">
                {bebidas.map((producto) => {
                  const quantity = getProductQuantity(producto.id);
                  
                  return (
                    <Card key={producto.id} className="border-4 border-gray-200 hover:border-blue-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              {producto.nombre}
                            </h3>
                            <p className="text-3xl font-bold text-green-700">
                              ${formatNumber(producto.precio)}
                            </p>
                            {producto.descripcion && (
                              <p className="text-lg text-gray-600 mt-2">
                                {producto.descripcion}
                              </p>
                            )}
                          </div>
                          
                          {/* ✅ BOTONES EXTRA GRANDES */}
                          <div className="flex items-center space-x-4">
                            {quantity === 0 ? (
                              <Button
                                onClick={() => handleAddToCart(producto)}
                                className="h-16 px-8 text-xl font-bold bg-blue-600 hover:bg-blue-700"
                              >
                                <Plus className="h-6 w-6 mr-2" />
                                Agregar
                              </Button>
                            ) : (
                              <div className="flex items-center space-x-4">
                                <Button
                                  onClick={() => handleUpdateQuantity(producto.id, quantity - 1)}
                                  className="h-16 w-16 text-xl bg-red-600 hover:bg-red-700"
                                >
                                  <Minus className="h-6 w-6" />
                                </Button>
                                
                                <span className="text-4xl font-bold text-gray-900 min-w-[4rem] text-center">
                                  {quantity}
                                </span>
                                
                                <Button
                                  onClick={() => handleUpdateQuantity(producto.id, quantity + 1)}
                                  className="h-16 w-16 text-xl bg-green-600 hover:bg-green-700"
                                >
                                  <Plus className="h-6 w-6" />
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
            </div>
          )}

          {/* ✅ CARRITO SIMPLE AL FINAL */}
          {cart.length > 0 && (
            <div className="bg-gray-50 border-4 border-gray-300 rounded-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center space-x-3">
                <ShoppingCart className="h-8 w-8" />
                <span>Mi Pedido ({totalItems} productos)</span>
              </h2>

              {/* ✅ RESUMEN DEL CARRITO */}
              <div className="space-y-4 mb-8">
                {cart.map((item) => (
                  <div key={item.id} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900">
                          {item.name}
                        </h4>
                        <p className="text-lg text-gray-600">
                          ${formatNumber(item.price)} × {item.quantity} = ${formatNumber(item.price * item.quantity)}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleUpdateQuantity(item.id, 0)}
                        className="h-12 w-12 bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ TOTAL Y ENVÍO */}
              <div className="text-center space-y-6">
                <div className="bg-green-100 border-4 border-green-300 rounded-xl p-6">
                  <p className="text-2xl font-bold text-gray-900 mb-2">TOTAL A PAGAR:</p>
                  <p className="text-5xl font-bold text-green-700">
                    ${formatNumber(totalCarrito)}
                  </p>
                </div>
                
                <Button
                  onClick={handleCreateOrder}
                  disabled={isCreating}
                  className="h-20 px-12 text-2xl font-bold bg-blue-600 hover:bg-blue-700 w-full max-w-md mx-auto"
                >
                  {isCreating ? (
                    <div className="flex items-center space-x-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-white border-t-transparent"></div>
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Send className="h-6 w-6" />
                      <span>ENVIAR PEDIDO - MESA {numeroMesa}</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ✅ MENSAJE CUANDO CARRITO VACÍO */}
          {cart.length === 0 && (
            <div className="text-center py-12 bg-gray-50 border-4 border-gray-200 rounded-xl">
              <ShoppingCart className="h-20 w-20 text-gray-400 mx-auto mb-4" />
              <p className="text-2xl text-gray-600 font-medium">
                Tu carrito está vacío
              </p>
              <p className="text-xl text-gray-500 mt-2">
                Selecciona productos del menú para continuar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientesPedidos;