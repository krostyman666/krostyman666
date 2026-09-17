/**
 * Catalogo de documentos de una compraventa de inmueble en Chile.
 *
 * ADVERTENCIA: los plazos de vigencia y la obligatoriedad de cada documento
 * deben ser confirmados con abogado antes de produccion. Varian por comuna,
 * por banco y segun si hay credito hipotecario de por medio. `vigenciaDias: null`
 * significa "sin vencimiento conocido o por confirmar", no "no vence".
 */

export const EMISORES = [
  'cbr', // Conservador de Bienes Raices (uno por territorio, ~300 en Chile)
  'sii', // Servicio de Impuestos Internos
  'tgr', // Tesoreria General de la Republica
  'municipalidad', // Direccion de Obras Municipales / Rentas
  'serviu',
  'registro_civil',
  'notaria',
  'banco',
  'tasador',
  'administracion_edificio',
  'plataforma', // lo genera Trato
  'parte', // lo aporta el comprador o el vendedor
] as const;
export type Emisor = (typeof EMISORES)[number];

export const ETAPAS = [
  'publicacion', // antes de publicar la propiedad
  'oferta', // para que el comprador pueda ofertar informado
  'promesa', // promesa de compraventa
  'credito', // aprobacion del credito hipotecario
  'escritura', // firma ante notario
  'inscripcion', // inscripcion en el CBR
] as const;
export type Etapa = (typeof ETAPAS)[number];

export type Responsable = 'vendedor' | 'comprador' | 'plataforma';

export interface DefinicionDocumento {
  codigo: string;
  nombre: string;
  emisor: Emisor;
  responsable: Responsable;
  etapa: Etapa;
  /** Dias de vigencia desde la emision. null = por confirmar. */
  vigenciaDias: number | null;
  /** Solo aplica en ciertos casos (depto, propiedad con hipoteca, etc). */
  condicional?: string;
  comoSeObtiene: string;
}

