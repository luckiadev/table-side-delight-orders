
-- Eliminar la política existente de inserción que requiere autenticación, si existe
DROP POLICY IF EXISTS "Permitir insertar productos a usuario autenticado" ON public.productos;

-- Crear una política más permisiva: cualquier usuario puede insertar productos
CREATE POLICY "Permitir insertar productos a cualquiera"
  ON public.productos
  FOR INSERT
  WITH CHECK (true);
