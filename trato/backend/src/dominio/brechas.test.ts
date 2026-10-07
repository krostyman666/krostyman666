import { motivoParaNoCerrar, plazoAgenciaVencido, requiereNotificarTitulares, venceEl } from './brechas';

describe('requiereNotificarTitulares', () => {
  it('exige notificar a los titulares si alguna categoría es de riesgo alto', () => {
    expect(requiereNotificarTitulares(['rut'])).toBe(true);
    expect(requiereNotificarTitulares(['credenciales'])).toBe(true);
    expect(requiereNotificarTitulares(['expediente'])).toBe(true);
    expect(requiereNotificarTitulares(['informes'])).toBe(true);
  });

  it('no exige notificar a los titulares si ninguna categoría es de riesgo alto', () => {
    expect(requiereNotificarTitulares(['nombre_contacto'])).toBe(false);
    expect(requiereNotificarTitulares([])).toBe(false);
  });

  it('basta con que una sola categoría sea de riesgo alto entre varias', () => {
    expect(requiereNotificarTitulares(['nombre_contacto', 'rut'])).toBe(true);
  });
});

describe('venceEl', () => {
  it('vence 72 horas después de detectado', () => {
    const detectadoEn = new Date('2026-01-01T00:00:00.000Z');
    expect(venceEl(detectadoEn).toISOString()).toBe('2026-01-04T00:00:00.000Z');
  });
});

describe('plazoAgenciaVencido', () => {
  it('no está vencido si ya se notificó, aunque haya pasado el plazo', () => {
    const detectadoEn = new Date('2026-01-01T00:00:00.000Z');
    const notificadaAgenciaEn = new Date('2026-01-10T00:00:00.000Z');
    const ahora = new Date('2026-01-20T00:00:00.000Z');
    expect(plazoAgenciaVencido(detectadoEn, notificadaAgenciaEn, ahora)).toBe(false);
  });

  it('está vencido si no se notificó y ya pasaron 72 horas', () => {
    const detectadoEn = new Date('2026-01-01T00:00:00.000Z');
    const ahora = new Date('2026-01-04T00:00:01.000Z');
    expect(plazoAgenciaVencido(detectadoEn, null, ahora)).toBe(true);
  });

  it('no está vencido si no se notificó pero todavía no pasaron 72 horas', () => {
    const detectadoEn = new Date('2026-01-01T00:00:00.000Z');
    const ahora = new Date('2026-01-03T23:59:59.000Z');
    expect(plazoAgenciaVencido(detectadoEn, null, ahora)).toBe(false);
  });
});

describe('motivoParaNoCerrar', () => {
  it('bloquea si falta notificar a la Agencia, aunque las categorías sean de bajo riesgo', () => {
    const motivo = motivoParaNoCerrar({
      categoriasAfectadas: ['nombre_contacto'],
      notificadaAgenciaEn: null,
      notificadaTitularesEn: null,
    });
    expect(motivo).toMatch(/Agencia/);
  });

  it('bloquea si hay categoría de riesgo alto y falta notificar a los titulares', () => {
    const motivo = motivoParaNoCerrar({
      categoriasAfectadas: ['rut'],
      notificadaAgenciaEn: new Date('2026-01-01'),
      notificadaTitularesEn: null,
    });
    expect(motivo).toMatch(/titulares/);
  });

  it('no bloquea con sólo categorías de bajo riesgo si ya se notificó a la Agencia', () => {
    const motivo = motivoParaNoCerrar({
      categoriasAfectadas: ['nombre_contacto'],
      notificadaAgenciaEn: new Date('2026-01-01'),
      notificadaTitularesEn: null,
    });
    expect(motivo).toBeNull();
  });

  it('no bloquea con categoría de riesgo alto si se notificó a ambos', () => {
    const motivo = motivoParaNoCerrar({
      categoriasAfectadas: ['rut'],
      notificadaAgenciaEn: new Date('2026-01-01'),
      notificadaTitularesEn: new Date('2026-01-02'),
    });
    expect(motivo).toBeNull();
  });
});
