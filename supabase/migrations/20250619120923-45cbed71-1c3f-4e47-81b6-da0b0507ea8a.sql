
-- Eliminar la política restrictiva existente que requiere autenticación
DROP POLICY IF EXISTS "Permitir insertar productos a usuario autenticado" ON public.productos;
DROP POLICY IF EXISTS "Permitir actualizar productos a usuario autenticado" ON public.productos;
DROP POLICY IF EXISTS "Permitir borrar productos a usuario autenticado" ON public.productos;

-- Crear políticas más permisivas para operaciones CRUD
CREATE POLICY "Permitir insertar productos a cualquiera"
  ON public.productos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualizar productos a cualquiera"
  ON public.productos
  FOR UPDATE
  USING (true);

CREATE POLICY "Permitir borrar productos a cualquiera"
  ON public.productos
  FOR DELETE
  USING (true);
