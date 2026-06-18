import { Router, Request, Response, NextFunction } from 'express';
import { calificacionesService } from './calificaciones.service';
import { verificarToken, requiereRol } from '../auth/auth.middleware';
import { ValidationError } from '../../shared/errores';

const router = Router();

// POST /calificaciones — el cliente califica un pedido entregado
router.post('/', verificarToken, requiereRol('cliente'), async (
  req: Request, res: Response, next: NextFunction
) => {
  try {
    const { pedidoId, estrellas, comentario } = req.body;

    if (!pedidoId || estrellas === undefined) {
      throw new ValidationError('pedidoId y estrellas son requeridos');
    }

    const calificacion = await calificacionesService.crear(
      pedidoId, req.usuario!.uid, Number(estrellas), comentario
    );

    res.status(201).json({ ok: true, data: calificacion });
  } catch (error) {
    next(error);
  }
});

// GET /calificaciones/restaurante/:id — promedio de un restaurante
router.get('/restaurante/:id', verificarToken, async (
  req: Request, res: Response, next: NextFunction
) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await calificacionesService.obtenerPromedioRestaurante(id);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

export default router;