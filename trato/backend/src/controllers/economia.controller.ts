import type { RequestHandler } from 'express';
import {
  ALZA_PREVISIONAL_PENDIENTE,
  FUENTES_SUPUESTOS,
  SIN_FUENTE,
  SUPUESTOS_POR_DEFECTO,
  capacidadMensual,
  margenDeOperacion,
  precioInformeQueCubreCosto,
  type Supuestos,
} from '../dominio/economia';
import { env } from '../config/env';

export const modelo: RequestHandler = (req, res) => {
  const supuestos: Supuestos = {
    ...SUPUESTOS_POR_DEFECTO,
    precioInformeTitulos: env.precioInformeTitulosClp,
    ...(req.body?.supuestos ?? {}),
  };

  const precioUf = Number(req.body?.precioVentaUf ?? 8_400);
  const precioVentaClp = precioUf * supuestos.ufEnPesos;

  const asesores = Number(req.body?.asesores ?? 1);
  const abogados = Number(req.body?.abogados ?? 1);

  res.json({
    supuestos,
    sinFuente: SIN_FUENTE,
    fuentes: FUENTES_SUPUESTOS,
    alzaPrevisional: ALZA_PREVISIONAL_PENDIENTE,
    precioVentaUf: precioUf,
    operacion: margenDeOperacion(precioVentaClp, supuestos),
    informe: precioInformeQueCubreCosto(supuestos),
    capacidad: capacidadMensual(asesores, abogados, supuestos),
    equipo: { asesores, abogados },
  });
};
