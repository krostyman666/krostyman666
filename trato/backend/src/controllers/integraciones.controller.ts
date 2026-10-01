import type { RequestHandler } from 'express';
import * as integraciones from '../services/integraciones.service';

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
