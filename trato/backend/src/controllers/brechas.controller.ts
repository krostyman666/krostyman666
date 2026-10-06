import type { RequestHandler } from 'express';
import * as servicio from '../services/brechas.service';
import { ErrorApi } from '../utils/ErrorApi';

function exigirAuth(req: Parameters<RequestHandler>[0]): string {
  if (!req.auth) throw ErrorApi.noAutorizado();
  return req.auth.sub;
}

export const declarar: RequestHandler = async (req, res, next) => {
  try {
    const incidente = await servicio.declarar(exigirAuth(req), req.body);
    res.status(201).json({ incidente });
  } catch (error) {
    next(error);
  }
};

export const listar: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ incidentes: await servicio.listar() });
  } catch (error) {
    next(error);
  }
};

export const notificarAgencia: RequestHandler = async (req, res, next) => {
  try {
    res.json({ incidente: await servicio.notificarAgencia(req.params.id) });
  } catch (error) {
    next(error);
  }
};

export const notificarTitulares: RequestHandler = async (req, res, next) => {
  try {
    res.json({ incidente: await servicio.notificarTitulares(req.params.id) });
  } catch (error) {
    next(error);
  }
};

export const cerrar: RequestHandler = async (req, res, next) => {
  try {
    res.json({ incidente: await servicio.cerrar(req.params.id, req.body.medidasAdoptadas) });
  } catch (error) {
    next(error);
  }
};
