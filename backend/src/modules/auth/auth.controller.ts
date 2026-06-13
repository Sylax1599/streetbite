import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { verificarToken } from './auth.middleware';
import { ValidationError } from '../../shared/errores';
import { ApiResponse, Rol } from '../../shared/types';

const router = Router();

const ROLES_VALIDOS: Rol[] = ['cliente', 'restaurante', 'domiciliario'];

// POST /auth/registro
// El usuario ya existe en Firebase Auth (lo creó la app móvil)
// Este endpoint completa su perfil en Firestore y asigna el rol
router.post('/registro', verificarToken, async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nombre, rol } = req.body;
    const uid = req.usuario!.uid;
    const email = req.usuario!.email;

    if (!nombre || typeof nombre !== 'string') {
      throw new ValidationError('El nombre es requerido');
    }

    if (!rol || !ROLES_VALIDOS.includes(rol)) {
      throw new ValidationError(
        `Rol inválido. Debe ser: ${ROLES_VALIDOS.join(', ')}`
      );
    }

    await authService.registrarUsuario(uid, nombre, email, rol);

    const response: ApiResponse<{ uid: string; rol: Rol }> = {
      ok: true,
      data: { uid, rol },
      mensaje: 'Usuario registrado exitosamente',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// GET /auth/perfil
// Retorna el perfil del usuario autenticado
router.get('/perfil', verificarToken, async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const perfil = await authService.obtenerPerfil(req.usuario!.uid);

    res.json({ ok: true, data: perfil });
  } catch (error) {
    next(error);
  }
});

// PATCH /auth/fcm-token
// La app móvil llama esto cada vez que obtiene un nuevo token de FCM
router.patch('/fcm-token', verificarToken, async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      throw new ValidationError('fcmToken es requerido');
    }

    await authService.actualizarFcmToken(req.usuario!.uid, fcmToken);

    res.json({ ok: true, mensaje: 'FCM token actualizado' });
  } catch (error) {
    next(error);
  }
});

export default router;