export class AppError extends Error {
  constructor(
    public mensaje: string,
    public statusCode: number = 500,
    public codigo?: string
  ) {
    super(mensaje);
    this.name = 'AppError';
  }
}

export class NoAutorizadoError extends AppError {
  constructor(mensaje = 'No autorizado') {
    super(mensaje, 401, 'NO_AUTORIZADO');
  }
}

export class ForbiddenError extends AppError {
  constructor(mensaje = 'No tienes permisos para esta acción') {
    super(mensaje, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(recurso = 'Recurso') {
    super(`${recurso} no encontrado`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(mensaje: string) {
    super(mensaje, 400, 'VALIDATION_ERROR');
  }
}