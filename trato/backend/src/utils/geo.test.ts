import { redondearSector } from './geo';

describe('redondearSector', () => {
  it('redondea a 3 decimales', () => {
    expect(redondearSector(-33.4569123)).toBe(-33.457);
    expect(redondearSector(-70.5980456)).toBe(-70.598);
  });

  it('acepta un valor que ya viene como string (como lo entrega Postgres)', () => {
    expect(redondearSector('-33.4569123')).toBe(-33.457);
  });

  it('devuelve null si el valor es null', () => {
    expect(redondearSector(null)).toBeNull();
  });

  it('devuelve null si el valor no es un número válido', () => {
    expect(redondearSector('no-es-un-numero')).toBeNull();
  });

  it('no esconde más precisión de la que ya tenía un valor con menos decimales', () => {
    expect(redondearSector(-33.45)).toBe(-33.45);
    expect(redondearSector(0)).toBe(0);
  });
});
