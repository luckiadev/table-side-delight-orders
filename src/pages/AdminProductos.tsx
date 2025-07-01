import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Package, DollarSign, Home, LogOut } from 'lucide-react';
import { useProductos, ProductoDB, NuevoProducto } from '@/hooks/useProductos';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatNumber } from "@/lib/formatNumber";
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const AdminProductos = () => {
  const { productos, isLoading, crearProducto, actualizarProducto, eliminarProducto, isCreating, isUpdating, isDeleting } = useProductos();
  const { logout } = useAuth();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoDB | null>(null);
  const [formData, setFormData] = useState<NuevoProducto>({
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria: 'bebestibles',
    disponible: true,
    imagen_url: ''
  });

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: 'bebestibles',
      disponible: true,
      imagen_url: ''
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (producto?: ProductoDB) => {
    if (producto) {
      setEditingProduct(producto);
      setFormData({
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        precio: producto.precio,
        categoria: producto.categoria,
        disponible: producto.disponible,
        imagen_url: producto.imagen_url || ''
      });
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      actualizarProducto({
        id: editingProduct.id,
        ...formData
      });
    } else {
      crearProducto(formData);
    }
    
    setShowDialog(false);
    resetForm();
  };

  const categorias = [...new Set(productos.map(p => p.categoria))];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center space-x-2">
          <Package className="h-10 w-10" />
          <span>Administración de Productos</span>
        </h1>
        <p className="text-gray-600">Gestiona el menú de productos del casino</p>
        <div className="flex justify-center space-x-4">
          <Link to="/">
            <Button variant="outline" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </Button>
          </Link>
          <Link to="/admin_pedidos">
            <Button variant="outline" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Administrar Pedidos</span>
            </Button>
          </Link>
          <Button variant="outline" onClick={logout} className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold">{productos.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold">{productos.filter(p => p.disponible).length}</p>
            </div>
            <Badge className="bg-green-500">Activos</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-600">Categorías</p>
              <p className="text-2xl font-bold">{categorias.length}</p>
            </div>
            <Package className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-600">Precio Promedio</p>
              <p className="text-2xl font-bold">
                ${productos.length > 0 ? formatNumber(productos.reduce((sum, p) => sum + p.precio, 0) / productos.length) : 0}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lista de Productos</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuevo Producto</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="precio">Precio</Label>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bebestibles">Bebestibles</SelectItem>
                    <SelectItem value="alimentos">Alimentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="disponible"
                  checked={formData.disponible}
                  onCheckedChange={(checked) => setFormData({...formData, disponible: checked})}
                />
                <Label htmlFor="disponible">Disponible</Label>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating || isUpdating}
                  className="flex-1"
                >
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de productos por categoría */}
      {categorias.map(categoria => (
        <Card key={categoria}>
          <CardHeader>
            <CardTitle>{categoria}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productos
                .filter(producto => producto.categoria === categoria)
                .map((producto) => (
                  <Card key={producto.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{producto.nombre}</h3>
                        <Badge variant={producto.disponible ? "default" : "secondary"}>
                          {producto.disponible ? 'Disponible' : 'No disponible'}
                        </Badge>
                      </div>
                      
                      {producto.descripcion && (
                        <p className="text-sm text-gray-600 mb-2">{producto.descripcion}</p>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-600">
                          ${formatNumber(producto.precio)}
                        </span>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(producto)}
                            disabled={isUpdating}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => eliminarProducto(producto.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {productos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay productos registrados</p>
            <p className="text-sm text-gray-400">Comienza agregando tu primer producto</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminProductos;
