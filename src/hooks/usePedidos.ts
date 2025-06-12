import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Pedido, NuevoPedido, Producto } from '@/types/pedido';
import { toast } from '@/hooks/use-toast';

export const usePedidos = () => {
  const queryClient = useQueryClient();

  // Obtener todos los pedidos
  const { data: pedidos = [], isLoading, error } = useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => {
      console.log('Fetching pedidos...');
      const { data, error } = await supabase
        .from('pedidos_casino')
        .select('*')
        .order('fecha_pedido', { ascending: false });
      
      if (error) {
        console.error('Error fetching pedidos:', error);
        throw error;
      }
      
      console.log('Pedidos fetched:', data);
      // Convertir los datos de la DB al tipo Pedido
      return data.map(item => ({
        ...item,
        productos: item.productos as unknown as Producto[]
      })) as Pedido[];
    },
  });

  // Crear nuevo pedido
  const crearPedidoMutation = useMutation({
    mutationFn: async (nuevoPedido: NuevoPedido) => {
      console.log('Creating pedido:', nuevoPedido);
      const { data, error } = await supabase
        .from('pedidos_casino')
        .insert([{
          numero_mesa: nuevoPedido.numero_mesa,
          productos: nuevoPedido.productos as any,
          total: nuevoPedido.total
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
      toast({
        title: "Pedido creado",
        description: "El pedido se ha creado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error in crearPedidoMutation:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el pedido",
        variant: "destructive",
      });
    },
  });

  // Actualizar estado del pedido
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del pedido se ha actualizado",
      });
    },
    onError: (error) => {
      console.error('Error in actualizarEstadoMutation:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      });
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
