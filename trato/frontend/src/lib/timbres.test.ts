import { describe, expect, it } from 'vitest';
import { calcularTimbres, TASA_TIMBRES_MENSUAL, TASA_TIMBRES_TOPE } from './timbres';

describe('calcularTimbres', () => {
  it('aplica la tasa mensual sin tope en un crédito corto', () => {
    const { tasa, montoClp } = calcularTimbres(10_000_000, 1);
    expect(tasa).toBeCloseTo(TASA_TIMBRES_MENSUAL);
    expect(montoClp).toBe(Math.round(10_000_000 * TASA_TIMBRES_MENSUAL));
  });

  it('llega al tope de 0,8% en un crédito hipotecario típico a 240 meses', () => {
    const { tasa, montoClp } = calcularTimbres(90_000_000, 240);
    expect(tasa).toBeCloseTo(TASA_TIMBRES_TOPE);
    expect(montoClp).toBe(720_000);
  });

  it('un crédito a 12 meses todavía no llega al tope', () => {
    const { tasa } = calcularTimbres(10_000_000, 12);
    expect(tasa).toBeCloseTo(12 * TASA_TIMBRES_MENSUAL);
    expect(tasa).toBeLessThan(TASA_TIMBRES_TOPE);
  });

  it('redondea los meses hacia arriba y nunca usa menos de 1 mes', () => {
    const conFraccion = calcularTimbres(10_000_000, 1.2);
    const sinFraccion = calcularTimbres(10_000_000, 2);
    expect(conFraccion.tasa).toBeCloseTo(sinFraccion.tasa);

    const menosDeUnMes = calcularTimbres(10_000_000, 0.2);
    expect(menosDeUnMes.tasa).toBeCloseTo(TASA_TIMBRES_MENSUAL);
  });
});
