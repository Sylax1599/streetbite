// Roles del sistema
export type Rol = 'cliente' | 'restaurante' | 'domiciliario';

// Estados posibles de un pedido
export type EstadoPedido =
  | 'creado'
  | 'aceptado'
  | 'en_preparacion'
  | 'listo'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

// Usuario autenticado (extraído del JWT de Firebase)
export interface UsuarioAutenticado {
  uid: string;
  email: string;
  rol: Rol;
  nombre?: string;
}

// Item dentro de un pedido
export interface ItemPedido {
  platoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

// Estructura de un pedido
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
  creadoEn: FirebaseFirestore.Timestamp | Date;
  actualizadoEn: FirebaseFirestore.Timestamp | Date;
}

// Estructura de un restaurante
export interface Restaurante {
  id?: string;
  nombre: string;
  descripcion: string;
  logoUrl?: string;
  direccion: string;
  activo: boolean;
  propietarioId: string;
  creadoEn: FirebaseFirestore.Timestamp | Date;
}

// Estructura de un plato del catálogo
export interface Plato {
  id?: string;
  nombre: string;
  descripcion: string;
  precio: number;
  fotoUrl?: string;
  disponible: boolean;
  categoria: string;
}

// Respuesta estándar de la API
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  mensaje?: string;
  error?: string;
}