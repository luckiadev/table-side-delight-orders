-- ============================================================================
-- COMPLETE DATABASE SCHEMA FOR TABLE-SIDE DELIGHT ORDERS SYSTEM
-- Casino Ordering System - React + TypeScript + Supabase
-- ============================================================================
-- This file contains the complete database schema reconstruction
-- Ready to execute on a fresh Supabase instance
-- ============================================================================

-- Drop existing tables if they exist (for fresh installations)
DROP TABLE IF EXISTS public.pedidos_casino CASCADE;
DROP TABLE IF EXISTS public.productos CASCADE;
DROP TABLE IF EXISTS public.perfiles CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: productos
-- Stores menu items (food and beverages)
-- ============================================================================

CREATE TABLE public.productos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  categoria TEXT NOT NULL DEFAULT 'General' CHECK (categoria IN ('alimentos', 'bebidas')),
  disponible BOOLEAN NOT NULL DEFAULT true,
  imagen_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for productos table
CREATE INDEX idx_productos_categoria ON public.productos(categoria);
CREATE INDEX idx_productos_disponible ON public.productos(disponible);
CREATE INDEX idx_productos_categoria_disponible ON public.productos(categoria, disponible);
CREATE INDEX idx_productos_created_at ON public.productos(created_at DESC);

-- Trigger for productos updated_at
CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for productos
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for productos
-- Public can read, only authenticated users can modify
CREATE POLICY "Allow public read access to productos"
  ON public.productos
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert to productos"
  ON public.productos
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update to productos"
  ON public.productos
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete to productos"
  ON public.productos
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- TABLE: pedidos_casino
-- Stores customer orders
-- ============================================================================

