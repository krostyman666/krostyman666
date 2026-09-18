import type { RequestHandler } from 'express';
import * as servicio from '../services/informes.service';
import { ErrorApi } from '../utils/ErrorApi';
import { env } from '../config/env';
import {
  APORTES_TITULOS,
  LIMITES_ANTECEDENTES,
  PLAZO_TITULOS_HABILES,
  SECCIONES,
} from '../dominio/informe.catalogo';

function exigirAuth(req: Parameters<RequestHandler>[0]): string {
  if (!req.auth) throw ErrorApi.noAutorizado();
  return req.auth.sub;
}

/**
 * Qué trae cada nivel, con precio y plazo. Es público porque el comprador tiene
 * que poder ver qué compra antes de pagar, y porque los límites del nivel
 * gratis no pueden quedar detrás de un login.
 */
export const catalogo: RequestHandler = (_req, res) => {
  res.json({
    niveles: {
      antecedentes: {
        nombre: 'Antecedentes del inmueble',
        precioClp: 0,
        inmediato: true,
        secciones: SECCIONES.filter((s) => s.nivel === 'antecedentes').map((s) => ({
          codigo: s.codigo,
          titulo: s.titulo,
          queResponde: s.queResponde,
        })),
        limites: LIMITES_ANTECEDENTES,
      },
      titulos: {
        nombre: 'Carpeta de títulos',
        precioClp: env.precioInformeTitulosClp,
        inmediato: false,
        plazoHabiles: PLAZO_TITULOS_HABILES,
        secciones: SECCIONES.filter((s) => s.nivel === 'titulos').map((s) => ({
          codigo: s.codigo,
          titulo: s.titulo,
          queResponde: s.queResponde,
          condicional: s.condicional ?? null,
        })),
        aportes: APORTES_TITULOS,
      },
    },
  });
};

export const emitirAntecedentes: RequestHandler = async (req, res, next) => {
  try {
    const informe = await servicio.emitirAntecedentes(req.params.id, exigirAuth(req));
    res.status(201).json({ informe });
  } catch (error) {
    next(error);
  }
};

export const pedirTitulos: RequestHandler = async (req, res, next) => {
  try {
    const informe = await servicio.pedirTitulos(req.params.id, exigirAuth(req));
    res.status(201).json({ informe });
  } catch (error) {
    next(error);
  }
};

export const mios: RequestHandler = async (req, res, next) => {
  try {
    res.json({ informes: await servicio.informesDeComprador(exigirAuth(req)) });
  } catch (error) {
    next(error);
  }
};

export const obtener: RequestHandler = async (req, res, next) => {
  try {
    const informe = await servicio.obtenerParaComprador(
      req.params.informeId,
      exigirAuth(req),
    );
    res.json({ informe });
  } catch (error) {
    next(error);
  }
};

export const firmar: RequestHandler = async (req, res, next) => {
  try {
    const informe = await servicio.firmarTitulos(
      req.params.informeId,
      exigirAuth(req),
      req.body.conclusion,
      req.body.defectos ?? [],
    );
    res.json({ informe });
  } catch (error) {
    next(error);
  }
};

export const cambiarEstado: RequestHandler = async (req, res, next) => {
  try {
    const informe = await servicio.cambiarEstado(req.params.informeId, req.body.estado);
    res.json({ informe });
  } catch (error) {
    next(error);
  }
};

export const verConsentimiento: RequestHandler = async (req, res, next) => {
  try {
    const consentimiento = await servicio.consentimientoVigente(req.params.id);
    res.json({
      consentimiento,
      textoVigente: servicio.TEXTO_CONSENTIMIENTO,
      versionVigente: servicio.VERSION_CONSENTIMIENTO,
    });
  } catch (error) {
    next(error);
  }
};

export const otorgarConsentimiento: RequestHandler = async (req, res, next) => {
  try {
    const consentimiento = await servicio.otorgarConsentimiento(
      req.params.id,
      exigirAuth(req),
      req.ip,
    );
    res.json({ consentimiento });
  } catch (error) {
    next(error);
  }
};

export const revocarConsentimiento: RequestHandler = async (req, res, next) => {
  try {
    await servicio.revocarConsentimiento(req.params.id, exigirAuth(req));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
