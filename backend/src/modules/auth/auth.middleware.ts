import { Request, Response, NextFunction } from 'express';
import { auth } from '../../config/firebase';
import { UsuarioAutenticado, Rol } from '../../shared/types';
import { NoAutorizadoError, ForbiddenError } from '../../shared/errores';

// Extendemos el tipo Request de Express para agregar el usuario autenticado
// Similar a agregar datos al SecurityContext de Spring
declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

// Middleware principal — verifica el JWT de Firebase
export const verificarToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new NoAutorizadoError('Token no proporcionado');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    // No exigimos rol aquí — puede ser null si el usuario
    // se acaba de crear y aún no pasó por /auth/registro
    req.usuario = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      rol: (decodedToken.rol as Rol) ?? null,
      nombre: decodedToken.nombre,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requiereRolAsignado = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.usuario?.rol || req.usuario.rol === 'cliente' && !req.usuario.uid) {
    return next(new ForbiddenError('Usuario sin rol asignado'));
  }
  next();
};

// Factory de middleware para restringir por rol
// Uso: requiereRol('restaurante') — como @PreAuthorize("hasRole('RESTAURANTE')")
export const requiereRol = (...roles: Rol[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return next(new NoAutorizadoError());
    }

    if (!req.usuario.rol || !roles.includes(req.usuario.rol)) {
      return next(
        new ForbiddenError(
          `Acción restringida para: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
};