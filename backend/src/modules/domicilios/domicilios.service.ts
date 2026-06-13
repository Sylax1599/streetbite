import { db } from '../../config/firebase';
import { Pedido } from '../../shared/types';
import { NotFoundError, ForbiddenError, ValidationError } from '../../shared/errores';
import { pedidosService } from '../pedidos/pedidos.service';

export class DomiciliosService {

  // Marca al domiciliario como disponible o no disponible
  // Solo domiciliarios marcados como "activo: true" reciben notificaciones de pedidos listos
  async actualizarDisponibilidad(uid: string, disponible: boolean): Promise<void> {
    const doc = await db.collection('usuarios').doc(uid).get();

    if (!doc.exists) throw new NotFoundError('Usuario');
    if (doc.data()?.rol !== 'domiciliario') {
      throw new ForbiddenError('Solo domiciliarios pueden cambiar su disponibilidad');
    }

    await db.collection('usuarios').doc(uid).update({
      activo: disponible,
      actualizadoEn: new Date(),
    });
  }

  // Lista pedidos en estado "listo" que aún no tienen domiciliario asignado
  // Estos son los pedidos disponibles para tomar
  async listarPedidosDisponibles(): Promise<Pedido[]> {
    const snapshot = await db.collection('pedidos')
      .where('estado', '==', 'listo')
      .orderBy('creadoEn', 'asc')
      .get();

    // Filtramos en memoria los que ya tienen domiciliario asignado
    // (Firestore no puede filtrar por "campo no existe" de forma directa)
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Pedido))
      .filter(pedido => !pedido.domiciliarioId);
  }

  // El domiciliario toma un pedido — lo asigna a sí mismo y avanza el estado a "en_camino"
  async aceptarPedido(pedidoId: string, domiciliarioId: string): Promise<void> {
    const doc = await db.collection('pedidos').doc(pedidoId).get();

    if (!doc.exists) throw new NotFoundError('Pedido');

    const pedido = doc.data() as Pedido;

    if (pedido.estado !== 'listo') {
      throw new ValidationError('Solo se pueden tomar pedidos en estado "listo"');
    }

    if (pedido.domiciliarioId) {
      throw new ValidationError('Este pedido ya fue tomado por otro domiciliario');
    }

    // Reutilizamos la lógica de transición de estado de pedidosService
    // que ya valida permisos y envía la notificación al cliente
    await pedidosService.cambiarEstado(
      pedidoId,
      'en_camino',
      domiciliarioId,
      'domiciliario',
      domiciliarioId
    );
  }

  // Historial de entregas completadas por el domiciliario
  async obtenerHistorialEntregas(domiciliarioId: string): Promise<Pedido[]> {
    const snapshot = await db.collection('pedidos')
      .where('domiciliarioId', '==', domiciliarioId)
      .where('estado', '==', 'entregado')
      .orderBy('creadoEn', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Pedido));
  }
}

export const domiciliosService = new DomiciliosService();