import { Router, Request, Response, NextFunction } from 'express';
import { restaurantesService } from './restaurantes.service';
import { verificarToken, requiereRol } from '../auth/auth.middleware';
import { ValidationError } from '../../shared/errores';

const param = (valor: string | string[]): string =>
  Array.isArray(valor) ? valor[0] : valor;

const router = Router();

// GET /restaurantes — lista todos los restaurantes activos
// Público — cualquier usuario autenticado puede ver la lista
router.get('/', verificarToken, async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurantes = await restaurantesService.listar();
    res.json({ ok: true, data: restaurantes });
  } catch (error) {
    next(error);
  }
});

// GET /restaurantes/mi-restaurante — el restaurante del dueño autenticado
router.get('/mi-restaurante', verificarToken, requiereRol('restaurante'), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurante = await restaurantesService.obtenerMiRestaurante(req.usuario!.uid);
    res.json({ ok: true, data: restaurante });
  } catch (error) {
    next(error);
  }
});

// GET /restaurantes/:id — detalle de un restaurante con catálogo
router.get('/:id', verificarToken, async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurante = await restaurantesService.obtenerPorId(param(req.params.id));
    res.json({ ok: true, data: restaurante });
  } catch (error) {
    next(error);
  }
});

// POST /restaurantes — crea un restaurante nuevo
router.post('/', verificarToken, requiereRol('restaurante'), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nombre, descripcion, direccion } = req.body;

    if (!nombre || !descripcion || !direccion) {
      throw new ValidationError('nombre, descripcion y direccion son requeridos');
    }

    const restaurante = await restaurantesService.crear(
      req.usuario!.uid,
      { nombre, descripcion, direccion }
    );

    res.status(201).json({ ok: true, data: restaurante });
  } catch (error) {
    next(error);
  }
});

// PATCH /restaurantes/:id — actualiza datos del restaurante
router.patch('/:id', verificarToken, requiereRol('restaurante'), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await restaurantesService.actualizar(
      param(req.params.id),
      req.usuario!.uid,
      req.body
    );
    res.json({ ok: true, mensaje: 'Restaurante actualizado' });
  } catch (error) {
    next(error);
  }
});

// POST /restaurantes/:id/logo — genera URL para subir el logo
router.post('/:id/logo', verificarToken, requiereRol('restaurante'), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const url = await restaurantesService.generarUrlSubidaLogo(
      param(req.params.id),
      req.usuario!.uid
    );
    res.json({ ok: true, data: { uploadUrl: url } });
  } catch (error) {
    next(error);
  }
});

// POST /restaurantes/:id/catalogo — agrega un plato al catálogo
router.post('/:id/catalogo', verificarToken, requiereRol('restaurante'), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { nombre, descripcion, precio, categoria } = req.body;

    if (!nombre || !descripcion || !precio || !categoria) {
      throw new ValidationError('nombre, descripcion, precio y categoria son requeridos');
    }

    const plato = await restaurantesService.agregarPlato(
      param(req.params.id),
      req.usuario!.uid,
      { nombre, descripcion, precio: Number(precio), categoria, disponible: true }
    );

    res.status(201).json({ ok: true, data: plato });
  } catch (error) {
    next(error);
  }
});

// PATCH /restaurantes/:id/catalogo/:platoId — actualiza un plato
router.patch('/:id/catalogo/:platoId', verificarToken, requiereRol('restaurante'), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await restaurantesService.actualizarPlato(
      param(req.params.id),
      param(req.params.platoId),
      req.usuario!.uid,
      req.body
    );
    res.json({ ok: true, mensaje: 'Plato actualizado' });
  } catch (error) {
    next(error);
  }
});

// POST /restaurantes/:id/catalogo/:platoId/foto — URL para subir foto del plato
router.post('/:id/catalogo/:platoId/foto', verificarToken, requiereRol('restaurante'), async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const url = await restaurantesService.generarUrlSubidaFotoPlato(
      param(req.params.id),
      param(req.params.platoId),
      req.usuario!.uid
    );
    res.json({ ok: true, data: { uploadUrl: url } });
  } catch (error) {
    next(error);
  }
});

export default router;