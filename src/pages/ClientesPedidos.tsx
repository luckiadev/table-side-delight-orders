import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus, ShoppingCart, Send, Trash2, ChevronUp, ChevronDown, StickyNote, X } from 'lucide-react';
import { usePedidos } from '@/hooks/usePedidos';
import { useProductos } from '@/hooks/useProductos';
import { useConfiguracion } from '@/hooks/useConfiguracion';
import { Producto } from '@/types/pedido';
import { formatNumber } from "@/lib/formatNumber";
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// ✅ CATEGORÍAS PERMITIDAS
const CATEGORIAS_PERMITIDAS = ['alimentos', 'bebidas'] as const;
type CategoriaPermitida = typeof CATEGORIAS_PERMITIDAS[number];

const ClientesPedidos = () => {
  const { productos, isLoading } = useProductos();
  const { crearPedido, isCreating } = usePedidos();
  const { suspension, isSuspendido, getMotivoSuspension, isLoading: isLoadingSuspension } = useConfiguracion();
  const { toastPedidoExitoso, toastError } = useToast(); // ✅ USAR TOAST MEJORADO
  const [cart, setCart] = useState<Producto[]>([]);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [nota, setNota] = useState<string>('');
  const [searchParams] = useSearchParams();
  const mesaParam = searchParams.get('mesa');
  
  // ✅ MESA DESDE URL (solo si es valida)
  const mesaFromUrl = useMemo(() => {
    if (!mesaParam) return null;
    const parsed = parseInt(mesaParam, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [mesaParam]);

  const [mesaSeleccionada, setMesaSeleccionada] = useState<number | null>(mesaFromUrl);

  useEffect(() => {
    setMesaSeleccionada(mesaFromUrl);
  }, [mesaFromUrl, setMesaSeleccionada]);

  const numeroMesa = mesaSeleccionada;
  const mesaDisponible = typeof numeroMesa === 'number' && numeroMesa > 0;
  const cartItemCount = cart.length;
  const mesaAsignadaPorUrl = mesaFromUrl !== null;
  const mesaDisplayText = mesaDisponible ? `Mesa ${numeroMesa}` : 'Selecciona tu mesa';

  useEffect(() => {
    if (!mesaDisponible && cartItemCount > 0) {
      setCart([]);
      setCartExpanded(false);
    }
  }, [mesaDisponible, cartItemCount, setCart, setCartExpanded]);

  // ✅ FILTRAR PRODUCTOS DISPONIBLES - Memoized
  const productosDisponibles = useMemo(() =>
    productos.filter(p =>
      p.disponible && CATEGORIAS_PERMITIDAS.includes(p.categoria as CategoriaPermitida)
    ),
    [productos]
  );

  // ✅ FUNCIONES DEL CARRITO - Memoized to prevent re-renders
  const getProductQuantity = useCallback((productId: string) => {
    return cart.find(item => item.id === productId)?.quantity || 0;
  }, [cart]);

  const handleMesaManualChange = useCallback((value: string) => {
    if (mesaAsignadaPorUrl) {
      return;
    }

    const trimmed = value.trim();
    if (trimmed === '') {
      setMesaSeleccionada(null);
      return;
    }

    const parsed = parseInt(trimmed, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      setMesaSeleccionada(parsed);
    } else {
      setMesaSeleccionada(null);
    }
  }, [mesaAsignadaPorUrl, setMesaSeleccionada]);

  const handleAddToCart = useCallback((producto: any) => {
    if (!mesaDisponible) {
      toastError("Selecciona tu mesa antes de agregar productos.");
      return;
    }
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
  }, [mesaDisponible, toastError, setCart]);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (!mesaDisponible) {
      return;
    }
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [mesaDisponible, setCart]);

  const handleCreateOrder = useCallback(() => {
    if (cart.length === 0) return;
    if (!mesaDisponible || numeroMesa == null) {
      toastError("Selecciona tu mesa antes de enviar el pedido.");
      return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
      crearPedido({
        numero_mesa: numeroMesa,
        productos: cart,
        total,
        nota
      });

      setCart([]);
      setCartExpanded(false);
      setNota('');

      // TOAST SÚPER VISIBLE
      toastPedidoExitoso(numeroMesa, total);

    } catch (error) {
      // TOAST DE ERROR TAMBIÉN VISIBLE
      toastError("No se pudo enviar el pedido. Por favor, intenta nuevamente.");
      console.error('Error al crear pedido:', error);
    }
  }, [cart, numeroMesa, nota, crearPedido, toastPedidoExitoso, toastError, mesaDisponible, setCart, setCartExpanded, setNota]);

  // Memoize totals to prevent recalculation on every render
  const totalCarrito = useMemo(() =>
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [cart]
  );

  const totalItems = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Pantalla de suspensión: bloquea la página si el servicio está suspendido
  if (!isLoadingSuspension && isSuspendido()) {
    const motivo = getMotivoSuspension();

    // Formatea datetime-local string a texto legible 24h
    // Parsea manualmente para evitar problemas de timezone
    const formatearFecha = (value: string) => {
      const parts = value.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (parts) {
        const [, y, mo, d, h, mi] = parts;
        const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
        return date.toLocaleString('es-CL', {
          weekday: 'long', day: 'numeric', month: 'long',
          hour: '2-digit', minute: '2-digit', hour12: false,
        });
      }
      return value;
    };

    // Título según motivo
    const titulo = 'Servicio no disponible';

    // Mensaje por defecto según motivo
    const mensajeDefault = motivo === 'horario_programado'
      ? 'El servicio de pedidos no está disponible en este momento.'
      : 'El servicio de pedidos está temporalmente suspendido. Volveremos pronto.';

    // Info de horario para el cliente
    const infoHorario = motivo === 'horario_programado' && suspension.hasta
      ? `Volvemos: ${formatearFecha(suspension.hasta)}`
      : null;

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-red-100">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {titulo}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            {suspension.mensaje || mensajeDefault}
          </p>
          {infoHorario && (
            <p className="text-sm text-gray-500">
              {infoHorario}
            </p>
          )}
        </div>
      </div>
    );
  }

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
          {/* ✅ INFO/SELECCIÓN DE MESA */}
          {mesaAsignadaPorUrl ? (
            <p className="text-sm sm:text-lg text-gray-600">{mesaDisplayText}</p>
          ) : (
            <div className="max-w-sm mx-auto mt-4 space-y-3 text-left">
              <Label htmlFor="mesa-input" className="text-gray-700 font-semibold">
                Selecciona tu mesa
              </Label>
              <Input
                id="mesa-input"
                type="number"
                min={1}
                value={numeroMesa ?? ''}
                onChange={(e) => handleMesaManualChange(e.target.value)}
                placeholder="Ej: 12"
                className="text-center text-lg font-semibold"
              />
              <p className="text-xs sm:text-sm text-gray-500 text-center">
                Ingresa el número de mesa asignado por el personal antes de agregar productos.
              </p>
            </div>
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
                          disabled={!mesaDisponible}
                        >
                          {/* ✅ SOLO ÍCONO EN MOBILE, ÍCONO + TEXTO EN DESKTOP */}
                          <Plus className="h-4 w-4 sm:h-6 sm:w-6 sm:mr-2" />
                          <span className="hidden sm:inline">Agregar</span>
                        </Button>
                      ) : (
                        <div className="flex items-center space-x-2 sm:space-x-4">
                          <Button
                            onClick={() => handleUpdateQuantity(producto.id, quantity - 1)}
                            className="h-12 w-12 sm:h-16 sm:w-16 text-base sm:text-xl bg-red-600 hover:bg-red-700 p-0"
                            disabled={!mesaDisponible}
                          >
                            <Minus className="h-4 w-4 sm:h-6 sm:w-6" />
                          </Button>
                          
                          <span className="text-2xl sm:text-4xl font-bold text-gray-900 min-w-[2rem] sm:min-w-[4rem] text-center">
                            {quantity}
                          </span>
                          
                          <Button
                            onClick={() => handleUpdateQuantity(producto.id, quantity + 1)}
                            className="h-12 w-12 sm:h-16 sm:w-16 text-base sm:text-xl bg-green-600 hover:bg-green-700 p-0"
                            disabled={!mesaDisponible}
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

        {/* ✅ MENSAJE CUANDO CARRITO VACÍO */}
        {cart.length === 0 && (
          <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg mx-4 mb-20">
            <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg text-gray-500">
              {mesaDisponible ? 'Selecciona productos para continuar' : 'Selecciona tu mesa para comenzar'}
            </p>
          </div>
        )}

        {/* Espacio para la barra inferior fija */}
        {cart.length > 0 && <div className="pb-24"></div>}
      </div>

      {/* OVERLAY oscuro cuando el panel está expandido */}
      {cart.length > 0 && cartExpanded && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setCartExpanded(false)}
        />
      )}

      {/* BARRA INFERIOR COMPACTA (siempre visible cuando hay items) */}
      {cart.length > 0 && !cartExpanded && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <button
            onClick={() => setCartExpanded(true)}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </div>
              </div>
              <span className="text-base sm:text-lg font-semibold">
                Ver pedido
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-bold">
                ${formatNumber(totalCarrito)}
              </span>
              <ChevronUp className="h-5 w-5" />
            </div>
          </button>
        </div>
      )}

      {/* PANEL EXPANDIBLE — resumen + nota + enviar */}
      {cart.length > 0 && cartExpanded && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t-2 border-gray-200 max-h-[85vh] overflow-y-auto">
          {/* Header del panel */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <span className="text-lg font-bold text-gray-900">
                Tu Pedido ({totalItems})
              </span>
            </div>
            <Button
              onClick={() => setCartExpanded(false)}
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Lista de productos */}
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500">
                      ${formatNumber(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm sm:text-base font-bold text-green-700">
                      ${formatNumber(item.price * item.quantity)}
                    </span>
                    <Button
                      onClick={() => handleUpdateQuantity(item.id, 0)}
                      variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-red-100 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total + Mesa */}
            <div className="flex items-center justify-between py-3 border-t border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500">{mesaDisplayText}</p>
                <p className="text-xs text-gray-400">{totalItems} producto{totalItems !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-2xl font-bold text-green-700">
                ${formatNumber(totalCarrito)}
              </span>
            </div>

            {/* Nota del pedido */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1 text-sm font-medium text-gray-700">
                <StickyNote className="h-4 w-4 text-blue-600" />
                <span>Nota del pedido (Opcional)</span>
              </div>
              <Textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: Mesero Juan, Cliente directo, Mesa VIP, sin hielo, etc..."
                className="h-16 resize-none text-sm"
                maxLength={200}
              />
              <div className="text-xs text-gray-400 text-right">
                {nota.length}/200 caracteres
              </div>
            </div>

            {/* Botón de envío */}
            <Button
              onClick={handleCreateOrder}
              disabled={isCreating || !mesaDisponible}
              className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
            >
              {isCreating ? (
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-3 border-white border-t-transparent"></div>
                  <span>Enviando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Send className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>ENVIAR PEDIDO</span>
                </div>
              )}
            </Button>

            <p className="text-center text-xs sm:text-sm text-gray-500 pb-2">
              Tu pedido será enviado a la cocina inmediatamente
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesPedidos;

