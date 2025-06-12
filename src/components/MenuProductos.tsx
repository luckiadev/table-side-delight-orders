
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { Producto } from '@/types/pedido';

interface MenuProductosProps {
  onAddToCart: (producto: Producto) => void;
  cart: Producto[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

const menuItems = [
  { id: '1', name: 'Cerveza Corona', price: 4500, category: 'Bebidas' },
  { id: '2', name: 'Café Americano', price: 2800, category: 'Bebidas' },
  { id: '3', name: 'Agua Mineral', price: 2000, category: 'Bebidas' },
  { id: '4', name: 'Hamburguesa Clásica', price: 8900, category: 'Comida' },
  { id: '5', name: 'Papas Fritas', price: 3200, category: 'Comida' },
  { id: '6', name: 'Sandwich Club', price: 7500, category: 'Comida' },
  { id: '7', name: 'Pollo a la Plancha', price: 12500, category: 'Comida' },
  { id: '8', name: 'Ensalada César', price: 6800, category: 'Comida' },
];

export const MenuProductos = ({ onAddToCart, cart, onUpdateQuantity }: MenuProductosProps) => {
  const getProductQuantity = (productId: string) => {
    return cart.find(item => item.id === productId)?.quantity || 0;
  };

  const categories = [...new Set(menuItems.map(item => item.category))];

  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-xl font-bold mb-4">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems
              .filter(item => item.category === category)
              .map((item) => {
                const quantity = getProductQuantity(item.id);
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge variant="secondary">${item.price.toLocaleString()}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        {quantity === 0 ? (
                          <Button
                            onClick={() => onAddToCart({
                              id: item.id,
                              name: item.name,
                              price: item.price,
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
