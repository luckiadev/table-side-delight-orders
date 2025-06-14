
-- Habilitar Row Level Security si no está ya activo
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Permitir leer productos a cualquier usuario (puedes ajustar después si lo deseas)
CREATE POLICY "Permitir leer productos a cualquier usuario"
  ON public.productos
  FOR SELECT
  USING (true);

-- Permitir insertar productos a cualquier usuario autenticado
CREATE POLICY "Permitir insertar productos a usuario autenticado"
  ON public.productos
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Permitir actualizar productos a cualquier usuario autenticado
CREATE POLICY "Permitir actualizar productos a usuario autenticado"
  ON public.productos
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Permitir borrar productos a cualquier usuario autenticado
CREATE POLICY "Permitir borrar productos a usuario autenticado"
  ON public.productos
  FOR DELETE
  USING (auth.uid() IS NOT NULL);
