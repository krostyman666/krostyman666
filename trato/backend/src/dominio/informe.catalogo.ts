/**
 * Catálogo del informe del inmueble, en dos niveles.
 *
 * El informe es lo que el comprador mira antes de ofertar. Va en dos niveles
 * porque las fuentes se comportan distinto: el avalúo del SII sale gratis y al
 * instante con el rol, mientras que los certificados del Conservador hay que
 * comprarlos y esperarlos. No existe una API de Conservador: son cerca de 300
 * oficinas independientes por territorio y casi ninguna publica servicio
 * digital, así que el nivel pagado tiene plazo en días hábiles y no se puede
 * prometer inmediato.
 *
 * TRES LÍMITES LEGALES QUE NO SON OPCIONALES
 *
 * 1. Un estudio de títulos lo firma un abogado. Según la pauta del Colegio de
 *    Abogados, el informe de títulos lleva conclusión, detalle de los defectos,
 *    fecha, firma y datos del abogado, que responde por lo que sostiene. Por eso
 *    `nivel: 'titulos'` se llama "carpeta de títulos" mientras no haya firma, y
 *    sólo pasa a llamarse estudio de títulos cuando la hay: ver `nombreDelNivel`.
 *
 * 2. El nivel gratis tiene que decir qué NO es. La Ley 19.496 sanciona la
 *    publicidad engañosa, y engañosa incluye inducir a error por omisión o
 *    ambigüedad, no sólo por afirmar algo falso. Un informe gratuito que el
 *    comprador confunda con un estudio de títulos cae justo ahí, así que
 *    `LIMITES_ANTECEDENTES` se muestra junto al informe y no en letra chica.
 *
 * 3. Los datos del vendedor necesitan base de licitud. La Ley 21.719 entra en
 *    plena vigencia el 1 de diciembre de 2026 y cambió precisamente lo que aquí
 *    servía: bajo la Ley 19.628 bastaba que el dato estuviera en una fuente de
 *    acceso público. Ya no. Que la inscripción sea pública no habilita por sí
 *    solo a republicarla, así que el vendedor autoriza expresamente la
 *    divulgación al publicar (ver el modelo `Consentimiento`), y las secciones
 *    marcadas con `requiereConsentimiento` no se emiten sin esa autorización.
 *
 * ADVERTENCIA: los costos, los plazos de vigencia y la obligatoriedad de cada
 * pieza deben confirmarse con abogado antes de producción. Los montos son del
 * Conservador de Santiago y cambian por territorio.
 */

export const NIVELES_INFORME = ['antecedentes', 'titulos'] as const;
export type NivelInforme = (typeof NIVELES_INFORME)[number];

export const FUENTES_INFORME = [
  'sii', // avalúo fiscal: gratis, en línea, por rol
  'tgr', // Tesorería: contribuciones por rol
  'cbr', // Conservador de Bienes Raíces del territorio
  'municipalidad',
  'serviu',
  'administracion_edificio',
  'vendedor', // lo declaró él al publicar
  'plataforma', // lo calcula Trato
  'abogado',
] as const;
export type FuenteInforme = (typeof FUENTES_INFORME)[number];

export interface SeccionInforme {
  codigo: string;
  titulo: string;
  /** Nivel en que aparece. 'antecedentes' también viaja dentro de 'titulos'. */
  nivel: NivelInforme;
  fuente: FuenteInforme;
  /** Se obtiene sin que intervenga una persona. Define qué puede ser instantáneo. */
  automatizable: boolean;
  /** Costo de obtenerla, en pesos. 0 = gratis. null = por confirmar. */
  costoClp: number | null;
  /** Días de vigencia desde la emisión. null = sin vencimiento conocido. */
  vigenciaDias: number | null;
  /** La pregunta del comprador que esta sección contesta. */
  queResponde: string;
  /** Datos del vendedor: no se emiten sin su autorización expresa. */
  requiereConsentimiento?: boolean;
  /** Solo aplica en ciertos casos. */
  condicional?: string;
}

/**
 * Plazo del nivel pagado, en días hábiles. Nace de que los certificados del
 * Conservador se piden y se esperan; prometer menos es prometer lo que no
 * controlamos.
 */
