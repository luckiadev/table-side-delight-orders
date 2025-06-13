
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { Producto } from '@/types/pedido';
import { useProductos } from '@/hooks/useProductos';

interface MenuProductosProps {
  onAddToCart: (producto: Producto) => void;
  cart: Producto[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export const MenuProductos = ({ onAddToCart, cart, onUpdateQuantity }: MenuProductosProps) => {
  const { productos, isLoading } = useProductos();

  const getProductQuantity = (productId: string) => {
    return cart.find(item => item.id === productId)?.quantity || 0;
  };

  // Filtrar solo productos disponibles y agrupar por categoría
  const productosDisponibles = productos.filter(p => p.disponible);
  const categories = [...new Set(productosDisponibles.map(item => item.categoria))];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p>Cargando menú...</p>
      </div>
    );
  }

  if (productosDisponibles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay productos disponibles en este momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-xl font-bold mb-4">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productosDisponibles
              .filter(item => item.categoria === category)
              .map((item) => {
                const quantity = getProductQuantity(item.id);
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{item.nombre}</CardTitle>
                        <Badge variant="secondary">${item.precio.toLocaleString()}</Badge>
                      </div>
                      {item.descripcion && (
                        <p className="text-sm text-gray-600">{item.descripcion}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        {quantity === 0 ? (
                          <Button
                            onClick={() => onAddToCart({
                              id: item.id,
                              name: item.nombre,
                              price: item.precio,
                              quantity: 1
                            })}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        ) : (
                          <div className="flex items-center space-x-2 w-full">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="flex-1 text-center font-medium">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};
