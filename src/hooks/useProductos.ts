
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProductoDB {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string;
  disponible: boolean;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface NuevoProducto {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  disponible?: boolean;
  imagen_url?: string;
}

export const useProductos = () => {
  const queryClient = useQueryClient();

  // Obtener todos los productos
  const { data: productos = [], isLoading, error } = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      console.log('Fetching productos...');
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('categoria, nombre');

      if (error) {
        console.error('Error fetching productos:', error);
        throw error;
      }

      console.log('Productos fetched:', data);
      return data as ProductoDB[];
    },
  });

  // Crear nuevo producto
  const crearProductoMutation = useMutation({
    mutationFn: async (nuevoProducto: NuevoProducto) => {
      console.log('Creating producto:', nuevoProducto);
      const { data, error } = await supabase
        .from('productos')
        .insert([nuevoProducto])
        .select()
        .single();

      if (error) {
        console.error('Error creating producto:', error);
        throw error;
      }

      console.log('Producto created:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast({
        title: "Producto creado",
        description: "El producto se ha creado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error in crearProductoMutation:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive",
      });
    },
  });

  // Actualizar producto
  const actualizarProductoMutation = useMutation({
    mutationFn: async ({ id, ...datos }: Partial<ProductoDB> & { id: string }) => {
      console.log('Updating producto:', { id, datos });
      const { data, error } = await supabase
        .from('productos')
        .update(datos)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating producto:', error);
        throw error;
      }

      console.log('Producto updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast({
        title: "Producto actualizado",
        description: "El producto se ha actualizado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error in actualizarProductoMutation:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        variant: "destructive",
      });
    },
  });

  // Eliminar producto
  const eliminarProductoMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting producto:', id);
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting producto:', error);
        throw error;
      }

      console.log('Producto deleted:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado exitosamente",
      });
    },
    onError: (error) => {
      console.error('Error in eliminarProductoMutation:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      });
    },
  });

  return {
    productos,
    isLoading,
    error,
    crearProducto: crearProductoMutation.mutate,
    actualizarProducto: actualizarProductoMutation.mutate,
    eliminarProducto: eliminarProductoMutation.mutate,
    isCreating: crearProductoMutation.isPending,
    isUpdating: actualizarProductoMutation.isPending,
    isDeleting: eliminarProductoMutation.isPending,
  };
};
