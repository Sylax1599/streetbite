import { db } from '../../config/firebase';
import { Pedido, EstadoPedido, ItemPedido } from '../../shared/types';
import { AppError, NotFoundError, ForbiddenError, ValidationError } from '../../shared/errores';
import { notificacionesService } from '../notificaciones/notificaciones.service';

// Mapa de transiciones válidas de estado
// Un pedido solo puede avanzar en este orden, nunca saltar pasos ni retroceder
const TRANSICIONES_VALIDAS: Record<EstadoPedido, EstadoPedido[]> = {
  creado:               ['aceptado', 'cancelado'],
  aceptado:             ['en_preparacion', 'cancelado'],
  en_preparacion:       ['listo'],
  listo:                ['en_camino'],
  en_camino:            ['entregado_pendiente'],
  entregado_pendiente:  ['entregado'], // confirmación del cliente o auto-confirm
  entregado:            [],
  cancelado:            [],
};

const MENSAJES_NOTIFICACION: Partial<Record<EstadoPedido, { titulo: string; cuerpo: string }>> = {
  aceptado:             { titulo: '¡Pedido aceptado! 🎉', cuerpo: 'El restaurante aceptó tu pedido y lo está preparando.' },
  en_preparacion:       { titulo: 'Preparando tu pedido', cuerpo: 'Tu comida está siendo preparada.' },
  listo:                { titulo: '¡Tu pedido está listo!', cuerpo: 'Un domiciliario recogerá tu pedido pronto.' },
  en_camino:            { titulo: '¡Tu pedido va en camino!', cuerpo: 'El domiciliario está llevando tu pedido.' },
  entregado_pendiente:  { titulo: '¿Recibiste tu pedido?', cuerpo: 'Confirma que llegó para completar tu orden.' },
  entregado:            { titulo: '¡Pedido completado!', cuerpo: '¡Que lo disfrutes! Califica tu experiencia.' },
  cancelado:            { titulo: 'Pedido cancelado', cuerpo: 'Tu pedido fue cancelado.' },
};

export class PedidosService {

  // Crea un pedido nuevo — solo clientes
  async crear(
    clienteId: string,
    restauranteId: string,
    items: ItemPedido[],
    direccionEntrega: string,
    notas?: string
  ): Promise<Pedido> {

    if (!items || items.length === 0) {
      throw new ValidationError('El pedido debe tener al menos un item');
    }

    // Verifica que el restaurante existe y está activo
    const restauranteDoc = await db.collection('restaurantes').doc(restauranteId).get();
    if (!restauranteDoc.exists || !restauranteDoc.data()?.activo) {
      throw new NotFoundError('Restaurante');
    }

    // Verifica que cada plato existe y está disponible, y toma el precio actual
    // Nunca confiamos en el precio que manda el cliente — lo sacamos de Firestore
    const itemsVerificados: ItemPedido[] = [];
    let total = 0;

    for (const item of items) {
      const platoDoc = await db
        .collection('restaurantes')
        .doc(restauranteId)
        .collection('catalogo')
        .doc(item.platoId)
        .get();

      if (!platoDoc.exists || !platoDoc.data()?.disponible) {
        throw new ValidationError(`Plato ${item.platoId} no disponible`);
      }

      const plato = platoDoc.data()!;
      const subtotal = plato.precio * item.cantidad;
      total += subtotal;

      itemsVerificados.push({
        platoId: item.platoId,
        nombre: plato.nombre,
        precio: plato.precio, // precio oficial desde Firestore
        cantidad: item.cantidad,
      });
    }

    const nuevoPedido: Omit<Pedido, 'id'> = {
      clienteId,
      restauranteId,
      items: itemsVerificados,
      estado: 'creado',
      total,
      direccionEntrega,
      notas,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };

    const ref = await db.collection('pedidos').add(nuevoPedido);

    // Notifica al restaurante que tiene un pedido nuevo
    const restaurantePropietarioId = restauranteDoc.data()!.propietarioId;
    await notificacionesService.notificarUsuario(
      restaurantePropietarioId,
      '¡Nuevo pedido! 🔔',
      `Tienes un nuevo pedido por $${total.toLocaleString()}`,
      { pedidoId: ref.id, tipo: 'nuevo_pedido' }
    );

    return { id: ref.id, ...nuevoPedido };
  }

  // Obtiene los pedidos del cliente autenticado
  async obtenerPedidosCliente(clienteId: string): Promise<Pedido[]> {
    const snapshot = await db.collection('pedidos')
      .where('clienteId', '==', clienteId)
      .orderBy('creadoEn', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Pedido));
  }

  // Obtiene los pedidos activos de un restaurante
  async obtenerPedidosRestaurante(restauranteId: string): Promise<Pedido[]> {
    const snapshot = await db.collection('pedidos')
      .where('restauranteId', '==', restauranteId)
      .orderBy('creadoEn', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Pedido));
  }

  // Obtiene los pedidos asignados a un domiciliario
  async obtenerPedidosDomiciliario(domiciliarioId: string): Promise<Pedido[]> {
    const snapshot = await db.collection('pedidos')
      .where('domiciliarioId', '==', domiciliarioId)
      .orderBy('creadoEn', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Pedido));
  }

  // Obtiene un pedido por ID
  async obtenerPorId(pedidoId: string): Promise<Pedido> {
    const doc = await db.collection('pedidos').doc(pedidoId).get();

    if (!doc.exists) throw new NotFoundError('Pedido');

    return { id: doc.id, ...doc.data() } as Pedido;
  }

