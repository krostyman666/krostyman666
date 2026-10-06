/**
 * Notificación de vulneraciones de seguridad (Ley 21.719, art. 14 sexies).
 *
 * La ley define "vulneración de seguridad" en términos amplios: destrucción,
 * filtración, pérdida o alteración accidental o ilícita de datos personales,
 * o su comunicación o acceso por quien no está autorizado -- no exige que
 * haya habido intención maliciosa. Dos obligaciones separadas nacen de ahí:
 *
 * - Notificar a la Agencia de Protección de Datos Personales "sin demora
 *   indebida". La ley no fija un número de horas en su propio texto, pero la
 *   referencia operativa que usan los comentaristas (alineada al RGPD, que sí
 *   fija el plazo) es 72 horas desde que el equipo toma conocimiento del
 *   incidente -- no desde que ocurrió, que puede ser antes y no saberse.
 * - Notificar también a los titulares afectados, pero sólo si la
 *   vulneración implica un riesgo alto para sus derechos. No todo incidente
 *   lo activa: filtrar el nombre de alguien no es lo mismo que filtrar su
 *   historial de deudas.
 *
 * ADVERTENCIA: qué categorías cuentan como "riesgo alto" es una calificación
 * legal, no técnica. `CATEGORIAS_ALTO_RIESGO` es un punto de partida razonable
 * mientras no se confirme con abogado -- mismo criterio que ya se usa para los
 * plazos de conservación en `dominio/datos-personales.ts`.
 */

export const HORAS_PLAZO_AGENCIA = 72;

/**
 * Categorías del registro de tratamiento (`dominio/datos-personales.ts`) cuya
 * exposición casi siempre implica riesgo alto para el titular: identidad
 * (`rut`), acceso a la cuenta (`credenciales`) o antecedentes legales y
 * financieros (`expediente`, `informes`). El resto -- nombre y contacto,
 * dirección de una propiedad ya publicada, el hecho de haber agendado una
 * visita, o que exista un consentimiento -- pesa menos por sí solo.
 */
export const CATEGORIAS_ALTO_RIESGO = ['rut', 'credenciales', 'expediente', 'informes'] as const;

export function requiereNotificarTitulares(categoriasAfectadas: string[]): boolean {
  return categoriasAfectadas.some((c) => (CATEGORIAS_ALTO_RIESGO as readonly string[]).includes(c));
}

export function venceEl(detectadoEn: Date): Date {
  return new Date(detectadoEn.getTime() + HORAS_PLAZO_AGENCIA * 60 * 60 * 1000);
}

export function plazoAgenciaVencido(detectadoEn: Date, notificadaAgenciaEn: Date | null, ahora = new Date()): boolean {
  if (notificadaAgenciaEn) return false;
  return ahora > venceEl(detectadoEn);
}

/**
 * Qué falta para poder cerrar el incidente. `null` significa que ya se puede.
 * Notificar a la Agencia es siempre obligatorio; a los titulares, sólo si la
 * combinación de categorías lo exige.
 */
export function motivoParaNoCerrar(incidente: {
  categoriasAfectadas: string[];
  notificadaAgenciaEn: Date | null;
  notificadaTitularesEn: Date | null;
}): string | null {
  if (!incidente.notificadaAgenciaEn) {
    return 'Falta notificar a la Agencia de Protección de Datos Personales antes de cerrar el incidente.';
  }
  if (requiereNotificarTitulares(incidente.categoriasAfectadas) && !incidente.notificadaTitularesEn) {
    return 'Las categorías afectadas implican riesgo alto para los titulares: falta notificarles antes de cerrar.';
  }
  return null;
}
