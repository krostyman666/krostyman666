import { documentosAplicables, documentosDeEtapa, estaVencido, CATALOGO, ContextoPropiedad } from './documentos.catalogo';

const CTX_BASE: ContextoPropiedad = {
  esDepartamento: false,
  tieneHipoteca: false,
  compraConCredito: false,
};

describe('documentosAplicables', () => {
  it('excluye gastos_comunes, alzamiento_hipoteca, tasacion y aprobacion_credito en el caso base', () => {
    const codigos = documentosAplicables(CTX_BASE).map((d) => d.codigo);
    expect(codigos).not.toContain('gastos_comunes');
    expect(codigos).not.toContain('alzamiento_hipoteca');
    expect(codigos).not.toContain('tasacion');
    expect(codigos).not.toContain('aprobacion_credito');
  });

  it('incluye gastos_comunes sólo si es departamento', () => {
    const codigos = documentosAplicables({ ...CTX_BASE, esDepartamento: true }).map((d) => d.codigo);
    expect(codigos).toContain('gastos_comunes');
  });

  it('incluye alzamiento_hipoteca sólo si tiene hipoteca', () => {
    const codigos = documentosAplicables({ ...CTX_BASE, tieneHipoteca: true }).map((d) => d.codigo);
    expect(codigos).toContain('alzamiento_hipoteca');
  });

  it('incluye tasacion y aprobacion_credito sólo si compra con crédito', () => {
    const codigos = documentosAplicables({ ...CTX_BASE, compraConCredito: true }).map((d) => d.codigo);
    expect(codigos).toContain('tasacion');
    expect(codigos).toContain('aprobacion_credito');
  });

  it('nunca excluye el resto del catálogo, que no es condicional', () => {
    const sinCondicionales = CATALOGO.filter(
      (d) => !['gastos_comunes', 'alzamiento_hipoteca', 'tasacion', 'aprobacion_credito'].includes(d.codigo),
    );
    const codigos = documentosAplicables(CTX_BASE).map((d) => d.codigo);
    for (const d of sinCondicionales) {
      expect(codigos).toContain(d.codigo);
    }
  });
});

describe('documentosDeEtapa', () => {
  it('filtra por etapa dentro de los documentos aplicables', () => {
    const deEscritura = documentosDeEtapa('escritura', { ...CTX_BASE, tieneHipoteca: true });
    const codigos = deEscritura.map((d) => d.codigo);
    expect(codigos).toContain('escritura_compraventa');
    expect(codigos).toContain('alzamiento_hipoteca');
  });

  it('no trae un documento condicional si el contexto no lo activa', () => {
    const deEscritura = documentosDeEtapa('escritura', CTX_BASE);
    expect(deEscritura.map((d) => d.codigo)).not.toContain('alzamiento_hipoteca');
  });
});

describe('estaVencido', () => {
  it('no está vencido un certificado sin vigenciaDias conocida', () => {
    const ahora = new Date('2026-10-07');
    const haceUnAno = new Date('2025-10-07');
    expect(estaVencido('avaluo_fiscal', haceUnAno, ahora)).toBe(false);
  });

  it('un certificado con vigencia de 30 días vence al día 31', () => {
    const emision = new Date('2026-01-01T00:00:00Z');
    const dia31 = new Date(emision.getTime() + 31 * 86_400_000);
    expect(estaVencido('dominio_vigente', emision, dia31)).toBe(true);
  });

  it('un certificado con vigencia de 30 días sigue vigente al día 30', () => {
    const emision = new Date('2026-01-01T00:00:00Z');
    const dia30 = new Date(emision.getTime() + 30 * 86_400_000);
    expect(estaVencido('dominio_vigente', emision, dia30)).toBe(false);
  });

  it('devuelve false para un código que no existe en el catálogo', () => {
    expect(estaVencido('codigo_inexistente', new Date('2000-01-01'))).toBe(false);
  });
});
