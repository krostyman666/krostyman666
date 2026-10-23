import { esIdDeRutaValido } from './validarIdRuta';

describe('esIdDeRutaValido', () => {
  // UUID real, tomado de una fila existente en la base de desarrollo --
  // mismo criterio que el resto del proyecto: ningún valor de prueba se
  // inventa cuando se puede confirmar contra algo real.
  it('acepta un UUID real', () => {
    expect(esIdDeRutaValido('660b0463-e2ae-45c0-ba71-ea6f5c987ad9')).toBe(true);
  });

  it('acepta mayúsculas, que Postgres también acepta', () => {
    expect(esIdDeRutaValido('660B0463-E2AE-45C0-BA71-EA6F5C987AD9')).toBe(true);
  });

  it('rechaza "undefined", el bug de cliente que motivó este chequeo', () => {
    expect(esIdDeRutaValido('undefined')).toBe(false);
  });

  it('rechaza vacío, un número, o un UUID con la forma rota', () => {
    expect(esIdDeRutaValido('')).toBe(false);
    expect(esIdDeRutaValido('123')).toBe(false);
    expect(esIdDeRutaValido('660b0463-e2ae-45c0-ba71')).toBe(false);
    expect(esIdDeRutaValido('660b0463-e2ae-45c0-ba71-ea6f5c987ad9-extra')).toBe(false);
  });
});
