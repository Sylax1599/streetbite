export type Rol = 'cliente' | 'restaurante' | 'domiciliario';

export type EstadoPedido =
  | 'creado'
  | 'aceptado'
  | 'en_preparacion'
  | 'listo'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export interface UsuarioApp {
  uid: string;
  nombre: string;
  email: string;
  rol: Rol;
  fcmToken?: string;
}

export interface ItemPedido {
  platoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface Pedido {
  id?: string;
  clienteId: string;
  restauranteId: string;
  domiciliarioId?: string;
  items: ItemPedido[];
  estado: EstadoPedido;
  total: number;
  direccionEntrega: string;
  notas?: string;
  creadoEn: any;
  actualizadoEn: any;
}

export interface Restaurante {
  id?: string;
  nombre: string;
  descripcion: string;
  logoUrl?: string;
  direccion: string;
  activo: boolean;
  propietarioId: string;
}

export interface Plato {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  fotoUrl?: string;
  disponible: boolean;
  categoria: string;
}