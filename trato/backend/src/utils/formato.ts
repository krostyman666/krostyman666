/**
 * Formato de montos para texto que se le muestra al usuario.
 *
 * Casi todo el formato vive en el frontend, que es donde corresponde. Esto
 * existe porque el bot arma frases en el backend: "UF 8400" en vez de
 * "UF 8.400" en medio de una respuesta se lee como un error del sistema, y un
 * comprador que duda del formato duda del dato.
 */

export type MonedaMonto = 'clp' | 'uf';

const PESOS = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const UNIDADES = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

/** Con dos decimales cuando el monto no es redondo: la comisión de 1% sobre
 * UF 8.400 es UF 84, pero sobre UF 3.750 es UF 37,5 y truncarla sería cobrar
 * distinto de lo que dice el texto. */
const UNIDADES_CON_DECIMALES = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export function formatearMonto(monto: number, moneda: MonedaMonto): string {
  if (moneda === 'clp') return PESOS.format(Math.round(monto));
  const redondo = Math.abs(monto - Math.round(monto)) < 0.005;
  return `UF ${redondo ? UNIDADES.format(Math.round(monto)) : UNIDADES_CON_DECIMALES.format(monto)}`;
}
