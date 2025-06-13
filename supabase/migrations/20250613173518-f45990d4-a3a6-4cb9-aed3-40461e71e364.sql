
-- Actualizar la restricción de número de mesa para permitir de 0 a 500
ALTER TABLE public.pedidos_casino 
DROP CONSTRAINT pedidos_casino_numero_mesa_check;

-- Agregar nueva restricción con el rango correcto
ALTER TABLE public.pedidos_casino 
ADD CONSTRAINT pedidos_casino_numero_mesa_check 
CHECK (numero_mesa >= 0 AND numero_mesa <= 500);
