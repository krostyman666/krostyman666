import { cumpleMinimoDePublicacion, precioEnUf, PRECIO_MINIMO_PUBLICACION_UF } from './propiedad';

// UF real del 23-10-2026, consultada a mindicador.cl al escribir este test --
// mismo criterio que el resto del proyecto: ningún valor de prueba se inventa.
const UF_DEL_DIA_CLP = 41205.16;

describe('cumpleMinimoDePublicacion', () => {
  it('en UF, compara directo contra el mínimo', () => {
    expect(cumpleMinimoDePublicacion(PRECIO_MINIMO_PUBLICACION_UF, 'uf', UF_DEL_DIA_CLP)).toBe(true);
    expect(cumpleMinimoDePublicacion(4999, 'uf', UF_DEL_DIA_CLP)).toBe(false);
    expect(cumpleMinimoDePublicacion(8400, 'uf', UF_DEL_DIA_CLP)).toBe(true);
  });

  it('en CLP, convierte con la UF del día antes de comparar', () => {
    const justoEnElMinimoClp = PRECIO_MINIMO_PUBLICACION_UF * UF_DEL_DIA_CLP;
    expect(cumpleMinimoDePublicacion(justoEnElMinimoClp, 'clp', UF_DEL_DIA_CLP)).toBe(true);
    expect(cumpleMinimoDePublicacion(justoEnElMinimoClp - 1000, 'clp', UF_DEL_DIA_CLP)).toBe(false);
  });

  it('una propiedad de UF 1.500 (el punto de equilibrio de economia.ts) sigue bajo el mínimo de publicación', () => {
    expect(cumpleMinimoDePublicacion(1500, 'uf', UF_DEL_DIA_CLP)).toBe(false);
  });
});

describe('precioEnUf', () => {
  it('en UF, devuelve el mismo número', () => {
    expect(precioEnUf(5000, 'uf', UF_DEL_DIA_CLP)).toBe(5000);
  });

  it('en CLP, divide por la UF del día', () => {
    expect(precioEnUf(UF_DEL_DIA_CLP * 2, 'clp', UF_DEL_DIA_CLP)).toBeCloseTo(2, 6);
  });
});
