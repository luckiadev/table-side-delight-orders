
-- Crear tabla de perfiles para almacenar nombre y rol del usuario
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  rol TEXT NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear trigger que inserte perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, rol)
  VALUES (NEW.id, NEW.email, 'cliente');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Activar RLS en productos y solo permitir admins crear, editar y eliminar productos
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Política para seleccionar productos (pública)
DROP POLICY IF EXISTS "Permitir leer productos a cualquier usuario" ON public.productos;
CREATE POLICY "Permitir leer productos a cualquiera"
  ON public.productos FOR SELECT USING (true);

-- Política para que solo admins puedan hacer modificaciones
DROP POLICY IF EXISTS "Permitir insertar productos a cualquiera" ON public.productos;
CREATE POLICY "Solo admin puede crear productos"
  ON public.productos FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Solo admin puede editar productos"
  ON public.productos FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Solo admin puede borrar productos"
  ON public.productos FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Opcional: activar RLS en pedidos y políticas si se requieren restricciones adicionales
