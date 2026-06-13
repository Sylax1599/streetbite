import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppError } from './shared/errores';
import { ApiResponse } from './shared/types';
import authRouter from './modules/auth/auth.controller';
import restaurantesRouter from './modules/restaurantes/restaurantes.controller';
import pedidosRouter from './modules/pedidos/pedidos.controller';
import domiciliosRouter from './modules/domicilios/domicilios.controller';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    servicio: 'StreetBite API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRouter);
app.use('/restaurantes', restaurantesRouter);
app.use('/pedidos', pedidosRouter);
app.use('/domicilios', domiciliosRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(JSON.stringify({
    severity: 'ERROR',
    message: err.message,
    stack: err.stack,
  }));

  if (err instanceof AppError) {
    const response: ApiResponse<null> = {
      ok: false,
      error: err.codigo,
      mensaje: err.mensaje,
    };
    return res.status(err.statusCode).json(response);
  }

  res.status(500).json({
    ok: false,
    error: 'INTERNAL_ERROR',
    mensaje: 'Error interno del servidor',
  });
});

app.listen(PORT, () => {
  console.log(JSON.stringify({
    severity: 'INFO',
    message: `StreetBite API corriendo en puerto ${PORT}`,
  }));
});

export default app;