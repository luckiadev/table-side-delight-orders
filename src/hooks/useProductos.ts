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

// ✅ CATEGORÍAS PERMITIDAS - Centralizadas
export const CATEGORIAS_PERMITIDAS = ['alimentos', 'bebidas'] as const;
export type CategoriaPermitida = typeof CATEGORIAS_PERMITIDAS[number];

// ✅ VALIDADOR DE CATEGORÍA
export const esCategoriaPermitida = (categoria: string): categoria is CategoriaPermitida => {
  return CATEGORIAS_PERMITIDAS.includes(categoria as CategoriaPermitida);
};

// ✅ CONFIGURACIÓN DE CATEGORÍAS (exportada para reutilizar)
export const CATEGORIA_CONFIG = {
  alimentos: {
    label: 'Alimentos',
    descripcion: 'Platos principales, snacks y comida en general',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    badgeStyle: 'bg-orange-100 text-orange-700'
  },
  bebidas: {
    label: 'Bebidas',
    descripcion: 'Bebidas calientes, frías y refrescos',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    badgeStyle: 'bg-blue-100 text-blue-700'
  }
} as const;

export const useProductos = () => {
  const queryClient = useQueryClient();

  // ✅ OBTENER SOLO PRODUCTOS DE CATEGORÍAS PERMITIDAS
  const { data: productos = [], isLoading, error } = useQuery({
    queryKey: ['productos', 'alimentos-bebidas'],
    queryFn: async () => {
      console.log('Fetching productos (solo alimentos y bebidas)...');

      // ✅ FILTRO A NIVEL DE BASE DE DATOS - Más eficiente
      // Select only needed columns to reduce payload
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, descripcion, precio, categoria, disponible, imagen_url, created_at, updated_at')
        .in('categoria', CATEGORIAS_PERMITIDAS) // Solo obtiene categorías permitidas
        .order('categoria, nombre');

      if (error) {
        console.error('Error fetching productos:', error);
        throw error;
      }

      // ✅ FILTRO ADICIONAL POR SEGURIDAD (en caso de datos inconsistentes)
      const productosFiltrados = data.filter(producto =>
        esCategoriaPermitida(producto.categoria)
      );

      console.log(`Productos fetched: ${productosFiltrados.length} (${productosFiltrados.filter(p => p.categoria === 'alimentos').length} alimentos, ${productosFiltrados.filter(p => p.categoria === 'bebidas').length} bebidas)`);

      return productosFiltrados as ProductoDB[];
    },
    // Products don't change often, keep them cached longer
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  // ✅ CREAR NUEVO PRODUCTO CON VALIDACIÓN DE CATEGORÍA
  const crearProductoMutation = useMutation({
    mutationFn: async (nuevoProducto: NuevoProducto) => {
      console.log('Creating producto:', nuevoProducto);
      
      // ✅ VALIDACIÓN DE CATEGORÍA ANTES DE ENVIAR
      if (!esCategoriaPermitida(nuevoProducto.categoria)) {
        throw new Error(`Categoría "${nuevoProducto.categoria}" no está permitida. Solo se permiten: ${CATEGORIAS_PERMITIDAS.join(', ')}`);
      }
      
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      
      const categoriaConfig = CATEGORIA_CONFIG[data.categoria as CategoriaPermitida];
      toast({
        title: "Producto creado",
        description: `${categoriaConfig?.label || 'Producto'} "${data.nombre}" creado exitosamente`,
      });
    },
    onError: (error) => {
      console.error('Error in crearProductoMutation:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el producto",
        variant: "destructive",
      });
    },
  });

  // ✅ ACTUALIZAR PRODUCTO CON VALIDACIÓN
  const actualizarProductoMutation = useMutation({
    mutationFn: async ({ id, ...datos }: Partial<ProductoDB> & { id: string }) => {
      console.log('Updating producto:', { id, datos });
      
      // ✅ VALIDACIÓN DE CATEGORÍA SI SE ESTÁ ACTUALIZANDO
      if (datos.categoria && !esCategoriaPermitida(datos.categoria)) {
        throw new Error(`Categoría "${datos.categoria}" no está permitida. Solo se permiten: ${CATEGORIAS_PERMITIDAS.join(', ')}`);
      }
      
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      
      const categoriaConfig = CATEGORIA_CONFIG[data.categoria as CategoriaPermitida];
      toast({
        title: "Producto actualizado",
        description: `${categoriaConfig?.label || 'Producto'} "${data.nombre}" actualizado exitosamente`,
      });
    },
    onError: (error) => {
      console.error('Error in actualizarProductoMutation:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el producto",
        variant: "destructive",
      });
    },
  });

  // ✅ ELIMINAR PRODUCTO
  const eliminarProductoMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting producto:', id);
      
      // ✅ OBTENER INFO DEL PRODUCTO ANTES DE ELIMINARLO (para el toast)
      const { data: productoInfo } = await supabase
        .from('productos')
        .select('nombre, categoria')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting producto:', error);
        throw error;
      }

      console.log('Producto deleted:', id);
      return { id, nombre: productoInfo?.nombre, categoria: productoInfo?.categoria };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      
      const categoriaConfig = CATEGORIA_CONFIG[data.categoria as CategoriaPermitida];
      toast({
        title: "Producto eliminado",
        description: `${categoriaConfig?.label || 'Producto'} "${data.nombre}" eliminado exitosamente`,
      });
    },
    onError: (error) => {
      console.error('Error in eliminarProductoMutation:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el producto",
        variant: "destructive",
      });
    },
  });

  // ✅ FUNCIONES AUXILIARES PARA COMPONENTES
  const obtenerProductosPorCategoria = (categoria: CategoriaPermitida) => {
    return productos.filter(p => p.categoria === categoria);
  };

  const obtenerProductosDisponibles = () => {
    return productos.filter(p => p.disponible);
  };

  const obtenerEstadisticas = () => {
    const alimentos = productos.filter(p => p.categoria === 'alimentos');
    const bebidas = productos.filter(p => p.categoria === 'bebidas');
    const disponibles = productos.filter(p => p.disponible);
    const precioPromedio = productos.length > 0 
      ? productos.reduce((sum, p) => sum + p.precio, 0) / productos.length 
      : 0;

    return {
      total: productos.length,
      alimentos: alimentos.length,
      bebidas: bebidas.length,
      disponibles: disponibles.length,
      noDisponibles: productos.length - disponibles.length,
      precioPromedio,
      categorias: CATEGORIAS_PERMITIDAS.length
    };
  };

  return {
    // ✅ DATOS
    productos,
    isLoading,
    error,
    
    // ✅ MUTACIONES
    crearProducto: crearProductoMutation.mutate,
    actualizarProducto: actualizarProductoMutation.mutate,
    eliminarProducto: eliminarProductoMutation.mutate,
    
    // ✅ ESTADOS DE MUTACIÓN
    isCreating: crearProductoMutation.isPending,
    isUpdating: actualizarProductoMutation.isPending,
    isDeleting: eliminarProductoMutation.isPending,
    
    // ✅ FUNCIONES AUXILIARES
    obtenerProductosPorCategoria,
    obtenerProductosDisponibles,
    obtenerEstadisticas,
    
    // ✅ CONSTANTES Y UTILIDADES
    CATEGORIAS_PERMITIDAS,
    CATEGORIA_CONFIG,
    esCategoriaPermitida
  };
};