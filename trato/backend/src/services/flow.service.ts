import crypto from 'crypto';
import { env } from '../config/env';
import { ErrorApi } from '../utils/ErrorApi';

/**
 * Integración con Flow (ver `dominio/pagos.ts` para por qué Flow y no Stripe).
 *
 * Flow no usa JWT ni API keys en el header: cada request lleva `apiKey` como
 * parámetro y una firma `s` que es el HMAC-SHA256 (hex) de todos los demás
 * parámetros, ordenados alfabéticamente por nombre y concatenados como
 * `clave1valor1clave2valor2...`, usando `secretKey` como llave del HMAC. Sin
 * esto Flow rechaza la llamada aunque los datos sean correctos -- la firma es
 * la autenticación.
 *
 * NINGUNA llamada de este archivo se puede probar contra el servicio real sin
 * una cuenta de comercio en Flow (sandbox.flow.cl): eso es un registro de
 * empresa, con RUT y verificación, no algo que se cree por API. El código
 * respeta la documentación pública de Flow al dedillo; falta la cuenta real
 * para confirmarlo en vivo. Mientras `apiKey`/`secretKey` estén vacíos,
 * `estaConfigurado()` da `false` y nadie llama a estas funciones (ver
 * `pagos.service.ts`).
 */

export function estaConfigurado(): boolean {
  return Boolean(env.flow.apiKey && env.flow.secretKey);
}

/**
 * Firma cualquier conjunto de parámetros de Flow. Pública porque
 * `getStatus` también la necesita, con un conjunto de parámetros distinto al
 * de `create`.
 */
export function firmar(parametros: Record<string, string | number>): string {
  const ordenados = Object.keys(parametros).sort();
  const concatenado = ordenados.map((clave) => `${clave}${parametros[clave]}`).join('');
  return crypto.createHmac('sha256', env.flow.secretKey).update(concatenado).digest('hex');
}

export interface OrdenPagoFlow {
  url: string;
  token: string;
  flowOrder: number;
}

/**
 * Crea la orden de pago y devuelve la URL a la que hay que mandar al
 * comprador (`${url}?token=${token}`). `commerceOrder` es nuestro propio id
 * (el id del `Pago`): Flow exige que sea único, así que reusar un
 * `commerceOrder` para una segunda orden del mismo pago fallaría -- por eso
 * `pagos.service.ts` sólo llama esto una vez por `Pago` y guarda la URL.
 */
export async function crearOrdenPago(datos: {
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
}): Promise<OrdenPagoFlow> {
  const parametros = {
    apiKey: env.flow.apiKey,
    commerceOrder: datos.commerceOrder,
    subject: datos.subject,
    currency: 'CLP',
    amount: datos.amount,
    email: datos.email,
    urlConfirmation: datos.urlConfirmation,
    urlReturn: datos.urlReturn,
  };

  const cuerpo = new URLSearchParams({
    ...Object.fromEntries(Object.entries(parametros).map(([k, v]) => [k, String(v)])),
    s: firmar(parametros),
  });

  const respuesta = await fetch(`${env.flow.baseUrl}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: cuerpo,
  });

  const json = (await respuesta.json()) as
    | OrdenPagoFlow
    | { code: number; message: string };

  if (!respuesta.ok || 'code' in json) {
    const detalle = 'message' in json ? json.message : `HTTP ${respuesta.status}`;
    throw ErrorApi.conflicto(`Flow rechazó la orden de pago: ${detalle}`, 'flow_rechazo');
  }

  return json;
}

export const ESTADOS_FLOW = {
  PENDIENTE: 1,
  PAGADA: 2,
  RECHAZADA: 3,
  ANULADA: 4,
} as const;

export interface EstadoPagoFlow {
  flowOrder: number;
  commerceOrder: string;
  status: number;
  amount: number;
}

/**
 * Consulta el estado real de la orden. Nunca hay que confiar sólo en que
 * Flow llamó a `urlConfirmation`: cualquiera podría llamar a ese endpoint
 * con un token inventado, así que lo que de verdad confirma el pago es esta
 * consulta -- mismo principio que "no confiar en que el agente clasifique el
 * estado" ya aplicado al workflow de Tesorería.
 */
export async function consultarEstado(token: string): Promise<EstadoPagoFlow> {
  const parametros = { apiKey: env.flow.apiKey, token };
  const query = new URLSearchParams({
    ...parametros,
    s: firmar(parametros),
  });

  const respuesta = await fetch(`${env.flow.baseUrl}/payment/getStatus?${query}`);
  const json = (await respuesta.json()) as EstadoPagoFlow | { code: number; message: string };

  if (!respuesta.ok || 'code' in json) {
    const detalle = 'message' in json ? json.message : `HTTP ${respuesta.status}`;
    throw ErrorApi.conflicto(`Flow rechazó la consulta de estado: ${detalle}`, 'flow_rechazo');
  }

  return json;
}
