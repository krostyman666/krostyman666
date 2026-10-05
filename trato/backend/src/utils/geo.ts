/**
 * Redondea a 3 decimales (~110 m) para no publicar el punto exacto de una
 * propiedad a quien no tiene acceso al expediente. Ver "La ficha pública y el
 * límite con el expediente" en CLAUDE.md: la dirección exacta tampoco va en
 * la ficha pública, y mandar la coordenada exacta en el JSON y sólo dibujar
 * un círculo en el cliente no cumple esa regla -- cualquiera que abra las
 * herramientas de desarrollo ve el punto real. El redondeo deja ver el sector
 * sin regalar la ubicación exacta.
 */
export function redondearSector(valor: number | string | null): number | null {
  if (valor === null) return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 1000) / 1000;
}
