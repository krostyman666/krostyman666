import type { RequestHandler } from 'express';
import * as integraciones from '../services/integraciones.service';
import { enviarAvisosVencimiento } from '../services/avisos-vencimiento.service';

export const propiedadesPendientes: RequestHandler = async (req, res, next) => {
  try {
    const tipo = req.query.tipo === 'contribuciones' ? 'contribuciones' : 'avaluo_fiscal';
    const propiedades = await integraciones.propiedadesPendientes(tipo);
    res.json({ propiedades });
  } catch (error) {
    next(error);
  }
};

export const guardarAvaluoFiscal: RequestHandler = async (req, res, next) => {
  try {
    const propiedad = await integraciones.guardarAvaluoFiscal(req.params.id, req.body);
    res.json({ propiedad: { id: propiedad.id, avaluoFiscalCache: propiedad.avaluoFiscalCache } });
  } catch (error) {
    next(error);
  }
};

export const guardarContribuciones: RequestHandler = async (req, res, next) => {
  try {
    const propiedad = await integraciones.guardarContribuciones(req.params.id, req.body);
    res.json({ propiedad: { id: propiedad.id, contribucionesCache: propiedad.contribucionesCache } });
  } catch (error) {
    next(error);
  }
};

/**
 * A diferencia del avalúo y las contribuciones, esto no depende de ningún
 * portal externo: es correr la misma lógica que `/avisos-vencimiento`
 * (JWT, admin/asesor), pero pensada para un Schedule Trigger de n8n -- no
 * hace falta navegador ni scraping, un POST diario alcanza.
 */
export const avisosVencimiento: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await enviarAvisosVencimiento());
  } catch (error) {
    next(error);
  }
};