export const PLAZO_TITULOS_HABILES = { minimo: 2, maximo: 5 };

/** Años de historia que revisa un estudio de títulos, por práctica consolidada. */
export const ANOS_DE_HISTORIA = 10;

export const SECCIONES: SeccionInforme[] = [
  // ---------- Nivel gratis: lo que se puede armar al instante ----------
  {
    codigo: 'identificacion',
    titulo: 'Identificación del inmueble',
    nivel: 'antecedentes',
    fuente: 'plataforma',
    automatizable: true,
    costoClp: 0,
    vigenciaDias: null,
    queResponde: '¿De qué propiedad estamos hablando exactamente, y con qué rol de avalúo?',
  },
  {
    codigo: 'avaluo_fiscal',
    titulo: 'Avalúo fiscal',
    nivel: 'antecedentes',
    fuente: 'sii',
    automatizable: true,
    costoClp: 0,
    vigenciaDias: null,
    queResponde:
      '¿En cuánto tasa el Estado esta propiedad? Sirve de piso de referencia y fija las contribuciones. No es tasación comercial ni precio de mercado.',
  },
  {
    codigo: 'contribuciones',
    titulo: 'Contribuciones',
    nivel: 'antecedentes',
    fuente: 'tgr',
    automatizable: true,
    costoClp: 0,
    vigenciaDias: 30,
    queResponde:
      '¿Hay contribuciones impagas? Importa porque la deuda sigue al inmueble, no al vendedor.',
  },
  {
    codigo: 'avance_expediente',
    titulo: 'Avance de los papeles',
    nivel: 'antecedentes',
    fuente: 'vendedor',
    automatizable: true,
    costoClp: 0,
    vigenciaDias: null,
    requiereConsentimiento: true,
    queResponde:
      '¿Cuántos de los documentos de esta compraventa ya están reunidos y aprobados? Dice el avance, no el contenido de cada papel.',
  },
  {
    codigo: 'declaraciones_vendedor',
    titulo: 'Lo que declaró el vendedor',
    nivel: 'antecedentes',
    fuente: 'vendedor',
    automatizable: true,
    costoClp: 0,
    vigenciaDias: null,
    requiereConsentimiento: true,
    queResponde:
      '¿Hay hipoteca declarada, es propiedad en condominio, de qué año es la construcción? Son declaraciones del vendedor sin verificar todavía.',
  },
  {
    codigo: 'costos_operacion',
    titulo: 'Costos de la operación',
    nivel: 'antecedentes',
    fuente: 'plataforma',
    automatizable: true,
    costoClp: 0,
    vigenciaDias: null,
    queResponde: '¿Cuánto cuesta cerrar esta compra además del precio?',
  },

  // ---------- Nivel pagado: lo que hay que comprar y esperar ----------
  {
    codigo: 'carpeta_cbr',
    titulo: 'Carpeta de títulos del Conservador (10 años)',
    nivel: 'titulos',
    fuente: 'cbr',
    automatizable: false,
    costoClp: 13_500,
    vigenciaDias: 30,
    queResponde:
      '¿Quién es el dueño inscrito, qué gravámenes y prohibiciones pesan sobre el inmueble, y cuál es la cadena de títulos de los últimos 10 años?',
  },
  {
    codigo: 'no_expropiacion',
    titulo: 'No expropiación (municipal y SERVIU)',
    nivel: 'titulos',
    fuente: 'municipalidad',
    automatizable: true,
    costoClp: 0,
    vigenciaDias: 60,
    queResponde:
      '¿Hay un proyecto público que se coma esta propiedad? Son dos certificados distintos y cubren expropiaciones distintas.',
  },
  {
    codigo: 'recepcion_final',
    titulo: 'Recepción definitiva de la construcción',
    nivel: 'titulos',
    fuente: 'municipalidad',
    automatizable: false,
    costoClp: null,
    vigenciaDias: null,
    condicional: 'Propiedades construidas o ampliadas.',
    queResponde:
      '¿Lo construido está regularizado? Una ampliación sin recepción es obra irregular y la paga el comprador.',
  },
  {
    codigo: 'gastos_comunes',
    titulo: 'Gastos comunes al día',
    nivel: 'titulos',
    fuente: 'administracion_edificio',
    automatizable: false,
    costoClp: 0,
    vigenciaDias: 30,
    condicional: 'Solo departamentos y propiedades en condominio.',
    queResponde:
      '¿Debe gastos comunes? Bajo la Ley 21.442 el certificado de deuda del administrador es título ejecutivo: se cobra directo.',
  },
  {
    codigo: 'conclusion_abogado',
    titulo: 'Conclusión del abogado',
    nivel: 'titulos',
    fuente: 'abogado',
    automatizable: false,
    costoClp: null,
    vigenciaDias: null,
    condicional: 'Solo si un abogado revisa y firma. Sin firma no hay estudio de títulos.',
    queResponde:
      '¿Los títulos están conformes o tienen defectos? Lleva conclusión, detalle de los defectos, fecha, firma y datos del abogado, que responde por ella.',
  },
];

