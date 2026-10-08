/**
 * Impuesto de timbres y estampillas (DL 3.475) sobre un crédito hipotecario.
 *
 * Para documentos con fecha de vencimiento -- cualquier mutuo hipotecario a
 * más de un mes, que es todos -- la tasa es 0,066% del monto por cada mes o
 * fracción entre el otorgamiento y el vencimiento, con un tope de 0,8%. Un
 * crédito a 20 o 30 años llega al tope igual que uno a 12 meses: por eso en
 * la práctica casi todo crédito hipotecario paga el tope de 0,8% plano.
 *
 * ADVERTENCIA: el monto del crédito no está en ninguna parte del sistema --
 * nace cuando el banco aprueba, y la promesa lo guarda como texto libre
 * dentro de la cláusula "condición de crédito" (`{monto}`), no como un campo
 * estructurado. Por eso esta función no intenta leerlo de ahí: recibe el
 * monto como parámetro, para cuando quien prepara la escritura ya lo sepa.
 *
 * Es aritmética fija por ley, no un dato que dependa del servidor, así que
 * corre igual en el backend (minuta de la escritura) y en el frontend
 * (calculadora en la UI, sin ida y vuelta al servidor).
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
