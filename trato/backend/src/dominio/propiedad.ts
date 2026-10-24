import type { Moneda } from '../models/Propiedad';

/**
 * Trato apunta al segmento de alto valor del mercado: con 1% de comisión, una
 * propiedad bajo ~UF 1.500 ya pierde plata (ver "Rentabilidad" en CLAUDE.md,
 * `dominio/economia.ts`). El piso de publicación se puso más arriba que ese
 * punto de equilibrio a propósito -- es una decisión de posicionamiento
 * comercial, no sólo el límite donde el negocio deja de perder dinero.
 */
export const PRECIO_MINIMO_PUBLICACION_UF = 5000;

/**
 * El precio se guarda en la moneda que eligió el vendedor (`uf` o `clp`), así
 * que compararlo contra el mínimo -- que está en UF -- necesita el valor del
 * día si viene en pesos. Recibe la UF ya resuelta (`obtenerUf()`, en el
 * servicio) en vez de pedirla acá: esta función es puro cálculo, sin I/O, así
 * se puede probar sin levantar nada.
 */
export function precioEnUf(precio: number, moneda: Moneda, valorUfEnClp: number): number {
  return moneda === 'uf' ? precio : precio / valorUfEnClp;
}

export function cumpleMinimoDePublicacion(
  precio: number,
  moneda: Moneda,
  valorUfEnClp: number,
): boolean {
  return precioEnUf(precio, moneda, valorUfEnClp) >= PRECIO_MINIMO_PUBLICACION_UF;
}
