
-- Crear la tabla pedidos_casino
CREATE TABLE public.pedidos_casino (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_mesa INTEGER NOT NULL CHECK (numero_mesa >= 1 AND numero_mesa <= 50),
  productos JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL CHECK (total > 0),
  estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'En Preparación', 'Preparado', 'Entregado')) DEFAULT 'Pendiente',
  fecha_pedido TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_entregado TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.pedidos_casino ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir acceso público (sin autenticación para esta versión)
CREATE POLICY "Permitir acceso completo a pedidos_casino" 
  ON public.pedidos_casino 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Crear índices para optimizar consultas
CREATE INDEX idx_pedidos_casino_numero_mesa ON public.pedidos_casino(numero_mesa);
CREATE INDEX idx_pedidos_casino_estado ON public.pedidos_casino(estado);
CREATE INDEX idx_pedidos_casino_fecha_pedido ON public.pedidos_casino(fecha_pedido);
CREATE INDEX idx_pedidos_casino_created_at ON public.pedidos_casino(created_at);

-- Crear función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_pedidos_casino_updated_at
  BEFORE UPDATE ON public.pedidos_casino
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar datos de prueba
INSERT INTO public.pedidos_casino (numero_mesa, productos, total, estado, fecha_pedido) VALUES
(5, '[
  {"id": "4", "name": "Hamburguesa Clásica", "price": 8900, "quantity": 2},
  {"id": "5", "name": "Papas Fritas", "price": 3200, "quantity": 1},
  {"id": "1", "name": "Cerveza Corona", "price": 4500, "quantity": 1}
]'::jsonb, 21100, 'Pendiente', now()),

(12, '[
  {"id": "7", "name": "Pollo a la Plancha", "price": 12500, "quantity": 1},
  {"id": "2", "name": "Café Americano", "price": 2800, "quantity": 1}
]'::jsonb, 15300, 'En Preparación', now() - interval '15 minutes'),

(8, '[
  {"id": "1", "name": "Cerveza Corona", "price": 4500, "quantity": 3},
  {"id": "5", "name": "Papas Fritas", "price": 3200, "quantity": 2}
]'::jsonb, 19900, 'Preparado', now() - interval '25 minutes');
