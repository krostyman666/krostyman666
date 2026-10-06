/**
 * Impuesto de timbres y estampillas (DL 3.475) sobre un crédito hipotecario.
 * Misma fórmula que `backend/src/dominio/minuta.ts#calcularTimbres`, duplicada
 * acá por la misma razón que `rut.ts`: es aritmética fija por ley, no un dato
 * que dependa del servidor, así que la calculadora corre en el cliente sin
 * ida y vuelta. 0,066% del monto por cada mes o fracción hasta el
 * vencimiento, con tope de 0,8% -- que en la práctica es lo que paga
 * cualquier crédito hipotecario, porque ninguno dura menos de 12 meses.
 */
export const TASA_TIMBRES_MENSUAL = 0.00066;
export const TASA_TIMBRES_TOPE = 0.008;

export function calcularTimbres(
  montoCreditoClp: number,
  mesesPlazo: number,
): { tasa: number; montoClp: number } {
  const meses = Math.max(1, Math.ceil(mesesPlazo));
  const tasa = Math.min(meses * TASA_TIMBRES_MENSUAL, TASA_TIMBRES_TOPE);
  return { tasa, montoClp: Math.round(montoCreditoClp * tasa) };
}
