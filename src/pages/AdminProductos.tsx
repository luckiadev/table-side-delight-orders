import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NavigationHeader } from '@/components/NavigationHeader';
import { useProductos } from '@/hooks/useProductos';
import { formatNumber } from "@/lib/formatNumber";
import { useBreakpoint } from '@/hooks/use-mobile';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign,
  BarChart3,
  Eye,
  EyeOff,
  Save,
  X,
  Utensils,
  Coffee
} from 'lucide-react';

// ✅ CATEGORÍAS PERMITIDAS - Solo Alimentos y Bebidas
const CATEGORIAS_PERMITIDAS = ['alimentos', 'bebidas'] as const;
type CategoriaPermitida = typeof CATEGORIAS_PERMITIDAS[number];

// ✅ Mapeo de categorías a iconos y estilos
const CATEGORIA_CONFIG = {
  alimentos: {
    label: 'Alimentos',
    icon: Utensils,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  bebidas: {
    label: 'Bebidas', 
    icon: Coffee,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  }
} as const;

const AdminProductos = () => {
  const { isMobile } = useBreakpoint();
  const { productos, isLoading, crearProducto, actualizarProducto, eliminarProducto } = useProductos();
  
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showUnavailable, setShowUnavailable] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '' as CategoriaPermitida | '',
    disponible: true
  });

  // ✅ FILTRAR SOLO PRODUCTOS DE CATEGORÍAS PERMITIDAS
  const productosPermitidos = productos.filter(p => 
    CATEGORIAS_PERMITIDAS.includes(p.categoria as CategoriaPermitida)
  );
  
  const productosDisponibles = productosPermitidos.filter(p => p.disponible);
  const productosNoDisponibles = productosPermitidos.filter(p => !p.disponible);
  
  // ✅ CATEGORÍAS FILTRADAS - Solo las permitidas
  const categoriasUsadas = [...new Set(productosPermitidos.map(p => p.categoria))]
    .filter(cat => CATEGORIAS_PERMITIDAS.includes(cat as CategoriaPermitida));
  
  const precioPromedio = productosPermitidos.length > 0 
    ? productosPermitidos.reduce((sum, p) => sum + p.precio, 0) / productosPermitidos.length 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ VALIDAR QUE LA CATEGORÍA SEA PERMITIDA
    if (!CATEGORIAS_PERMITIDAS.includes(formData.categoria as CategoriaPermitida)) {
      alert('Por favor selecciona una categoría válida');
      return;
    }
    
    const productData = {
      ...formData,
      precio: parseFloat(formData.precio)
    };

    try {
      if (editingProduct) {
        await actualizarProducto(editingProduct.id, productData);
      } else {
        await crearProducto(productData);
      }
      
      // Reset form
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: '',
        disponible: true
      });
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (producto: any) => {
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio.toString(),
      categoria: producto.categoria,
      disponible: producto.disponible
    });
    setEditingProduct(producto);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      await eliminarProducto(id);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      categoria: '',
      disponible: true
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  // Grid configuration
  const getGridCols = () => {
    if (isMobile) return "grid-cols-1";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-sm sm:text-base text-gray-600">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Navigation Header */}
      <NavigationHeader
        title="Administración de Productos"
        subtitle=""
        showAdminControls={true}
      />

      {/* ✅ ESTADÍSTICAS MEJORADAS - Solo para categorías permitidas */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4`}>
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatNumber(productosPermitidos.length)}
                </p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Disponibles</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatNumber(productosDisponibles.length)}
                </p>
              </div>
              <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Categorías</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {formatNumber(categoriasUsadas.length)}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Precio Promedio</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  ${formatNumber(precioPromedio)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Lista de Productos</h2>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <Utensils className="h-3 w-3 mr-1" />
              Alimentos
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Coffee className="h-3 w-3 mr-1" />
              Bebidas
            </Badge>
          </div>
          <Button
            onClick={() => setShowUnavailable(!showUnavailable)}
            variant="outline"
            className="flex items-center space-x-2 w-fit"
          >
            {showUnavailable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>
              {showUnavailable ? 'Ocultar no disponibles' : `Ver no disponibles (${productosNoDisponibles.length})`}
            </span>
          </Button>
        </div>
        
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Producto</span>
        </Button>
      </div>

      {/* ✅ FORMULARIO LIMITADO - Solo categorías permitidas */}
      {showForm && (
        <Card className="shadow-xl border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Producto</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Ej: Pizza Napolitana"
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({...formData, precio: e.target.value})}
                    placeholder="0.00"
                    required
                    className="h-11"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value: CategoriaPermitida) => setFormData({...formData, categoria: value})}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PERMITIDAS.map((categoria) => {
                      const config = CATEGORIA_CONFIG[categoria];
                      const IconComponent = config.icon;
                      return (
                        <SelectItem key={categoria} value={categoria}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className={`h-4 w-4 ${config.color}`} />
                            <span className="capitalize">{config.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción del producto..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="disponible"
                  checked={formData.disponible}
                  onCheckedChange={(checked) => setFormData({...formData, disponible: checked})}
                />
                <Label htmlFor="disponible">Producto disponible</Label>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                <Button type="submit" className="flex items-center space-x-2 flex-1">
                  <Save className="h-4 w-4" />
                  <span>{editingProduct ? 'Actualizar' : 'Crear'} Producto</span>
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ✅ LISTA DE PRODUCTOS DISPONIBLES - Solo categorías permitidas */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Productos Disponibles</span>
            </div>
            <Badge variant="secondary">
              {productosDisponibles.length} productos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {categoriasUsadas.map(categoria => {
            const productosPorCategoria = productosDisponibles.filter(p => p.categoria === categoria);
            if (productosPorCategoria.length === 0) return null;
            
            const config = CATEGORIA_CONFIG[categoria as CategoriaPermitida];
            const IconComponent = config?.icon || Package;
            
            return (
              <div key={categoria} className="mb-8 last:mb-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${config?.bgColor || 'bg-gray-100'}`}>
                      <IconComponent className={`h-5 w-5 ${config?.color || 'text-gray-600'}`} />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 capitalize">
                      {config?.label || categoria}
                    </h3>
                  </div>
                  <Badge variant="outline" className={config?.borderColor}>
                    {productosPorCategoria.length} item{productosPorCategoria.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className={`grid ${getGridCols()} gap-4`}>
                  {productosPorCategoria.map((producto) => (
                    <Card key={producto.id} className="hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                      <CardContent className="p-4">
                        <div className="flex flex-col space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                              {producto.nombre}
                            </h4>
                            <Badge className="ml-2 bg-green-100 text-green-700">
                              ${formatNumber(producto.precio)}
                            </Badge>
                          </div>
                          
                          {producto.descripcion && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {producto.descripcion}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between pt-2">
                            <Badge variant={producto.disponible ? "default" : "secondary"}>
                              {producto.disponible ? "Disponible" : "No disponible"}
                            </Badge>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(producto)}
                                className="hover:bg-blue-50"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(producto.id)}
                                className="hover:bg-red-50 text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
          
          {productosDisponibles.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center items-center space-x-4 mb-4">
                <i className="fi fi-rr-burger-soda text-6xl text-orange-300"></i>
              </div>
              <p className="text-gray-500 text-base">
                No hay productos disponibles
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ PRODUCTOS NO DISPONIBLES - Solo categorías permitidas */}
      {showUnavailable && productosNoDisponibles.length > 0 && (
        <Card className="shadow-lg border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <EyeOff className="h-5 w-5" />
                <span>Productos No Disponibles</span>
              </div>
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                {productosNoDisponibles.length} productos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className={`grid ${getGridCols()} gap-4`}>
              {productosNoDisponibles.map((producto) => (
                <Card key={producto.id} className="opacity-75 hover:opacity-90 transition-opacity">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-700 line-clamp-2 flex-1">
                          {producto.nombre}
                        </h4>
                        <Badge variant="secondary" className="ml-2">
                          ${formatNumber(producto.precio)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="outline" className="border-orange-300 text-orange-700">
                          No disponible
                        </Badge>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(producto)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(producto.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminProductos;