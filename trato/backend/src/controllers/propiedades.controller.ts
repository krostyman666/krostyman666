import type { RequestHandler } from 'express';
import * as servicio from '../services/propiedades.service';
import * as documentos from '../services/documentos.service';
import { ErrorApi } from '../utils/ErrorApi';
import type { Moneda, TipoPropiedad } from '../models/Propiedad';

function exigirAuth(req: Parameters<RequestHandler>[0]): string {
  if (!req.auth) throw ErrorApi.noAutorizado();
  return req.auth.sub;
}

export const crear: RequestHandler = async (req, res, next) => {
  try {
    const propiedad = await servicio.crear(exigirAuth(req), req.body);
    res.status(201).json({ propiedad });
  } catch (error) {
    next(error);
  }
};

export const buscar: RequestHandler = async (req, res, next) => {
  try {
    const q = req.query;
    const resultado = await servicio.buscar({
      comuna: q.comuna as string | undefined,
      tipo: q.tipo as TipoPropiedad | undefined,
      moneda: q.moneda as Moneda | undefined,
      precioMin: q.precioMin ? Number(q.precioMin) : undefined,
      precioMax: q.precioMax ? Number(q.precioMax) : undefined,
      dormitoriosMin: q.dormitoriosMin ? Number(q.dormitoriosMin) : undefined,
      pagina: q.pagina ? Number(q.pagina) : undefined,
      porPagina: q.porPagina ? Number(q.porPagina) : undefined,
    });
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

export const mias: RequestHandler = async (req, res, next) => {
  try {
    const propiedades = await servicio.listarDeVendedor(exigirAuth(req));
    res.json({ propiedades });
  } catch (error) {
    next(error);
  }
};

export const obtener: RequestHandler = async (req, res, next) => {
  try {
    const propiedad = await servicio.obtenerPublica(req.params.id);
    res.json({ propiedad });
  } catch (error) {
    next(error);
  }
};

export const actualizar: RequestHandler = async (req, res, next) => {
  try {
    const propiedad = await servicio.actualizar(req.params.id, exigirAuth(req), req.body);
    res.json({ propiedad });
  } catch (error) {
    next(error);
  }
};

export const cambiarEstado: RequestHandler = async (req, res, next) => {
  try {
    const propiedad = await servicio.cambiarEstado(
      req.params.id,
      exigirAuth(req),
      req.body.estado,
    );
    res.json({ propiedad });
  } catch (error) {
    next(error);
  }
};

export const informe: RequestHandler = async (req, res, next) => {
  try {
    await servicio.exigirAccesoAlExpediente(req.params.id, exigirAuth(req));
    res.json(await documentos.informeDePropiedad(req.params.id));
  } catch (error) {
    next(error);
  }
};

export const actualizarDocumento: RequestHandler = async (req, res, next) => {
  try {
    const documento = await documentos.actualizarDocumento(
      req.params.documentoId,
      exigirAuth(req),
      req.body,
    );
    res.json({ documento: documento.toJSON() });
  } catch (error) {
    next(error);
  }
};

export const catalogo: RequestHandler = (_req, res) => {
  res.json({ documentos: documentos.catalogoPublico() });
};
