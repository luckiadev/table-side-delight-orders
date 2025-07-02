import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { Producto } from '@/types/pedido';
import { useProductos } from '@/hooks/useProductos';
import { formatNumber } from "@/lib/formatNumber";
import { useBreakpoint } from '@/hooks/use-mobile';

interface MenuProductosProps {
  onAddToCart: (producto: Producto) => void;
  cart: Producto[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export const MenuProductos = ({ onAddToCart, cart, onUpdateQuantity }: MenuProductosProps) => {
  const { productos, isLoading } = useProductos();
  const { isMobile, isTablet } = useBreakpoint();

  const getProductQuantity = (productId: string) => {
    return cart.find(item => item.id === productId)?.quantity || 0;
  };

  // Filtrar solo productos disponibles y agrupar por categoría
  const productosDisponibles = productos.filter(p => p.disponible);
  const categories = [...new Set(productosDisponibles.map(item => item.categoria))];

  // Grid columns responsive basado en contenido y viewport
  const getGridColumns = () => {
    if (isMobile) return "grid-cols-1";
    if (isTablet) return "grid-cols-2";
    return "grid-cols-2 xl:grid-cols-3";
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm sm:text-base">Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (productosDisponibles.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="max-w-sm mx-auto">
          <div className="h-16 w-16 sm:h-20 sm:w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm sm:text-base mb-2">
            No hay productos disponibles
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            Contacta al administrador
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {categories.map(category => {
        const categoryProducts = productosDisponibles.filter(item => item.categoria === category);
        
        return (
          <div key={category}>
            {/* Header de Categoría */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {category}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mt-1">
                  {categoryProducts.length} producto{categoryProducts.length !== 1 ? 's' : ''} disponible{categoryProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {categoryProducts.length}
              </Badge>
            </div>

            {/* Grid de Productos */}
            <div className={`grid ${getGridColumns()} gap-3 sm:gap-4 lg:gap-6`}>
              {categoryProducts.map((item) => {
                const quantity = getProductQuantity(item.id);
                
                return (
                  <Card 
                    key={item.id} 
                    className="hover:shadow-md transition-all duration-200 hover:scale-[1.02] group"
                  >
                    <CardHeader className="pb-2 sm:pb-3">
                      <div className="flex flex-col space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base sm:text-lg leading-tight line-clamp-2">
                            {item.nombre}
                          </CardTitle>
                          <Badge 
                            variant="secondary" 
                            className="ml-2 bg-green-100 text-green-700 text-sm sm:text-base font-semibold shrink-0"
                          >
                            ${formatNumber(item.precio)}
                          </Badge>
                        </div>
                        
                        {item.descripcion && (
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {item.descripcion}
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        {quantity === 0 ? (
                          <Button
                            onClick={() => onAddToCart({
                              id: item.id,
                              name: item.nombre,
                              price: item.precio,
                              quantity: 1
                            })}
                            className="w-full h-9 sm:h-10 text-sm sm:text-base group-hover:bg-primary/90 transition-colors"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              
                              <span className="min-w-[2rem] text-center font-semibold text-sm sm:text-base">
                                {quantity}
                              </span>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                                className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-200"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {/* Subtotal en mobile */}
                            {isMobile && (
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Subtotal</div>
                                <div className="text-sm font-semibold">
                                  ${formatNumber(item.precio * quantity)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};