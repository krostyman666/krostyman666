import type { RequestHandler } from 'express';
import * as servicio from '../services/datos-personales.service';
import { ErrorApi } from '../utils/ErrorApi';
import {
  CAMPOS_CON_REVISION,
  CAMPOS_RECTIFICABLES,
  DERECHOS,
  REGISTRO_TRATAMIENTO,
} from '../dominio/datos-personales';

function exigirAuth(req: Parameters<RequestHandler>[0]): string {
  if (!req.auth) throw ErrorApi.noAutorizado();
  return req.auth.sub;
}

/** Qué tratamos, para qué y qué derechos tiene el titular. */
export const registro: RequestHandler = (_req, res) => {
  res.json({
    registro: REGISTRO_TRATAMIENTO,
    derechos: DERECHOS,
    rectificables: CAMPOS_RECTIFICABLES,
    conRevision: CAMPOS_CON_REVISION,
  });
};

export const exportar: RequestHandler = async (req, res, next) => {
  try {
    const datos = await servicio.exportarDe(exigirAuth(req));
    // Portabilidad: un archivo que otro sistema pueda leer, no una pantalla.
    res.setHeader('Content-Disposition', 'attachment; filename="mis-datos-trato.json"');
    res.json(datos);
  } catch (error) {
    next(error);
  }
};

export const rectificar: RequestHandler = async (req, res, next) => {
  try {
    const usuario = await servicio.rectificar(exigirAuth(req), req.body);
    res.json({ usuario });
  } catch (error) {
    next(error);
  }
};

export const evaluarSupresion: RequestHandler = async (req, res, next) => {
  try {
    res.json(await servicio.evaluarSupresion(exigirAuth(req)));
  } catch (error) {
    next(error);
  }
};

export const suprimir: RequestHandler = async (req, res, next) => {
  try {
    res.json(await servicio.ejecutarSupresion(exigirAuth(req)));
  } catch (error) {
    next(error);
  }
};

export const vencidos: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ vencidos: await servicio.datosVencidos() });
  } catch (error) {
    next(error);
  }
};
