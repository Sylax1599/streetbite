import { messaging, db } from '../../config/firebase';

export class NotificacionesService {

  // Envía una notificación push a un usuario específico
  // Busca su FCM token en Firestore y lo usa para enviar via FCM
  async notificarUsuario(
    uid: string,
    titulo: string,
    cuerpo: string,
    datos?: Record<string, string>
  ): Promise<void> {
    try {
      const userDoc = await db.collection('usuarios').doc(uid).get();

      if (!userDoc.exists) return;

      const fcmToken = userDoc.data()?.fcmToken;

      // Si el usuario no tiene token registrado, no hay a dónde enviar
      if (!fcmToken) {
        console.log(JSON.stringify({
          severity: 'WARNING',
          message: `Usuario ${uid} sin FCM token registrado`,
        }));
        return;
      }

      await messaging.send({
        token: fcmToken,
        notification: { title: titulo, body: cuerpo },
        data: datos || {},
        apns: {
          // Configuración específica para iOS
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        android: {
          // Configuración específica para Android
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'pedidos',
          },
        },
      });

      console.log(JSON.stringify({
        severity: 'INFO',
        message: `Notificación enviada a usuario ${uid}`,
        titulo,
      }));
    } catch (error) {
      // No lanzamos el error — una notificación fallida no debe
      // interrumpir el flujo principal del pedido
      console.error(JSON.stringify({
        severity: 'ERROR',
        message: `Error enviando notificación a ${uid}`,
        error: String(error),
      }));
    }
  }
}

export const notificacionesService = new NotificacionesService();