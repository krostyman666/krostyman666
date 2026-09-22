import type { RequestHandler } from 'express';
import * as servicio from '../services/bot.service';
import { ErrorApi } from '../utils/ErrorApi';
import { SUGERIDAS } from '../dominio/bot.catalogo';

/**
 * Preguntas de arranque para que la caja no empiece vacía, y sesión pedida por
 * query para leer el hilo. Público: el bot contesta sin login, porque obligar a
 * registrarse para preguntar los metros espanta al comprador antes del embudo.
 */
export const sugeridas: RequestHandler = (_req, res) => {
  res.json({ sugeridas: SUGERIDAS });
};

export const preguntar: RequestHandler = async (req, res, next) => {
  try {
    const contestacion = await servicio.responder(
      req.params.id,
      req.body.pregunta,
      req.auth?.sub ?? null,
      req.body.sesion,
    );
    res.status(201).json(contestacion);
  } catch (error) {
    next(error);
  }
};

export const historial: RequestHandler = async (req, res, next) => {
  try {
    const sesion = typeof req.query.sesion === 'string' ? req.query.sesion : '';
    if (!sesion) {
      res.json({ mensajes: [] });
      return;
    }
    const mensajes = await servicio.historial(req.params.id, sesion);
    res.json({ mensajes });
  } catch (error) {
    next(error);
  }
};

export const pendientes: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await servicio.pendientes());
  } catch (error) {
    next(error);
  }
};

export const resumen: RequestHandler = async (req, res, next) => {
  try {
    const desde =
      typeof req.query.desde === 'string' ? new Date(req.query.desde) : undefined;
    if (desde && Number.isNaN(desde.getTime())) {
      throw ErrorApi.solicitudInvalida('Fecha inválida', 'fecha_invalida');
    }
    res.json(await servicio.resumen(desde));
  } catch (error) {
    next(error);
  }
};

export const atender: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) throw ErrorApi.noAutorizado();
    const mensaje = await servicio.atender(
      req.params.mensajeId,
      req.auth.sub,
      req.body.nota,
    );
    res.json({ mensaje });
  } catch (error) {
    next(error);
  }
};
