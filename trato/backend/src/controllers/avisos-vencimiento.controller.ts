import type { RequestHandler } from 'express';
import * as servicio from '../services/avisos-vencimiento.service';

export const listar: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ propiedades: await servicio.propiedadesPorAvisar() });
  } catch (error) {
    next(error);
  }
};

export const enviar: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await servicio.enviarAvisosVencimiento());
  } catch (error) {
    next(error);
  }
};
