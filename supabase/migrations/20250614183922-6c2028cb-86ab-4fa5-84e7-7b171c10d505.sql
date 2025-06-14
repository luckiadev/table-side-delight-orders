
-- Haz que el primer usuario registrado sea admin y los siguientes cliente
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  cuentas integer;
  rol_asignado text;
BEGIN
  SELECT COUNT(*) INTO cuentas FROM public.perfiles;
  IF cuentas = 0 THEN
    rol_asignado := 'admin';
  ELSE
    rol_asignado := 'cliente';
  END IF;
  INSERT INTO public.perfiles (id, email, rol)
  VALUES (NEW.id, NEW.email, rol_asignado);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
