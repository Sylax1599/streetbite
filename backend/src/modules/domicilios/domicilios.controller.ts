import { Router, Request, Response, NextFunction } from 'express';
import { domiciliosService } from './domicilios.service';
import { verificarToken, requiereRol } from '../auth/auth.middleware';
import { ValidationError } from '../../shared/errores';

const router = Router();

// PATCH /domicilios/disponibilidad — activa/desactiva disponibilidad
router.patch('/disponibilidad', verificarToken, requiereRol('domiciliario'), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { disponible } = req.body;

    if (typeof disponible !== 'boolean') {
      throw new ValidationError('disponible debe ser true o false');
    }

    await domiciliosService.actualizarDisponibilidad(req.usuario!.uid, disponible);

    res.json({ ok: true, mensaje: `Disponibilidad actualizada a ${disponible}` });
  } catch (error) {
    next(error);
  }
});

// GET /domicilios/disponibles — pedidos listos para recoger
router.get('/disponibles', verificarToken, requiereRol('domiciliario'), async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pedidos = await domiciliosService.listarPedidosDisponibles();
    res.json({ ok: true, data: pedidos });
  } catch (error) {
    next(error);
  }
});

// POST /domicilios/pedidos/:id/aceptar — toma un pedido disponible
router.post('/pedidos/:id/aceptar', verificarToken, requiereRol('domiciliario'), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await domiciliosService.aceptarPedido(
      req.params.id as string,
      req.usuario!.uid
    );

    res.json({ ok: true, mensaje: 'Pedido aceptado, ahora está en camino' });
  } catch (error) {
    next(error);
  }
});

// GET /domicilios/historial — entregas completadas
router.get('/historial', verificarToken, requiereRol('domiciliario'), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const historial = await domiciliosService.obtenerHistorialEntregas(req.usuario!.uid);
    res.json({ ok: true, data: historial });
  } catch (error) {
    next(error);
  }
});

export default router;