import {
  calcularTimbres,
  DocumentoMinuta,
  generarMinuta,
  ParteMinuta,
  PromesaMinuta,
  PropiedadMinuta,
  TASA_TIMBRES_MENSUAL,
  TASA_TIMBRES_TOPE,
} from './minuta';

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

const VENDEDOR: ParteMinuta = { nombre: 'Marta', apellido: 'Soto', rut: '12.345.678-5' };
const COMPRADOR: ParteMinuta = { nombre: 'Juan', apellido: 'Pérez', rut: '7.958.113-5' };

const PROPIEDAD_COMPLETA: PropiedadMinuta = {
  calle: 'Av. Siempre Viva',
  numero: '123',
  depto: null,
  comuna: 'Ñuñoa',
  region: 'Metropolitana',
  rolAvaluo: '123-45',
  fojas: '100',
  numeroInscripcion: '50',
  anoInscripcion: 2020,
};

const PROMESA_SIN_CREDITO: PromesaMinuta = { precio: 100_000_000, moneda: 'clp', pie: 10_000_000 };

const DOC_CONFORME = (codigo: string): DocumentoMinuta => ({
  codigo,
  conforme: true,
  fechaEmision: new Date('2026-01-01'),
});
const DOC_NO_CONFORME = (codigo: string): DocumentoMinuta => ({ codigo, conforme: false, fechaEmision: null });

const DOCUMENTOS_TODOS_CONFORMES: DocumentoMinuta[] = [
  'dominio_vigente',
  'hipotecas_gravamenes',
  'deuda_contribuciones',
  'no_expropiacion_municipal',
].map(DOC_CONFORME);

