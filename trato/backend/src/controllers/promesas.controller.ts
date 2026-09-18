import type { RequestHandler } from 'express';
import * as servicio from '../services/promesas.service';
import { ErrorApi } from '../utils/ErrorApi';
import { CLAUSULAS, PLAZOS_SUGERIDOS, REQUISITOS_1554 } from '../dominio/promesa';

function exigirAuth(req: Parameters<RequestHandler>[0]): string {
  if (!req.auth) throw ErrorApi.noAutorizado();
  return req.auth.sub;
}

/** Qué cláusulas existen y qué exige el 1554. Público: explica el producto. */
export const catalogo: RequestHandler = (_req, res) => {
  res.json({ clausulas: CLAUSULAS, requisitos: REQUISITOS_1554, plazos: PLAZOS_SUGERIDOS });
};

export const abrir: RequestHandler = async (req, res, next) => {
  try {
    const promesa = await servicio.abrir(req.params.propiedadId, exigirAuth(req), req.body);
    res.status(201).json({ promesa });
  } catch (error) {
    next(error);
  }
};

export const mias: RequestHandler = async (req, res, next) => {
  try {
    res.json({ promesas: await servicio.misPromesas(exigirAuth(req)) });
  } catch (error) {
    next(error);
  }
};

export const obtener: RequestHandler = async (req, res, next) => {
  try {
    res.json(await servicio.obtener(req.params.promesaId, exigirAuth(req)));
  } catch (error) {
    next(error);
  }
};

export const proponer: RequestHandler = async (req, res, next) => {
  try {
    const clausula = await servicio.proponerClausula(
      req.params.promesaId,
      exigirAuth(req),
      req.params.codigo,
      req.body.texto,
      req.body.comentario,
    );
    res.json({ clausula });
  } catch (error) {
    next(error);
  }
};

export const aceptar: RequestHandler = async (req, res, next) => {
  try {
    const clausula = await servicio.aceptarClausula(req.params.clausulaId, exigirAuth(req));
    res.json({ clausula });
  } catch (error) {
    next(error);
  }
};

export const quitar: RequestHandler = async (req, res, next) => {
  try {
    await servicio.quitarClausula(req.params.clausulaId, exigirAuth(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const acordar: RequestHandler = async (req, res, next) => {
  try {
    const promesa = await servicio.acordar(req.params.promesaId, exigirAuth(req));
    res.json({ promesa });
  } catch (error) {
    next(error);
  }
};

export const reabrir: RequestHandler = async (req, res, next) => {
  try {
    const promesa = await servicio.reabrir(req.params.promesaId, exigirAuth(req));
    res.json({ promesa });
  } catch (error) {
    next(error);
  }
};

export const desistir: RequestHandler = async (req, res, next) => {
  try {
    const promesa = await servicio.desistir(
      req.params.promesaId,
      exigirAuth(req),
      req.body.motivo,
    );
    res.json({ promesa });
  } catch (error) {
    next(error);
  }
};

export const revisar: RequestHandler = async (req, res, next) => {
  try {
    const promesa = await servicio.revisar(req.params.promesaId, exigirAuth(req));
    res.json({ promesa });
  } catch (error) {
    next(error);
  }
};