export const SECCION_POR_CODIGO = new Map(SECCIONES.map((s) => [s.codigo, s]));

/**
 * Lo que el informe gratis NO es. Va a la vista junto al informe, no al pie:
 * la publicidad engañosa por omisión se sanciona igual que la falsa.
 */
export const LIMITES_ANTECEDENTES = [
  'No es un estudio de títulos. No lo firma un abogado y no concluye si la propiedad se puede comprar sin riesgo.',
  'No incluye los certificados del Conservador, así que no confirma quién es el dueño inscrito ni qué hipotecas, embargos o prohibiciones pesan sobre el inmueble.',
  'No revisa la cadena de títulos de los últimos 10 años, que es donde aparecen los vicios que anulan una compraventa.',
  'El avalúo fiscal no es tasación comercial: no dice cuánto vale la propiedad en el mercado.',
  'Lo que declaró el vendedor se muestra como declaración suya, sin verificar.',
];

/** Lo que agrega el nivel pagado, en las mismas palabras que los límites de arriba. */
export const APORTES_TITULOS = [
  'Dueño inscrito, hipotecas, embargos y prohibiciones, según el Conservador del territorio.',
  `Cadena de títulos de los últimos ${ANOS_DE_HISTORIA} años.`,
  'Certificados de no expropiación municipal y SERVIU.',
  'Contribuciones, gastos comunes y regularización de lo construido.',
];

export interface ContextoInforme {
  esDepartamento: boolean;
  tieneConstruccion: boolean;
}

export function seccionesDeNivel(
  nivel: NivelInforme,
  ctx: ContextoInforme,
): SeccionInforme[] {
  return SECCIONES.filter((s) => {
    // El nivel pagado contiene también todo lo del gratis.
    if (nivel === 'antecedentes' && s.nivel !== 'antecedentes') return false;
    if (s.codigo === 'gastos_comunes') return ctx.esDepartamento;
    if (s.codigo === 'recepcion_final') return ctx.tieneConstruccion;
    return true;
  });
}

/**
 * Lo que nos cuesta emitir el informe. Las secciones con `costoClp: null` no
 * suman: su costo todavía no está confirmado, y meterlas con un número
 * inventado daría un precio falso.
 */
export function costoDeInsumos(nivel: NivelInforme, ctx: ContextoInforme): number {
  return seccionesDeNivel(nivel, ctx).reduce((total, s) => total + (s.costoClp ?? 0), 0);
}

/** Si alguna sección del nivel tiene costo por confirmar, el total es un piso. */
export function costoEsIncompleto(nivel: NivelInforme, ctx: ContextoInforme): boolean {
  return seccionesDeNivel(nivel, ctx).some((s) => s.costoClp === null);
}

/**
 * Cómo se llama el nivel pagado depende de si un abogado firmó. Llamarlo
 * estudio de títulos sin firma sería atribuirse una responsabilidad
 * profesional que nadie asumió.
 */
export function nombreDelNivel(nivel: NivelInforme, firmadoPorAbogado: boolean): string {
  if (nivel === 'antecedentes') return 'Antecedentes del inmueble';
  return firmadoPorAbogado ? 'Estudio de títulos' : 'Carpeta de títulos';
}
