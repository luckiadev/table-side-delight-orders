import { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePedidos } from '@/hooks/usePedidos';
import { PedidoCard } from '@/components/PedidoCard';
import { MenuProductos } from '@/components/MenuProductos';
import { CarritoCompras } from '@/components/CarritoCompras';
import { FiltroFechas } from '@/components/FiltroFechas';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Producto } from '@/types/pedido';
import { ShoppingCart, Clock, CheckCircle, Package, Eye, EyeOff, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { formatNumber } from "@/lib/formatNumber";
import { useBreakpoint } from '@/hooks/use-mobile';


const AdminPedidos = () => {
  const [fechaInicio, setFechaInicio] = useState<string>();
  const [fechaFin, setFechaFin] = useState<string>();
  const [mostrarEntregados, setMostrarEntregados] = useState(false);
  const [historialExpandido, setHistorialExpandido] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();
  
  const { 
    pedidos, 
    isLoading, 
    crearPedido, 
    actualizarEstado, 
    isCreating, 
    isUpdating 
  } = usePedidos(fechaInicio, fechaFin);

  const [cart, setCart] = useState<Producto[]>([]);

  // Memoize cart handlers to prevent unnecessary re-renders
  const handleAddToCart = useCallback((producto: Producto) => {
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
  }, []);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const handleCreateOrder = useCallback((numeroMesa: number, nota: string) => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    crearPedido({
      numero_mesa: numeroMesa,
      productos: cart,
      total,
      nota
    });
    setCart([]);
  }, [cart, crearPedido]);

  const handleFiltroChange = useCallback((inicio?: string, fin?: string) => {
    setFechaInicio(inicio);
    setFechaFin(fin);
  }, []);

  // Memoize statistics calculation to prevent recalculation on every render
  const stats = useMemo(() => {
    const pendientes = pedidos.filter(p => p.estado === 'Pendiente').length;
    const enPreparacion = pedidos.filter(p => p.estado === 'En Preparación').length;
    const preparados = pedidos.filter(p => p.estado === 'Preparado').length;
    const entregados = pedidos.filter(p => p.estado === 'Entregado').length;
    const totalVentas = pedidos
      .filter(p => p.estado === 'Entregado')
      .reduce((sum, p) => sum + p.total, 0);

    return { pendientes, enPreparacion, preparados, entregados, totalVentas };
  }, [pedidos]);

  // Memoize filtered pedidos to prevent re-filtering on every render
  const pedidosActivos = useMemo(() =>
    pedidos.filter(pedido => pedido.estado !== 'Entregado'),
    [pedidos]
  );

  const pedidosEntregados = useMemo(() =>
    pedidos.filter(pedido => pedido.estado === 'Entregado'),
    [pedidos]
  );

  // ✅ LÓGICA DE PAGINACIÓN INTELIGENTE - SIN LÍMITES ARTIFICIALES
  const getHistorialItems = () => {
    if (!mostrarEntregados) return [];
    
    // ✅ MOBILE: Mostrar inicialmente menos, pero expandir muestra TODOS
    if (isMobile) {
      const initialCount = 8;
      
      if (!historialExpandido) {
        return pedidosEntregados.slice(0, initialCount);
      } else {
        return pedidosEntregados; // ← TODOS los pedidos
      }
    }
    
    // ✅ DESKTOP: Mostrar más inicialmente, pero expandir muestra TODOS
    const initialCount = 15;
    
    if (!historialExpandido) {
      return pedidosEntregados.slice(0, initialCount);
    } else {
      return pedidosEntregados; // ← TODOS los pedidos
    }
  };

  const historialItems = getHistorialItems();
  const hasMoreItems = mostrarEntregados && historialItems.length < pedidosEntregados.length;
  const remainingItems = pedidosEntregados.length - historialItems.length;

  // Configuración de grid para estadísticas
  const getStatsGridCols = () => {
    if (isMobile) return "grid-cols-2";
    if (isTablet) return "grid-cols-2";
    return "grid-cols-4";
  };

  // Configuración de grid para pedidos
  const getPedidosGridCols = () => {
    if (isMobile) return "grid-cols-1";
    if (isTablet) return "grid-cols-1 lg:grid-cols-2";
    return "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-sm sm:text-base text-gray-600">Cargando panel de administración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Navigation Header */}
      <NavigationHeader
        title="Administración de Pedidos"
        subtitle=""
        showAdminControls={true}
      />

      {/* Estadísticas Mejoradas */}
      <div className={`grid ${getStatsGridCols()} gap-3 sm:gap-4`}>
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Pendientes</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {formatNumber(stats.pendientes)}
                </p>
              </div>
              <div className="relative">
                <Clock className="h-8 w-8 text-yellow-500" />
                {stats.pendientes > 0 && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full animate-ping"></div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">En Preparación</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatNumber(stats.enPreparacion)}
                </p>
              </div>
              <div className="relative">
                <Package className="h-8 w-8 text-blue-500" />
                {stats.enPreparacion > 0 && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Preparados</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatNumber(stats.preparados)}
                </p>
              </div>
              <div className="relative">
                <CheckCircle className="h-8 w-8 text-green-500" />
                {stats.preparados > 0 && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-bounce"></div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-l-4 border-l-gray-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  {isMobile ? "Ventas Hoy" : "Entregados"}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-600">
                  {isMobile ? `$${formatNumber(stats.totalVentas)}` : formatNumber(stats.entregados)}
                </p>
              </div>
              <div className="relative">
                {isMobile ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-gray-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Mejoradas */}
      <Tabs defaultValue="pedidos" className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-1 h-auto gap-2' : 'grid-cols-2'} p-1`}>
          <TabsTrigger 
            value="pedidos" 
            className={`${isMobile ? 'w-full' : ''} text-sm sm:text-base flex items-center space-x-2 data-[state=active]:shadow-md`}
          >
            <Package className="h-4 w-4" />
            <span>Gestión de Pedidos</span>
            {pedidosActivos.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pedidosActivos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="nuevo" 
            className={`${isMobile ? 'w-full mt-2' : ''} text-sm sm:text-base flex items-center space-x-2 data-[state=active]:shadow-md`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Nuevo Pedido</span>
            {cart.length > 0 && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                {cart.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos" className="space-y-6 mt-6">
          {/* Pedidos Activos */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Pedidos Activos</span>
                </CardTitle>
                {pedidosActivos.length > 0 && (
                  <Badge variant="secondary" className="w-fit">
                    {pedidosActivos.length} activo{pedidosActivos.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className={`grid ${getPedidosGridCols()} gap-4`}>
                {pedidosActivos.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    onUpdateEstado={actualizarEstado}
                    isUpdating={isUpdating}
                  />
                ))}
              </div>
              {pedidosActivos.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-base">
                    No hay pedidos activos
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filtros */}
          <FiltroFechas
            onFiltroChange={handleFiltroChange}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
          />

          {/* ✅ HISTORIAL MEJORADO CON PAGINACIÓN */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Historial</span>
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setMostrarEntregados(!mostrarEntregados)}
                  className="flex items-center space-x-2 text-sm hover:shadow-md transition-all"
                >
                  {mostrarEntregados ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Ocultar</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>
                        {isMobile ? `Ver (${pedidosEntregados.length})` : `Mostrar (${pedidosEntregados.length})`}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {mostrarEntregados && (
              <CardContent className="p-6">
                <div className={`grid ${getPedidosGridCols()} gap-4`}>
                  {historialItems.map((pedido) => (
                    <PedidoCard
                      key={pedido.id}
                      pedido={pedido}
                      onUpdateEstado={actualizarEstado}
                      isUpdating={isUpdating}
                    />
                  ))}
                </div>
                
                {/* ✅ BOTÓN "VER MÁS" INTELIGENTE */}
                {hasMoreItems && (
                  <div className="text-center mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setHistorialExpandido(!historialExpandido)}
                      className="flex items-center space-x-2 hover:shadow-md transition-all"
                    >
                      {historialExpandido ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          <span>Ver menos</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span>
                            Ver {remainingItems} más 
                            {isMobile ? '' : ` (${remainingItems} restantes)`}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {pedidosEntregados.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-base">
                      No hay pedidos entregados aún
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="nuevo" className="space-y-6 mt-6">
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-3 gap-6'}`}>
            <div className={isMobile ? 'order-2' : 'lg:col-span-2'}>
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                  <CardTitle className="text-lg sm:text-xl flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Menú de Productos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <MenuProductos
                    onAddToCart={handleAddToCart}
                    cart={cart}
                    onUpdateQuantity={handleUpdateQuantity}
                  />
                </CardContent>
              </Card>
            </div>
            <div className={`${isMobile ? 'order-1' : 'lg:col-span-1'} ${isMobile && cart.length === 0 ? 'hidden' : ''}`}>
              <CarritoCompras
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCreateOrder={handleCreateOrder}
                isCreating={isCreating}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPedidos;