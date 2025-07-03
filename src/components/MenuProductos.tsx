import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Utensils, Coffee } from 'lucide-react';
import { Producto } from '@/types/pedido';
import { useProductos } from '@/hooks/useProductos';
import { formatNumber } from "@/lib/formatNumber";
import { useBreakpoint } from '@/hooks/use-mobile';

interface MenuProductosProps {
  onAddToCart: (producto: Producto) => void;
  cart: Producto[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

// ✅ CATEGORÍAS PERMITIDAS - Solo Alimentos y Bebidas
const CATEGORIAS_PERMITIDAS = ['alimentos', 'bebidas'] as const;
type CategoriaPermitida = typeof CATEGORIAS_PERMITIDAS[number];

// ✅ Configuración visual para cada categoría
const CATEGORIA_CONFIG = {
  alimentos: {
    label: 'Alimentos',
    icon: Utensils,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    badgeStyle: 'bg-orange-100 text-orange-700',
    hoverColor: 'hover:bg-orange-100',
    description: 'Platos principales, snacks y comida en general'
  },
  bebidas: {
    label: 'Bebidas', 
    icon: Coffee,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeStyle: 'bg-blue-100 text-blue-700',
    hoverColor: 'hover:bg-blue-100',
    description: 'Bebidas calientes, frías y refrescos'
  }
} as const;

export const MenuProductos = ({ onAddToCart, cart, onUpdateQuantity }: MenuProductosProps) => {
  const { productos, isLoading } = useProductos();
  const { isMobile, isTablet } = useBreakpoint();

  const getProductQuantity = (productId: string) => {
    return cart.find(item => item.id === productId)?.quantity || 0;
  };

  // ✅ FILTRAR SOLO PRODUCTOS DE CATEGORÍAS PERMITIDAS Y DISPONIBLES
  const productosDisponibles = productos.filter(p => 
    p.disponible && CATEGORIAS_PERMITIDAS.includes(p.categoria as CategoriaPermitida)
  );
  
  // ✅ OBTENER SOLO CATEGORÍAS PERMITIDAS QUE TENGAN PRODUCTOS
  const categories = CATEGORIAS_PERMITIDAS.filter(categoria => 
    productosDisponibles.some(item => item.categoria === categoria)
  );

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
          {/* ✅ ICONOS ESPECÍFICOS PARA CATEGORÍAS VACÍAS */}
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-orange-100 rounded-full flex items-center justify-center">
              <Utensils className="h-8 w-8 sm:h-10 sm:w-10 text-orange-400" />
            </div>
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Coffee className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400" />
            </div>
          </div>
          <p className="text-gray-500 text-sm sm:text-base mb-2">
            No hay alimentos ni bebidas disponibles
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            Contacta al administrador para agregar productos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ✅ INFORMACIÓN DE CATEGORÍAS DISPONIBLES */}
      <div className="bg-gradient-to-r from-orange-50 via-white to-blue-50 rounded-lg p-4 border border-gray-200">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Menú Casino - Alimentos y Bebidas
          </h2>
          <div className="flex justify-center items-center space-x-4 flex-wrap gap-2">
            {CATEGORIAS_PERMITIDAS.map((categoria) => {
              const config = CATEGORIA_CONFIG[categoria];
              const IconComponent = config.icon;
              const hasProducts = productosDisponibles.some(p => p.categoria === categoria);
              
              return (
                <Badge 
                  key={categoria}
                  variant="outline" 
                  className={`${config.badgeStyle} border-0 px-3 py-1 ${!hasProducts ? 'opacity-50' : ''}`}
                >
                  <IconComponent className={`h-3 w-3 mr-1 ${config.color}`} />
                  <span className="capitalize font-medium">{config.label}</span>
                  {hasProducts && (
                    <span className="ml-1 text-xs">
                      ({productosDisponibles.filter(p => p.categoria === categoria).length})
                    </span>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      {/* ✅ CATEGORÍAS CON DISEÑO MEJORADO */}
      {categories.map(category => {
        const categoryProducts = productosDisponibles.filter(item => item.categoria === category);
        const config = CATEGORIA_CONFIG[category as CategoriaPermitida];
        const IconComponent = config?.icon || Utensils;
        
        return (
          <div key={category}>
            {/* ✅ HEADER DE CATEGORÍA CON ICONOS Y COLORES */}
            <div className={`${config?.bgColor || 'bg-gray-50'} rounded-lg p-4 mb-6 ${config?.borderColor ? `border ${config.borderColor}` : 'border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full ${config?.bgColor || 'bg-gray-100'} ${config?.borderColor ? `border ${config.borderColor}` : 'border border-gray-200'}`}>
                    <IconComponent className={`h-6 w-6 ${config?.color || 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {config?.label || category}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                      {config?.description || `${categoryProducts.length} producto${categoryProducts.length !== 1 ? 's' : ''} disponible${categoryProducts.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs sm:text-sm ${config?.badgeStyle || 'bg-gray-100 text-gray-700'} border-0`}
                >
                  {categoryProducts.length} productos
                </Badge>
              </div>
            </div>

            {/* ✅ GRID DE PRODUCTOS CON HOVER PERSONALIZADO */}
            <div className={`grid ${getGridColumns()} gap-3 sm:gap-4 lg:gap-6`}>
              {categoryProducts.map((item) => {
                const quantity = getProductQuantity(item.id);
                
                return (
                  <Card 
                    key={item.id} 
                    className={`hover:shadow-md transition-all duration-200 hover:scale-[1.02] group border ${config?.borderColor || 'border-gray-200'} ${config?.hoverColor || 'hover:bg-gray-50'}/50`}
                  >
                    <CardHeader className="pb-2 sm:pb-3">
                      <div className="flex flex-col space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base sm:text-lg leading-tight line-clamp-2 flex-1">
                            {item.nombre}
                          </CardTitle>
                          <Badge 
                            className={`ml-2 ${config?.badgeStyle || 'bg-green-100 text-green-700'} text-sm sm:text-base font-semibold shrink-0 border-0`}
                          >
                            ${formatNumber(item.precio)}
                          </Badge>
                        </div>
                        
                        {item.descripcion && (
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {item.descripcion}
                          </p>
                        )}
                        
                        {/* ✅ INDICADOR DE CATEGORÍA EN CADA PRODUCTO */}
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`h-3 w-3 ${config?.color || 'text-gray-500'}`} />
                          <span className={`text-xs font-medium ${config?.color || 'text-gray-500'} capitalize`}>
                            {config?.label || category}
                          </span>
                        </div>
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
                            className={`w-full h-9 sm:h-10 text-sm sm:text-base transition-all duration-200 ${
                              config?.color === 'text-orange-600' 
                                ? 'bg-orange-600 hover:bg-orange-700' 
                                : config?.color === 'text-blue-600'
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-primary hover:bg-primary/90'
                            }`}
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
                                className={`h-8 w-8 p-0 ${
                                  config?.color === 'text-orange-600' 
                                    ? 'hover:bg-orange-50 hover:border-orange-200' 
                                    : 'hover:bg-blue-50 hover:border-blue-200'
                                }`}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {/* ✅ SUBTOTAL EN MOBILE CON COLORES DE CATEGORÍA */}
                            {isMobile && (
                              <div className="text-right">
                                <div className="text-xs text-gray-500">Subtotal</div>
                                <div className={`text-sm font-semibold ${config?.color || 'text-gray-900'}`}>
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
      
      {/* ✅ MENSAJE FINAL INFORMATIVO */}
      <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Menú especializado:</span> Solo ofrecemos alimentos y bebidas seleccionados
        </p>
        <div className="flex justify-center items-center space-x-4 mt-2">
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
            <Utensils className="h-3 w-3 mr-1" />
            {productosDisponibles.filter(p => p.categoria === 'alimentos').length} Alimentos
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
            <Coffee className="h-3 w-3 mr-1" />
            {productosDisponibles.filter(p => p.categoria === 'bebidas').length} Bebidas
          </Badge>
        </div>
      </div>
    </div>
  );
};