async cambiarEstado(
  pedidoId: string,
  nuevoEstado: EstadoPedido,
  uid: string,
  rol: string,
  domiciliarioId?: string
): Promise<void> {

  const doc = await db.collection('pedidos').doc(pedidoId).get();
  if (!doc.exists) throw new NotFoundError('Pedido');

  const pedido = doc.data() as Pedido;
  const estadoActual = pedido.estado;

  if (!TRANSICIONES_VALIDAS[estadoActual].includes(nuevoEstado)) {
    throw new ValidationError(
      `No se puede cambiar de "${estadoActual}" a "${nuevoEstado}"`
    );
  }

  this.verificarPermisosCambioEstado(pedido, nuevoEstado, uid, rol);

  const actualizacion: Partial<Pedido> & { domiciliarioId?: string } = {
    estado: nuevoEstado,
    actualizadoEn: new Date(),
  };

  if (nuevoEstado === 'en_camino' && domiciliarioId) {
    actualizacion.domiciliarioId = domiciliarioId;
  }

  // Marca el timestamp para el auto-confirm
  if (nuevoEstado === 'entregado_pendiente') {
    actualizacion.entregadoPendienteEn = new Date();
  }

  await db.collection('pedidos').doc(pedidoId).update(actualizacion);

  const mensaje = MENSAJES_NOTIFICACION[nuevoEstado];
  if (mensaje) {
    await notificacionesService.notificarUsuario(
      pedido.clienteId,
      mensaje.titulo,
      mensaje.cuerpo,
      { pedidoId, estado: nuevoEstado, tipo: 'cambio_estado' }
    );
  }

  if (nuevoEstado === 'listo') {
    await this.notificarDomiciliariosDisponibles(pedidoId, pedido.restauranteId);
  }
}

// Nuevo método — confirmación explícita del cliente
async confirmarEntrega(pedidoId: string, clienteId: string): Promise<void> {
  const doc = await db.collection('pedidos').doc(pedidoId).get();
  if (!doc.exists) throw new NotFoundError('Pedido');

  const pedido = doc.data() as Pedido;

  if (pedido.clienteId !== clienteId) {
    throw new ForbiddenError('No eres el dueño de este pedido');
  }

  if (pedido.estado !== 'entregado_pendiente') {
    throw new ValidationError('Este pedido no está pendiente de confirmación');
  }

  await db.collection('pedidos').doc(pedidoId).update({
    estado: 'entregado',
    actualizadoEn: new Date(),
  });

  await notificacionesService.notificarUsuario(
    pedido.clienteId,
    '¡Gracias! 🎉',
    '¿Qué tal estuvo tu pedido? Califícalo.',
    { pedidoId, tipo: 'solicitar_calificacion' }
  );
}

// Nuevo método — reporta un problema en vez de confirmar
async reportarProblemaEntrega(pedidoId: string, clienteId: string, descripcion: string): Promise<void> {
  const doc = await db.collection('pedidos').doc(pedidoId).get();
  if (!doc.exists) throw new NotFoundError('Pedido');

  const pedido = doc.data() as Pedido;

  if (pedido.clienteId !== clienteId) {
    throw new ForbiddenError('No eres el dueño de este pedido');
  }

  // No cambiamos el estado automáticamente — queda para revisión manual
  await db.collection('pedidos').doc(pedidoId).update({
    actualizadoEn: new Date(),
    reporteProblema: descripcion,
  });
}

private verificarPermisosCambioEstado(
  pedido: Pedido,
  nuevoEstado: EstadoPedido,
  uid: string,
  rol: string
): void {
  if (['aceptado', 'en_preparacion', 'listo'].includes(nuevoEstado)) {
    if (rol !== 'restaurante') {
      throw new ForbiddenError('Solo el restaurante puede realizar esta acción');
    }
  }

  // El domiciliario marca en_camino y entregado_pendiente (llegó al destino)
  if (['en_camino', 'entregado_pendiente'].includes(nuevoEstado)) {
    if (rol !== 'domiciliario') {
      throw new ForbiddenError('Solo el domiciliario puede realizar esta acción');
    }
  }

  // Solo el cliente confirma la entrega final
  if (nuevoEstado === 'entregado') {
    if (pedido.clienteId !== uid && rol !== 'sistema') {
      throw new ForbiddenError('Solo el cliente puede confirmar la entrega');
    }
  }

  if (nuevoEstado === 'cancelado') {
    const puedeCancel = pedido.clienteId === uid || rol === 'restaurante';
    if (!puedeCancel) {
      throw new ForbiddenError('No tienes permisos para cancelar este pedido');
    }
  }
}

  // Notifica a todos los domiciliarios activos cuando un pedido está listo
  private async notificarDomiciliariosDisponibles(
    pedidoId: string,
    restauranteId: string
  ): Promise<void> {
    const snapshot = await db.collection('usuarios')
      .where('rol', '==', 'domiciliario')
      .where('activo', '==', true)
      .get();

    const notificaciones = snapshot.docs.map(doc =>
      notificacionesService.notificarUsuario(
        doc.id,
        '¡Pedido disponible! 🛵',
        'Hay un pedido listo para recoger',
        { pedidoId, restauranteId, tipo: 'pedido_disponible' }
      )
    );

    // Enviamos todas las notificaciones en paralelo
    await Promise.all(notificaciones);
  }
}

export const pedidosService = new PedidosService();