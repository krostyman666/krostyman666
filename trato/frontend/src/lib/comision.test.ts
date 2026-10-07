import { describe, expect, it } from 'vitest';
import { aPesos, calcularComision, formatearCLP, formatearUF, TASA_CORREDOR_HABITUAL, TASA_TRATO } from './comision';

describe('calcularComision', () => {
  it('calcula el desglose completo para un valor de propiedad típico', () => {
    const d = calcularComision(100_000_000);
    expect(d.valorPropiedad).toBe(100_000_000);
    expect(d.corredorNeto).toBe(2_000_000);
    expect(d.corredorIva).toBe(380_000);
    expect(d.corredorTotal).toBe(2_380_000);
    expect(d.tratoNeto).toBe(1_000_000);
    expect(d.tratoIva).toBe(190_000);
    expect(d.tratoTotal).toBe(1_190_000);
    expect(d.ahorro).toBe(1_190_000);
  });

  it('el ahorro es 50% cuando Trato cobra la mitad que el corredor habitual', () => {
    const d = calcularComision(100_000_000, TASA_CORREDOR_HABITUAL, TASA_TRATO);
    expect(d.ahorroPorcentaje).toBeCloseTo(0.5);
  });

  it('respeta tasas de corredor y de Trato personalizadas', () => {
    const d = calcularComision(100_000_000, 0.03, 0.01);
    expect(d.corredorNeto).toBe(3_000_000);
    expect(d.ahorroPorcentaje).toBeCloseTo(2 / 3);
  });

  it('trata un valor inválido o no positivo como cero, sin lanzar', () => {
    expect(calcularComision(0).valorPropiedad).toBe(0);
    expect(calcularComision(-100).valorPropiedad).toBe(0);
    expect(calcularComision(NaN).valorPropiedad).toBe(0);
    const d = calcularComision(0);
    expect(d.corredorTotal).toBe(0);
    expect(d.tratoTotal).toBe(0);
    expect(d.ahorro).toBe(0);
    expect(d.ahorroPorcentaje).toBe(0);
  });
});

describe('formatearCLP', () => {
  it('formatea como pesos chilenos redondeados, sin decimales', () => {
    expect(formatearCLP(2_380_000)).toBe('$2.380.000');
    expect(formatearCLP(0)).toBe('$0');
  });
});

describe('formatearUF', () => {
  it('formatea con el prefijo UF y redondeado', () => {
    expect(formatearUF(8400)).toBe('UF 8.400');
    expect(formatearUF(1234.6)).toBe('UF 1.235');
  });
});

describe('aPesos', () => {
  it('convierte UF a pesos usando el valor de la UF dado', () => {
    expect(aPesos(100, 'uf', 39_000)).toBe(3_900_000);
  });

  it('deja un monto en pesos intacto', () => {
    expect(aPesos(3_900_000, 'clp', 39_000)).toBe(3_900_000);
  });
});
