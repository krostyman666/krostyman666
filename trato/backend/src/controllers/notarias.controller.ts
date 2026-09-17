import type { RequestHandler } from 'express';
import * as servicio from '../services/notarias.service';
import { ErrorApi } from '../utils/ErrorApi';

function exigirAuth(req: Parameters<RequestHandler>[0]): string {
  if (!req.auth) throw ErrorApi.noAutorizado();
  return req.auth.sub;
}

export const listarSocios: RequestHandler = async (req, res, next) => {
  try {
    const socios = await servicio.listarSocios(
      req.query.tipo as 'notaria' | 'conservador' | undefined,
      req.query.comuna as string | undefined,
    );
    res.json({ socios });
  } catch (error) {
    next(error);
  }
};

export const asignarNotaria: RequestHandler = async (req, res, next) => {
  try {
    const propiedad = await servicio.asignarNotaria(
      req.params.id,
      exigirAuth(req),
      req.body.notariaId,
    );
    res.json({ propiedad });
  } catch (error) {
    next(error);
  }
};

export const bandeja: RequestHandler = async (req, res, next) => {
  try {
    res.json({ casos: await servicio.bandeja(exigirAuth(req)) });
  } catch (error) {
    next(error);
  }
};

export const validarDocumento: RequestHandler = async (req, res, next) => {
  try {
    const documento = await servicio.validarDocumento(
      req.params.documentoId,
      exigirAuth(req),
      req.body.validacion,
      req.body.observacionNotaria,
    );
    res.json({ documento: documento.toJSON() });
  } catch (error) {
    next(error);
  }
};

export const listoParaEscriturar: RequestHandler = async (req, res, next) => {
  try {
    res.json(await servicio.listoParaEscriturar(req.params.id));
  } catch (error) {
    next(error);
  }
};