export const CATALOGO: DefinicionDocumento[] = [
  {
    codigo: 'dominio_vigente',
    nombre: 'Certificado de dominio vigente',
    emisor: 'cbr',
    responsable: 'plataforma',
    etapa: 'publicacion',
    vigenciaDias: 30,
    comoSeObtiene: 'Se solicita al Conservador del territorio con la foja, numero y año de inscripcion.',
  },
  {
    codigo: 'hipotecas_gravamenes',
    nombre: 'Certificado de hipotecas, gravámenes y prohibiciones',
    emisor: 'cbr',
    responsable: 'plataforma',
    etapa: 'publicacion',
    vigenciaDias: 30,
    comoSeObtiene: 'Mismo Conservador que el dominio vigente. Revela hipotecas y embargos vigentes.',
  },
  {
    codigo: 'avaluo_fiscal',
    nombre: 'Certificado de avalúo fiscal',
    emisor: 'sii',
    responsable: 'plataforma',
    etapa: 'publicacion',
    vigenciaDias: null,
    comoSeObtiene: 'Se obtiene en sii.cl con el rol de avalúo de la propiedad.',
  },
  {
    codigo: 'deuda_contribuciones',
    nombre: 'Certificado de deuda de contribuciones',
    emisor: 'tgr',
    responsable: 'plataforma',
    etapa: 'publicacion',
    vigenciaDias: 30,
    comoSeObtiene: 'Tesoreria, por rol de avalúo. Las contribuciones impagas siguen a la propiedad.',
  },
  {
    codigo: 'no_expropiacion_municipal',
    nombre: 'Certificado de no expropiación municipal',
    emisor: 'municipalidad',
    responsable: 'plataforma',
    etapa: 'oferta',
    vigenciaDias: 60,
    comoSeObtiene: 'Direccion de Obras de la comuna donde está el inmueble.',
  },
  {
    codigo: 'no_expropiacion_serviu',
    nombre: 'Certificado de no expropiación SERVIU',
    emisor: 'serviu',
    responsable: 'plataforma',
    etapa: 'oferta',
    vigenciaDias: 60,
    comoSeObtiene: 'SERVIU regional. Complementa al municipal: cubren expropiaciones distintas.',
  },
  {
    codigo: 'certificado_numero',
    nombre: 'Certificado de número',
    emisor: 'municipalidad',
    responsable: 'plataforma',
    etapa: 'oferta',
    vigenciaDias: null,
    comoSeObtiene: 'Direccion de Obras. Acredita la dirección oficial del inmueble.',
  },
  {
    codigo: 'recepcion_final',
    nombre: 'Certificado de recepción definitiva',
    emisor: 'municipalidad',
    responsable: 'plataforma',
    etapa: 'oferta',
    vigenciaDias: null,
    condicional: 'Construcciones y ampliaciones. Sin esto puede haber obra irregular.',
    comoSeObtiene: 'Direccion de Obras de la comuna.',
  },
  {
    codigo: 'gastos_comunes',
    nombre: 'Certificado de gastos comunes al día',
    emisor: 'administracion_edificio',
    responsable: 'vendedor',
    etapa: 'oferta',
    vigenciaDias: 30,
    condicional: 'Solo departamentos y propiedades en condominio.',
    comoSeObtiene: 'Administración del edificio o condominio.',
  },
  {
    codigo: 'tasacion',
    nombre: 'Tasación comercial',
    emisor: 'tasador',
    responsable: 'comprador',
    etapa: 'credito',
    vigenciaDias: 90,
    condicional: 'Obligatoria si hay crédito hipotecario; el banco suele exigir su propio tasador.',
    comoSeObtiene: 'Tasador registrado o el que designe el banco.',
  },
  {
    codigo: 'cedula_identidad',
    nombre: 'Cédula de identidad de las partes',
    emisor: 'parte',
    responsable: 'plataforma',
    etapa: 'promesa',
    vigenciaDias: null,
    comoSeObtiene: 'La aporta cada parte. Debe estar vigente al día de la firma.',
  },
  {
    codigo: 'estado_civil',
    nombre: 'Certificado de matrimonio o estado civil',
    emisor: 'registro_civil',
    responsable: 'plataforma',
    etapa: 'promesa',
    vigenciaDias: 60,
    condicional: 'Define el régimen patrimonial y si se requiere firma del cónyuge.',
    comoSeObtiene: 'Registro Civil, en línea.',
  },
  {
    codigo: 'promesa_compraventa',
    nombre: 'Promesa de compraventa',
    emisor: 'plataforma',
    responsable: 'plataforma',
    etapa: 'promesa',
    vigenciaDias: null,
    comoSeObtiene: 'La redacta Trato con los datos de la operación. Se firma antes de la escritura.',
  },
  {
    codigo: 'aprobacion_credito',
    nombre: 'Carta de aprobación de crédito hipotecario',
    emisor: 'banco',
    responsable: 'comprador',
    etapa: 'credito',
    vigenciaDias: 90,
    condicional: 'Solo si la compra se financia con crédito.',
    comoSeObtiene: 'El banco del comprador, tras evaluar renta y tasación.',
  },
  {
    codigo: 'alzamiento_hipoteca',
    nombre: 'Alzamiento de hipoteca',
    emisor: 'banco',
    responsable: 'vendedor',
    etapa: 'escritura',
    vigenciaDias: null,
    condicional: 'Solo si la propiedad tiene un crédito vigente.',
    comoSeObtiene: 'El banco acreedor emite la escritura de alzamiento; se inscribe en el CBR.',
  },
  {
    codigo: 'escritura_compraventa',
    nombre: 'Escritura pública de compraventa',
    emisor: 'notaria',
    responsable: 'plataforma',
    etapa: 'escritura',
    vigenciaDias: null,
    comoSeObtiene:
      'Se redacta y se firma ante notario. Por ley la compraventa de inmuebles requiere escritura pública: no se reemplaza con firma electrónica.',
  },
  {
    codigo: 'inscripcion_dominio',
    nombre: 'Inscripción de dominio a nombre del comprador',
    emisor: 'cbr',
    responsable: 'plataforma',
    etapa: 'inscripcion',
    vigenciaDias: null,
    comoSeObtiene:
      'Se presenta la escritura en el Conservador. Recién con la inscripción se transfiere el dominio.',
  },
];

export const POR_CODIGO = new Map(CATALOGO.map((d) => [d.codigo, d]));

export interface ContextoPropiedad {
  esDepartamento: boolean;
  tieneHipoteca: boolean;
  compraConCredito: boolean;
}

/** Documentos que aplican a una operación según sus condiciones. */
export function documentosAplicables(ctx: ContextoPropiedad): DefinicionDocumento[] {
  return CATALOGO.filter((d) => {
    if (d.codigo === 'gastos_comunes') return ctx.esDepartamento;
    if (d.codigo === 'alzamiento_hipoteca') return ctx.tieneHipoteca;
    if (d.codigo === 'tasacion' || d.codigo === 'aprobacion_credito') return ctx.compraConCredito;
    return true;
  });
}

export function documentosDeEtapa(etapa: Etapa, ctx: ContextoPropiedad): DefinicionDocumento[] {
  return documentosAplicables(ctx).filter((d) => d.etapa === etapa);
}

/** Un certificado vencido obliga a pedirlo de nuevo: es la fricción que la plataforma evita. */
export function estaVencido(codigo: string, fechaEmision: Date, ahora = new Date()): boolean {
  const def = POR_CODIGO.get(codigo);
  if (!def?.vigenciaDias) return false;
  const dias = (ahora.getTime() - fechaEmision.getTime()) / 86_400_000;
  return dias > def.vigenciaDias;
}
