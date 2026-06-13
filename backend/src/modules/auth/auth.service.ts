import { auth, db } from '../../config/firebase';
import { Rol } from '../../shared/types';
import { AppError, NotFoundError } from '../../shared/errores';

export class AuthService {

  // Asigna un rol a un usuario via custom claims de Firebase
  // Se llama una vez cuando el usuario se registra
  async asignarRol(uid: string, rol: Rol): Promise<void> {
    try {
      // Verifica que el usuario existe en Firebase Auth
      await auth.getUser(uid);

      // Guarda el rol como custom claim en el JWT
      // La próxima vez que el usuario haga login, el token incluirá el rol
      await auth.setCustomUserClaims(uid, { rol });

      // También guardamos el usuario en Firestore para tener su perfil completo
      await db.collection('usuarios').doc(uid).set(
        {
          uid,
          rol,
          actualizadoEn: new Date(),
        },
        { merge: true } // merge:true para no sobreescribir campos existentes
      );
    } catch (error) {
      if ((error as any).code === 'auth/user-not-found') {
        throw new NotFoundError('Usuario');
      }
      throw new AppError('Error al asignar rol', 500);
    }
  }

  // Registra un usuario nuevo con su perfil completo en Firestore
  async registrarUsuario(
    uid: string,
    nombre: string,
    email: string,
    rol: Rol
  ): Promise<void> {
    // Asigna el rol en Firebase Auth
    await this.asignarRol(uid, rol);

    // Crea el perfil completo en Firestore
    await db.collection('usuarios').doc(uid).set({
      uid,
      nombre,
      email,
      rol,
      fcmToken: null, // Se actualizará desde la app móvil
      activo: true,
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    });
  }

  // Obtiene el perfil de un usuario desde Firestore
  async obtenerPerfil(uid: string) {
    const doc = await db.collection('usuarios').doc(uid).get();

    if (!doc.exists) {
      throw new NotFoundError('Perfil de usuario');
    }

    return doc.data();
  }

  // Actualiza el FCM token del dispositivo
  // Se llama desde la app móvil cada vez que cambia el token de push notifications
  async actualizarFcmToken(uid: string, fcmToken: string): Promise<void> {
    await db.collection('usuarios').doc(uid).update({
      fcmToken,
      actualizadoEn: new Date(),
    });
  }
}

export const authService = new AuthService();