import { db } from '../../config/firebase';
import { Calificacion, Pedido } from '../../shared/types';
import { NotFoundError, ForbiddenError, ValidationError } from '../../shared/errores';

export class CalificacionesService {

  async crear(
    pedidoId: string,
    clienteId: string,
    estrellas: number,
    comentario?: string
  ): Promise<Calificacion> {
    if (estrellas < 1 || estrellas > 5) {
      throw new ValidationError('La calificación debe ser entre 1 y 5 estrellas');
    }

    const pedidoDoc = await db.collection('pedidos').doc(pedidoId).get();
    if (!pedidoDoc.exists) throw new NotFoundError('Pedido');

    const pedido = pedidoDoc.data() as Pedido;

    if (pedido.clienteId !== clienteId) {
      throw new ForbiddenError('No eres el dueño de este pedido');
    }

    if (pedido.estado !== 'entregado') {
      throw new ValidationError('Solo puedes calificar pedidos entregados');
    }

    if (pedido.calificado) {
      throw new ValidationError('Este pedido ya fue calificado');
    }

    const nuevaCalificacion: Omit<Calificacion, 'id'> = {
      pedidoId,
      clienteId,
      restauranteId: pedido.restauranteId,
      domiciliarioId: pedido.domiciliarioId,
      estrellas,
      comentario,
      creadoEn: new Date(),
    };

    const ref = await db.collection('calificaciones').add(nuevaCalificacion);

    // Marca el pedido como calificado para no permitir doble calificación
    await db.collection('pedidos').doc(pedidoId).update({ calificado: true });

    return { id: ref.id, ...nuevaCalificacion };
  }

  // Promedio de calificaciones de un restaurante
  async obtenerPromedioRestaurante(restauranteId: string): Promise<{ promedio: number; total: number }> {
    const snapshot = await db.collection('calificaciones')
      .where('restauranteId', '==', restauranteId)
      .get();

    if (snapshot.empty) return { promedio: 0, total: 0 };

    const estrellas = snapshot.docs.map(d => d.data().estrellas as number);
    const promedio = estrellas.reduce((a, b) => a + b, 0) / estrellas.length;

    return { promedio: Math.round(promedio * 10) / 10, total: estrellas.length };
  }
}

export const calificacionesService = new CalificacionesService();