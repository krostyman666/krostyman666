import type { RequestHandler } from 'express';
import * as servicio from '../services/pagos.service';
import { Informe } from '../models/Informe';
import { ErrorApi } from '../utils/ErrorApi';

function exigirAuth(req: Parameters<RequestHandler>[0]): string {
  if (!req.auth) throw ErrorApi.noAutorizado();
  return req.auth.sub;
}

/** Con qué se puede pagar este informe, y las instrucciones si es transferencia. */
export const medios: RequestHandler = async (req, res, next) => {
  try {
    const informe = await Informe.findByPk(req.params.informeId);
    if (!informe) throw ErrorApi.noEncontrado('Informe no encontrado');
    if (informe.compradorId !== exigirAuth(req)) {
      throw ErrorApi.prohibido('Este informe no es tuyo');
    }

    res.json({
      monto: informe.precioClp,
      medios: servicio.mediosDisponibles(informe.precioClp),
      transferencia: servicio.instruccionesTransferencia(),
      pagos: await servicio.deInforme(informe.id, informe.compradorId),
    });
  } catch (error) {
    next(error);
  }
};

export const iniciar: RequestHandler = async (req, res, next) => {
  try {
    const pago = await servicio.iniciar(
      req.params.informeId,
      exigirAuth(req),
      req.body.medio,
    );
    res.status(201).json({ pago, transferencia: servicio.instruccionesTransferencia() });
  } catch (error) {
    next(error);
  }
};

/**
 * Lo que llama Flow al terminar el pago, con sólo el token en el cuerpo
 * (`application/x-www-form-urlencoded`). Siempre responde "OK" en texto
 * plano -- es lo que Flow espera para no reintentar la notificación -- aun
 * si el token no corresponde a nada: eso ya lo decide `confirmarFlow`, no
 * esta respuesta.
 */
export const confirmacionFlow: RequestHandler = async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : null;
  if (token) {
    try {
      await servicio.confirmarFlow(token);
    } catch {
      // Un fallo acá no puede dejar a Flow reintentando para siempre un
      // token que de todas formas no se va a poder procesar distinto la
      // próxima vez; queda para revisar a mano en los logs.
    }
  }
  res.status(200).send('OK');
};

export const reportar: RequestHandler = async (req, res, next) => {
  try {
    const pago = await servicio.reportar(req.params.pagoId, exigirAuth(req), req.body.nota);
    res.json({ pago });
  } catch (error) {
    next(error);
  }
};

export const porConciliar: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ pagos: await servicio.porConciliar() });
  } catch (error) {
    next(error);
  }
};

export const conciliar: RequestHandler = async (req, res, next) => {
  try {
    const pago = await servicio.conciliar(req.params.pagoId, exigirAuth(req), req.body.nota);
    res.json({ pago });
  } catch (error) {
    next(error);
  }
};

export const anular: RequestHandler = async (req, res, next) => {
  try {
    const pago = await servicio.anular(req.params.pagoId, exigirAuth(req), req.body.motivo);
    res.json({ pago });
  } catch (error) {
    next(error);
  }
};
