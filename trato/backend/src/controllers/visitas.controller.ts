import type { RequestHandler } from 'express';
import * as servicio from '../services/visitas.service';
import { ErrorApi } from '../utils/ErrorApi';
import { diaIsoChileno } from '../utils/tiempo';

function exigirAuth(req: Parameters<RequestHandler>[0]): string {
  if (!req.auth) throw ErrorApi.noAutorizado();
  return req.auth.sub;
}

export const cupos: RequestHandler = async (req, res, next) => {
  try {
    res.json({ dias: await servicio.cuposDisponibles(req.params.id) });
  } catch (error) {
    next(error);
  }
};

export const disponibilidad: RequestHandler = async (req, res, next) => {
  try {
    res.json({ bloques: await servicio.disponibilidadDe(req.params.id) });
  } catch (error) {
    next(error);
  }
};

export const declararDisponibilidad: RequestHandler = async (req, res, next) => {
  try {
    const bloques = await servicio.declararDisponibilidad(
      req.params.id,
      exigirAuth(req),
      req.body.bloques,
    );
    res.json({ bloques });
  } catch (error) {
    next(error);
  }
};

export const solicitar: RequestHandler = async (req, res, next) => {
  try {
    const visita = await servicio.solicitar(
      req.params.id,
      exigirAuth(req),
      req.body.inicio,
      req.body.mensaje,
    );
    res.status(201).json({ visita });
  } catch (error) {
    next(error);
  }
};

export const mias: RequestHandler = async (req, res, next) => {
  try {
    res.json({ visitas: await servicio.visitasDeComprador(exigirAuth(req)) });
  } catch (error) {
    next(error);
  }
};

export const dePropiedad: RequestHandler = async (req, res, next) => {
  try {
    const visitas = await servicio.visitasDePropiedad(req.params.id, exigirAuth(req));
    res.json({ visitas });
  } catch (error) {
    next(error);
  }
};

export const agenda: RequestHandler = async (req, res, next) => {
  try {
    const dia = (req.query.dia as string | undefined) ?? diaIsoChileno(new Date());
    res.json(await servicio.agendaDeAsesor(exigirAuth(req), dia));
  } catch (error) {
    next(error);
  }
};

export const porAsignar: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ grupos: await servicio.porAsignar() });
  } catch (error) {
    next(error);
  }
};

export const asignar: RequestHandler = async (req, res, next) => {
  try {
    const visita = await servicio.asignarAsesor(req.params.visitaId, req.body.asesorId);
    res.json({ visita });
  } catch (error) {
    next(error);
  }
};

export const cancelar: RequestHandler = async (req, res, next) => {
  try {
    const visita = await servicio.cancelar(
      req.params.visitaId,
      exigirAuth(req),
      req.body.motivo,
    );
    res.json({ visita });
  } catch (error) {
    next(error);
  }
};

export const resultado: RequestHandler = async (req, res, next) => {
  try {
    const visita = await servicio.marcarResultado(
      req.params.visitaId,
      exigirAuth(req),
      req.body.estado,
      req.body.motivo,
    );
    res.json({ visita });
  } catch (error) {
    next(error);
  }
};