describe('generarMinuta', () => {
  it('no advierte por RUT si ambas partes lo tienen', () => {
    const minuta = generarMinuta({
      vendedor: VENDEDOR,
      comprador: COMPRADOR,
      propiedad: PROPIEDAD_COMPLETA,
      promesa: PROMESA_SIN_CREDITO,
      documentos: DOCUMENTOS_TODOS_CONFORMES,
      hayCredito: false,
    });
    expect(minuta.advertencias).not.toContain('Falta el RUT de una de las partes: no se puede escriturar sin él.');
  });

  it('advierte si falta el RUT de alguna de las partes', () => {
    const minuta = generarMinuta({
      vendedor: { ...VENDEDOR, rut: null },
      comprador: COMPRADOR,
      propiedad: PROPIEDAD_COMPLETA,
      promesa: PROMESA_SIN_CREDITO,
      documentos: DOCUMENTOS_TODOS_CONFORMES,
      hayCredito: false,
    });
    expect(minuta.advertencias).toContain('Falta el RUT de una de las partes: no se puede escriturar sin él.');
    const seccion = minuta.secciones.find((s) => s.titulo === 'Comparecientes')!;
    expect(seccion.texto).toContain('[RUT PENDIENTE]');
  });

  it('marca pendiente la inscripción si falta foja, número o año', () => {
    const minuta = generarMinuta({
      vendedor: VENDEDOR,
      comprador: COMPRADOR,
      propiedad: { ...PROPIEDAD_COMPLETA, fojas: null },
      promesa: PROMESA_SIN_CREDITO,
      documentos: DOCUMENTOS_TODOS_CONFORMES,
      hayCredito: false,
    });
    const seccion = minuta.secciones.find((s) => s.titulo.includes('antecedentes de dominio'))!;
    expect(seccion.texto).toContain('[PENDIENTE: falta la foja, número y año');
    expect(minuta.advertencias).toContain(
      'Falta la inscripción vigente del vendedor (foja, número, año) en la ficha de la propiedad.',
    );
  });

  it('incluye el rol de avalúo cuando está disponible', () => {
    const minuta = generarMinuta({
      vendedor: VENDEDOR,
      comprador: COMPRADOR,
      propiedad: PROPIEDAD_COMPLETA,
      promesa: PROMESA_SIN_CREDITO,
      documentos: DOCUMENTOS_TODOS_CONFORMES,
      hayCredito: false,
    });
    const seccion = minuta.secciones.find((s) => s.titulo.includes('antecedentes de dominio'))!;
    expect(seccion.texto).toContain('El rol de avalúo del inmueble es 123-45.');
  });

  it('declara conforme un certificado aprobado, con su fecha', () => {
    const minuta = generarMinuta({
      vendedor: VENDEDOR,
      comprador: COMPRADOR,
      propiedad: PROPIEDAD_COMPLETA,
      promesa: PROMESA_SIN_CREDITO,
      documentos: DOCUMENTOS_TODOS_CONFORMES,
      hayCredito: false,
    });
    const seccion = minuta.secciones.find((s) => s.titulo === 'Declaraciones sobre el estado del inmueble')!;
    expect(seccion.texto).toContain('Según certificado de dominio vigente de fecha');
    expect(minuta.advertencias.some((a) => a.includes('dominio_vigente'))).toBe(false);
  });

  it('nunca afirma un certificado no conforme: deja el pendiente y advierte', () => {
    const minuta = generarMinuta({
      vendedor: VENDEDOR,
      comprador: COMPRADOR,
      propiedad: PROPIEDAD_COMPLETA,
      promesa: PROMESA_SIN_CREDITO,
      documentos: [
        DOC_NO_CONFORME('dominio_vigente'),
        DOC_CONFORME('hipotecas_gravamenes'),
        DOC_CONFORME('deuda_contribuciones'),
        DOC_CONFORME('no_expropiacion_municipal'),
      ],
      hayCredito: false,
    });
    const seccion = minuta.secciones.find((s) => s.titulo === 'Declaraciones sobre el estado del inmueble')!;
    expect(seccion.texto).toContain('[PENDIENTE: falta el certificado de dominio vigente');
    expect(minuta.advertencias.some((a) => a.includes('"dominio_vigente"'))).toBe(true);
  });

  it('agrega la sección de timbres sólo si hay crédito', () => {
    const conCredito = generarMinuta({
      vendedor: VENDEDOR,
      comprador: COMPRADOR,
      propiedad: PROPIEDAD_COMPLETA,
      promesa: PROMESA_SIN_CREDITO,
      documentos: DOCUMENTOS_TODOS_CONFORMES,
      hayCredito: true,
    });
    const sinCredito = generarMinuta({
      vendedor: VENDEDOR,
      comprador: COMPRADOR,
      propiedad: PROPIEDAD_COMPLETA,
      promesa: PROMESA_SIN_CREDITO,
      documentos: DOCUMENTOS_TODOS_CONFORMES,
      hayCredito: false,
    });
    expect(conCredito.secciones.some((s) => s.titulo === 'Impuesto de timbres y estampillas')).toBe(true);
    expect(sinCredito.secciones.some((s) => s.titulo === 'Impuesto de timbres y estampillas')).toBe(false);
    expect(conCredito.hayCredito).toBe(true);
    expect(sinCredito.hayCredito).toBe(false);
  });

  it('describe el pie y el saldo cuando hay pie pagado', () => {
    const minuta = generarMinuta({
      vendedor: VENDEDOR,
      comprador: COMPRADOR,
      propiedad: PROPIEDAD_COMPLETA,
      promesa: { precio: 100_000_000, moneda: 'clp', pie: 10_000_000 },
      documentos: DOCUMENTOS_TODOS_CONFORMES,
      hayCredito: false,
    });
    const seccion = minuta.secciones.find((s) => s.titulo === 'Precio y forma de pago')!;
    expect(seccion.texto).toContain('pagados a título de pie');
    expect(seccion.texto).toContain('saldo de $90.000.000');
  });

  it('no menciona pie ni saldo cuando no hay pie', () => {
    const minuta = generarMinuta({
      vendedor: VENDEDOR,
      comprador: COMPRADOR,
      propiedad: PROPIEDAD_COMPLETA,
      promesa: { precio: 100_000_000, moneda: 'clp', pie: null },
      documentos: DOCUMENTOS_TODOS_CONFORMES,
      hayCredito: false,
    });
    const seccion = minuta.secciones.find((s) => s.titulo === 'Precio y forma de pago')!;
    expect(seccion.texto).not.toContain('a título de pie');
  });
});