CREATE TABLE public.pedidos_casino (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_mesa INTEGER NOT NULL CHECK (numero_mesa >= 0 AND numero_mesa <= 500),
  productos JSONB NOT NULL,
  total NUMERIC(10,2) NOT NULL CHECK (total > 0),
  estado TEXT NOT NULL CHECK (estado IN ('Pendiente', 'En Preparación', 'Preparado', 'Entregado')) DEFAULT 'Pendiente',
  fecha_pedido TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_entregado TIMESTAMP WITH TIME ZONE,
  nota TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for pedidos_casino table (CRITICAL for performance)
CREATE INDEX idx_pedidos_casino_numero_mesa ON public.pedidos_casino(numero_mesa);
CREATE INDEX idx_pedidos_casino_estado ON public.pedidos_casino(estado);
CREATE INDEX idx_pedidos_casino_fecha_pedido ON public.pedidos_casino(fecha_pedido DESC);
CREATE INDEX idx_pedidos_casino_created_at ON public.pedidos_casino(created_at DESC);
CREATE INDEX idx_pedidos_casino_estado_fecha ON public.pedidos_casino(estado, fecha_pedido DESC);
CREATE INDEX idx_pedidos_casino_fecha_pedido_range ON public.pedidos_casino(fecha_pedido);

-- Trigger for pedidos_casino updated_at
CREATE TRIGGER update_pedidos_casino_updated_at
  BEFORE UPDATE ON public.pedidos_casino
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for pedidos_casino
ALTER TABLE public.pedidos_casino ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pedidos_casino
-- Anyone can create orders (customers), but only authenticated users can view/modify
CREATE POLICY "Allow anyone to create pedidos"
  ON public.pedidos_casino
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to read pedidos"
  ON public.pedidos_casino
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated to update pedidos"
  ON public.pedidos_casino
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated to delete pedidos"
  ON public.pedidos_casino
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- TABLE: perfiles (Optional - for user management)
-- Stores user profiles
-- ============================================================================

CREATE TABLE public.perfiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('admin', 'supervisor', 'cliente', 'mesero')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for perfiles
CREATE INDEX idx_perfiles_email ON public.perfiles(email);
CREATE INDEX idx_perfiles_rol ON public.perfiles(rol);

-- Enable RLS for perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for perfiles
CREATE POLICY "Allow users to view their own profile"
  ON public.perfiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
  ON public.perfiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- SEED DATA
-- Sample products for testing
-- ============================================================================

INSERT INTO public.productos (nombre, descripcion, precio, categoria, disponible) VALUES
-- Alimentos
('Hamburguesa Clásica', 'Hamburguesa con carne 100% res, lechuga, tomate, queso y papas fritas', 8900, 'alimentos', true),
('Pizza Margherita', 'Pizza tradicional con salsa de tomate, mozzarella fresca y albahaca', 12000, 'alimentos', true),
('Ensalada César', 'Lechuga romana, pollo a la parrilla, crutones, parmesano y aderezo césar', 7500, 'alimentos', true),
('Papas Fritas', 'Porción grande de papas fritas crujientes con sal de mar', 3200, 'alimentos', true),
('Sándwich Club', 'Triple sandwich con pollo, tocino, lechuga, tomate y mayonesa', 9500, 'alimentos', true),
('Pollo a la Plancha', 'Pechuga de pollo a la plancha con vegetales salteados', 12500, 'alimentos', true),
('Nuggets de Pollo', '10 nuggets de pollo con salsa a elección', 6500, 'alimentos', true),
('Alitas BBQ', '12 alitas de pollo con salsa BBQ y apio', 10500, 'alimentos', true),

-- Bebidas
('Cerveza Corona', 'Cerveza Corona 355ml', 4500, 'bebidas', true),
('Coca Cola', 'Coca Cola 350ml', 2500, 'bebidas', true),
('Agua Mineral', 'Agua mineral natural 500ml', 1800, 'bebidas', true),
('Café Americano', 'Café americano caliente', 2800, 'bebidas', true),
('Jugo Natural', 'Jugo natural de naranja o fresa', 3500, 'bebidas', true),
('Limonada', 'Limonada natural con hierbabuena', 3000, 'bebidas', true),
('Té Helado', 'Té negro helado con limón', 2800, 'bebidas', true),
('Smoothie Frutas', 'Smoothie de frutas tropicales', 4500, 'bebidas', true);

-- ============================================================================
-- SAMPLE ORDERS FOR TESTING
-- ============================================================================

INSERT INTO public.pedidos_casino (numero_mesa, productos, total, estado, fecha_pedido, nota) VALUES
(5, '[
  {"id": "prod-1", "name": "Hamburguesa Clásica", "price": 8900, "quantity": 2},
  {"id": "prod-2", "name": "Papas Fritas", "price": 3200, "quantity": 1},
  {"id": "prod-3", "name": "Cerveza Corona", "price": 4500, "quantity": 1}
]'::jsonb, 25500, 'Pendiente', now(), 'Cliente preguntar por mesero Juan'),

(12, '[
  {"id": "prod-4", "name": "Pollo a la Plancha", "price": 12500, "quantity": 1},
  {"id": "prod-5", "name": "Café Americano", "price": 2800, "quantity": 1}
]'::jsonb, 15300, 'En Preparación', now() - interval '15 minutes', ''),

(8, '[
  {"id": "prod-6", "name": "Cerveza Corona", "price": 4500, "quantity": 3},
  {"id": "prod-7", "name": "Papas Fritas", "price": 3200, "quantity": 2}
]'::jsonb, 19900, 'Preparado', now() - interval '25 minutes', 'Mesa VIP');

-- ============================================================================
-- PERFORMANCE OPTIMIZATION NOTES
-- ============================================================================
-- 1. All indexes are created for commonly queried columns
-- 2. Composite indexes for frequently combined WHERE clauses
-- 3. JSONB used for flexible product storage in orders
-- 4. RLS enabled but with permissive policies (can be restricted later)
-- 5. Triggers for automatic timestamp updates
-- 6. Check constraints for data integrity
-- 7. Foreign keys for referential integrity (perfiles table)
-- ============================================================================

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the schema was created correctly:

-- Check all tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check indexes
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Count products
-- SELECT COUNT(*) FROM public.productos;

-- Count orders
-- SELECT COUNT(*) FROM public.pedidos_casino;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
