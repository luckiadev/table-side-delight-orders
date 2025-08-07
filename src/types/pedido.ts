
export interface Producto {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Pedido {
  id: string;
  numero_mesa: number;
  productos: Producto[];
  total: number;
  estado: 'Pendiente' | 'En Preparación' | 'Preparado' | 'Entregado';
  fecha_pedido: string;
  fecha_entregado?: string;
  created_at: string;
  updated_at: string;
  nota: string;
}

export interface NuevoPedido {
  numero_mesa: number;
  productos: Producto[];
  total: number;
  nota: string;
}
