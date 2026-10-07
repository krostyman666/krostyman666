import { calcularDigitoVerificador, esRutValido, formatearRut, limpiarRut } from './rut';

describe('limpiarRut', () => {
  it('saca puntos, guion y espacios, y deja el dígito en mayúscula', () => {
    expect(limpiarRut('12.345.678-5')).toBe('123456785');
    expect(limpiarRut(' 7.958.113-5 ')).toBe('79581135');
    expect(limpiarRut('12345678-k')).toBe('12345678K');
  });
});

describe('calcularDigitoVerificador', () => {
  it('calcula el dígito verificador módulo 11 de RUTs conocidos', () => {
    expect(calcularDigitoVerificador('12345678')).toBe('5');
    expect(calcularDigitoVerificador('11111111')).toBe('1');
    expect(calcularDigitoVerificador('7958113')).toBe('5');
    expect(calcularDigitoVerificador('9876543')).toBe('3');
  });

  it('da "K" cuando el resto es 10', () => {
    expect(calcularDigitoVerificador('1000005')).toBe('K');
  });

  it('da "0" cuando el resto es 11 (suma múltiplo exacto de 11)', () => {
    expect(calcularDigitoVerificador('1000013')).toBe('0');
  });
});

describe('esRutValido', () => {
  it('acepta RUTs válidos con y sin formato', () => {
    expect(esRutValido('12345678-5')).toBe(true);
    expect(esRutValido('12.345.678-5')).toBe(true);
    expect(esRutValido('123456785')).toBe(true);
    expect(esRutValido('1000005-K')).toBe(true);
    expect(esRutValido('1000005-k')).toBe(true);
  });

  it('rechaza un dígito verificador incorrecto', () => {
    expect(esRutValido('12345678-9')).toBe(false);
    expect(esRutValido('12345678-K')).toBe(false);
  });

  it('rechaza formatos que no son un RUT', () => {
    expect(esRutValido('')).toBe(false);
    expect(esRutValido('abcdefgh-5')).toBe(false);
    expect(esRutValido('123-5')).toBe(false); // cuerpo muy corto
    expect(esRutValido('123456789012-5')).toBe(false); // cuerpo muy largo
  });
});

describe('formatearRut', () => {
  it('agrega puntos de miles y guión antes del dígito verificador', () => {
    expect(formatearRut('123456785')).toBe('12.345.678-5');
    expect(formatearRut('1000005K')).toBe('1.000.005-K');
    expect(formatearRut('79581135')).toBe('7.958.113-5');
  });

  it('no le importa que ya venga con formato (limpia primero)', () => {
    expect(formatearRut('12.345.678-5')).toBe('12.345.678-5');
  });
});
