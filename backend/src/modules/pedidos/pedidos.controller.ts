import { Router, Request, Response, NextFunction } from 'express';
import { pedidosService } from './pedidos.service';
import { verificarToken, requiereRol } from '../auth/auth.middleware';
import { ValidationError } from '../../shared/errores';
import { EstadoPedido } from '../../shared/types';

const router = Router();

const ESTADOS_VALIDOS: EstadoPedido[] = [
  'creado', 'aceptado', 'en_preparacion',
  'listo', 'en_camino', 'entregado', 'cancelado'
];

// POST /pedidos — cliente crea un pedido
router.post('/', verificarToken, requiereRol('cliente'), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { restauranteId, items, direccionEntrega, notas } = req.body;

    if (!restauranteId || !items || !direccionEntrega) {
      throw new ValidationError('restauranteId, items y direccionEntrega son requeridos');
    }

    const pedido = await pedidosService.crear(
      req.usuario!.uid,
      restauranteId,
      items,
      direccionEntrega,
      notas
    );

    res.status(201).json({ ok: true, data: pedido });
  } catch (error) {
    next(error);
  }
});

// GET /pedidos — obtiene pedidos según el rol del usuario
router.get('/', verificarToken, async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { uid, rol } = req.usuario!;
    let pedidos;

    if (rol === 'cliente') {
      pedidos = await pedidosService.obtenerPedidosCliente(uid);
    } else if (rol === 'restaurante') {
      // El restaurante ve pedidos por su restauranteId
      const restauranteId = req.query.restauranteId as string;
      if (!restauranteId) throw new ValidationError('restauranteId es requerido');
      pedidos = await pedidosService.obtenerPedidosRestaurante(restauranteId);
    } else {
      // Domiciliario ve sus pedidos asignados
      pedidos = await pedidosService.obtenerPedidosDomiciliario(uid);
    }

    res.json({ ok: true, data: pedidos });
  } catch (error) {
    next(error);
  }
});

// GET /pedidos/:id — detalle de un pedido
router.get('/:id', verificarToken, async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pedido = await pedidosService.obtenerPorId(req.params.id as string);
    res.json({ ok: true, data: pedido });
  } catch (error) {
    next(error);
  }
});

// PATCH /pedidos/:id/estado — cambia el estado del pedido
router.patch('/:id/estado', verificarToken, async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { estado, domiciliarioId } = req.body;

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      throw new ValidationError(
        `Estado inválido. Debe ser: ${ESTADOS_VALIDOS.join(', ')}`
      );
    }

    await pedidosService.cambiarEstado(
      req.params.id as string,
      estado,
      req.usuario!.uid,
      req.usuario!.rol || 'cliente',
      domiciliarioId
    );

    res.json({ ok: true, mensaje: `Pedido actualizado a "${estado}"` });
  } catch (error) {
    next(error);
  }
});

// PATCH /pedidos/:id/confirmar-entrega — el cliente confirma que recibió el pedido
router.patch('/:id/confirmar-entrega', verificarToken, requiereRol('cliente'), async (
  req: Request, res: Response, next: NextFunction
) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await pedidosService.confirmarEntrega(id, req.usuario!.uid);
    res.json({ ok: true, mensaje: 'Entrega confirmada' });
  } catch (error) {
    next(error);
  }
});

// PATCH /pedidos/:id/reportar-problema — el cliente reporta que no le llegó
router.patch('/:id/reportar-problema', verificarToken, requiereRol('cliente'), async (
  req: Request, res: Response, next: NextFunction
) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { descripcion } = req.body;
    if (!descripcion) throw new ValidationError('descripcion es requerida');
    await pedidosService.reportarProblemaEntrega(id, req.usuario!.uid, descripcion);
    res.json({ ok: true, mensaje: 'Reporte enviado, nuestro equipo lo revisará' });
  } catch (error) {
    next(error);
  }
});

export default router;