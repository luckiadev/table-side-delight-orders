import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Pedido, NuevoPedido, Producto } from '@/types/pedido';
import { useMemo } from 'react';

export const usePedidos = (fechaInicio?: string, fechaFin?: string) => {
  const queryClient = useQueryClient();

  // Memoize query key to prevent unnecessary re-renders
  const queryKey = useMemo(() => ['pedidos', fechaInicio, fechaFin], [fechaInicio, fechaFin]);

  // Obtener todos los pedidos with optimized query
  const { data: pedidos = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('Fetching pedidos...');
      let query = supabase
        .from('pedidos_casino')
        .select('id, numero_mesa, productos, total, estado, fecha_pedido, fecha_entregado, nota, created_at, updated_at')
        .order('fecha_pedido', { ascending: false });

      // Aplicar filtros de fecha si están definidos
      if (fechaInicio) {
        query = query.gte('fecha_pedido', `${fechaInicio}T00:00:00`);
      }
      if (fechaFin) {
        query = query.lte('fecha_pedido', `${fechaFin}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pedidos:', error);
        throw error;
      }

      console.log('Pedidos fetched:', data?.length || 0);
      // Convertir los datos de la DB al tipo Pedido
      return data.map(item => ({
        ...item,
        productos: item.productos as unknown as Producto[]
      })) as Pedido[];
    },
    // Keep data fresh for admin panel
    staleTime: 10 * 1000, // 10 seconds
    // Enable automatic refetching for real-time updates
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  // ✅ CREAR NUEVO PEDIDO - SE AGREGAN NOTAS
  const crearPedidoMutation = useMutation({
    mutationFn: async (nuevoPedido: NuevoPedido) => {
      console.log('Creating pedido:', nuevoPedido);
      const { data, error } = await supabase
        .from('pedidos_casino')
        .insert([{
          numero_mesa: nuevoPedido.numero_mesa,
          productos: nuevoPedido.productos as any,
          total: nuevoPedido.total,
          nota: nuevoPedido.nota || ''
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating pedido:', error);
        throw error;
      }

      console.log('Pedido created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      
      console.log('Pedido creado exitosamente - Toast manejado por componente');
    },
    onError: (error) => {
      console.error('Error in crearPedidoMutation:', error);
      // SOLO THROW ERROR - El componente maneja el toast de error
      throw error;
    },
  });

  // ACTUALIZAR ESTADO DEL PEDIDO
  const actualizarEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: Pedido['estado'] }) => {
      console.log('Updating pedido estado:', { id, estado });
      const updateData: any = { estado };
      
      if (estado === 'Entregado') {
        updateData.fecha_entregado = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('pedidos_casino')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating pedido:', error);
        throw error;
      }

      console.log('Pedido updated:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      
      // ✅ TOAST BÁSICO PARA ADMIN (solo console log)
      console.log('Estado actualizado:', data.estado);
      
      // Nota: Si quieres toast para admin también, puedes usar:
      // toastSeniorFriendly({
      //   title: "Estado actualizado",
      //   description: `El pedido cambió a: ${data.estado}`,
      //   type: 'info'
      // });
    },
    onError: (error) => {
      console.error('Error in actualizarEstadoMutation:', error);
      // Error silencioso para admin - o agregar toast si es necesario
    },
  });

  return {
    pedidos,
    isLoading,
    error,
    crearPedido: crearPedidoMutation.mutate,
    actualizarEstado: (id: string, estado: Pedido['estado']) => 
      actualizarEstadoMutation.mutate({ id, estado }),
    isCreating: crearPedidoMutation.isPending,
    isUpdating: actualizarEstadoMutation.isPending,
  };
};