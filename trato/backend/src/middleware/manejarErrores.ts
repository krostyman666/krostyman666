import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ValidationError, UniqueConstraintError } from 'sequelize';
import { ErrorApi } from '../utils/ErrorApi';
import { esProduccion } from '../config/env';

export const rutaNoEncontrada: RequestHandler = (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    codigo: 'no_encontrado',
    ruta: req.originalUrl,
  });
};

export const manejarErrores: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ErrorApi) {
    res.status(err.status).json({ error: err.message, codigo: err.codigo });
    return;
  }

  if (err instanceof UniqueConstraintError) {
    res.status(409).json({
      error: 'Ya existe un registro con esos datos',
      codigo: 'cuenta_duplicada',
    });
    return;
  }

  if (err instanceof ValidationError) {
    res.status(400).json({
      error: err.errors.map((e) => e.message).join('. '),
      codigo: 'validacion',
    });
    return;
  }

  console.error('Error no controlado:', err);
  res.status(500).json({
    error: esProduccion ? 'Error interno del servidor' : String(err?.message ?? err),
    codigo: 'error_interno',
  });
};
