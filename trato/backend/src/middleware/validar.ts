import type { RequestHandler } from 'express';
import type { ObjectSchema } from 'joi';
import { ErrorApi } from '../utils/ErrorApi';

export function validarCuerpo(schema: ObjectSchema): RequestHandler {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const detalle = error.details.map((d) => d.message).join('. ');
      next(ErrorApi.solicitudInvalida(detalle, 'validacion'));
      return;
    }

    req.body = value;
    next();
  };
}
