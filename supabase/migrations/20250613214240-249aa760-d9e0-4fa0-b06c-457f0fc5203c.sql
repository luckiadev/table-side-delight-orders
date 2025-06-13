
-- Crear tabla de productos para el menú
CREATE TABLE public.productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  categoria TEXT NOT NULL DEFAULT 'General',
  disponible BOOLEAN NOT NULL DEFAULT true,
  imagen_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar algunos productos de ejemplo
INSERT INTO public.productos (nombre, descripcion, precio, categoria) VALUES
('Hamburguesa Clásica', 'Hamburguesa con carne, lechuga, tomate y queso', 8.50, 'Hamburguesas'),
('Pizza Margherita', 'Pizza con salsa de tomate, mozzarella y albahaca', 12.00, 'Pizzas'),
('Ensalada César', 'Lechuga, pollo, parmesano y aderezo césar', 7.50, 'Ensaladas'),
('Papas Fritas', 'Porción de papas fritas crujientes', 4.00, 'Acompañamientos'),
('Coca Cola', 'Bebida gaseosa 350ml', 2.50, 'Bebidas'),
('Agua Mineral', 'Agua mineral 500ml', 1.50, 'Bebidas');
