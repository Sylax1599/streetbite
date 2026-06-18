import { db } from '../../config/firebase';
import { pedidosService } from './pedidos.service';

// Auto-confirma pedidos que llevan más de 2 horas en entregado_pendiente
export async function autoConfirmarEntregas(): Promise<number> {
  const dosHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const snapshot = await db.collection('pedidos')
    .where('estado', '==', 'entregado_pendiente')
    .where('entregadoPendienteEn', '<=', dosHorasAtras)
    .get();

  let confirmados = 0;

  for (const doc of snapshot.docs) {
    const pedido = doc.data();
    try {
      await db.collection('pedidos').doc(doc.id).update({
        estado: 'entregado',
        actualizadoEn: new Date(),
        autoConfirmado: true,
      });
      confirmados++;
    } catch (error) {
      console.error(JSON.stringify({
        severity: 'ERROR',
        message: `Error auto-confirmando pedido ${doc.id}`,
        error: String(error),
      }));
    }
  }

  return confirmados;
}