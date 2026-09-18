/**
 * Registro de actividades de tratamiento.
 *
 * Es el inventario de qué datos personales trata Trato, para qué, con qué base
 * de licitud y por cuánto tiempo. Va en código y no en un documento aparte
 * porque de acá salen dos cosas que el sistema ejecuta: qué se puede suprimir
 * cuando el titular lo pide, y qué se anonimiza al vencer su plazo.
 *
 * La Ley 21.719 exige plena vigencia desde el 1 de diciembre de 2026, con
 * multas de hasta 20.000 UTM o 4% de los ingresos en reincidencia. Lo que se
 * fiscaliza es evidencia operativa —registros fechados— no la existencia de una
 * política.
 *
 * ADVERTENCIA: los plazos de conservación hay que confirmarlos con abogado. El
 * de 6 años viene de la prescripción tributaria extendida del Código
 * Tributario; los demás son criterios comerciales y no obligaciones legales
 * identificadas.
 */

export const BASES_LICITUD = [
  'consentimiento',
  'contrato', // necesario para celebrar o ejecutar el contrato
  'obligacion_legal',
  'interes_legitimo',
] as const;
export type BaseLicitud = (typeof BASES_LICITUD)[number];

/**
 * Qué se puede hacer cuando el titular pide que se borren sus datos.
 *
 * `retener_por_ley` no es una excusa para guardar todo: es para lo que otra
 * norma obliga a conservar, como la documentación de una operación cerrada.
 */
export const TRATOS_SUPRESION = ['suprimible', 'anonimizable', 'retener_por_ley'] as const;
export type TratoSupresion = (typeof TRATOS_SUPRESION)[number];

export interface ActividadTratamiento {
  codigo: string;
  /** Qué datos son, en palabras del titular. */
  categoria: string;
  finalidad: string;
  base: BaseLicitud;
  /** Meses desde que la relación termina. null = mientras la cuenta esté activa. */
  conservacionMeses: number | null;
  supresion: TratoSupresion;
  /** Por qué se conserva o por qué no se puede borrar. */
  nota: string;
}

/** Prescripción tributaria extendida: 6 años. */
const SEIS_ANOS = 72;

export const REGISTRO_TRATAMIENTO: ActividadTratamiento[] = [
  {
    codigo: 'cuenta',
    categoria: 'Nombre, apellido, correo y teléfono',
    finalidad: 'Identificar al usuario y comunicarse con él durante la operación.',
    base: 'contrato',
    conservacionMeses: null,
    supresion: 'anonimizable',
    nota: 'Se reemplaza por un marcador al suprimir. No se borra la fila porque cuelgan de ella visitas e informes que sí hay que conservar.',
  },
  {
    codigo: 'rut',
    categoria: 'RUT',
    finalidad: 'Identificar a las partes en la promesa y en la escritura.',
    base: 'contrato',
    conservacionMeses: SEIS_ANOS,
    supresion: 'anonimizable',
    nota: 'Mientras haya una operación en curso no se toca: sin RUT no se puede escriturar. Cerrada la operación, corre el plazo tributario.',
  },
  {
    codigo: 'credenciales',
    categoria: 'Clave de acceso',
    finalidad: 'Autenticar al usuario.',
    base: 'contrato',
    conservacionMeses: null,
    supresion: 'suprimible',
    nota: 'Se guarda sólo el hash con bcrypt; nunca la clave. Al suprimir se invalida y la cuenta deja de poder entrar.',
  },
  {
    codigo: 'propiedad',
    categoria: 'Dirección, precio y características del inmueble',
    finalidad: 'Publicar la propiedad y gestionar su compraventa.',
    base: 'contrato',
    conservacionMeses: SEIS_ANOS,
    supresion: 'retener_por_ley',
    nota: 'Si la propiedad se vendió, la operación es documentación de una compraventa. Una publicación que nunca vendió sí se puede retirar y anonimizar.',
  },
  {
    codigo: 'expediente',
    categoria: 'Documentos de la compraventa y su estado',
    finalidad: 'Reunir y validar los papeles que la operación necesita.',
    base: 'contrato',
    conservacionMeses: SEIS_ANOS,
    supresion: 'retener_por_ley',
    nota: 'Incluye certificados de registros públicos y la revisión de la notaría.',
  },
  {
    codigo: 'visitas',
    categoria: 'Visitas agendadas y lo que el comprador escribió al pedirlas',
    finalidad: 'Coordinar la visita y asignar al asesor que la muestra.',
    base: 'contrato',
    conservacionMeses: 24,
    supresion: 'anonimizable',
    nota: 'El mensaje libre se borra al suprimir: lo escribe el comprador y puede contener cualquier cosa.',
  },
  {
    codigo: 'informes',
    categoria: 'Informes del inmueble emitidos a compradores',
    finalidad: 'Entregar al comprador los antecedentes con que decide ofertar.',
    base: 'contrato',
    conservacionMeses: SEIS_ANOS,
    supresion: 'retener_por_ley',
    nota: 'Es la evidencia de qué se le entregó y cuándo. Si el informe lleva firma de abogado, además respalda una responsabilidad profesional.',
  },
  {
    codigo: 'consentimientos',
    categoria: 'Autorizaciones que el vendedor otorgó o revocó',
    finalidad: 'Acreditar la base de licitud con que se divulgaron sus antecedentes.',
    base: 'obligacion_legal',
    conservacionMeses: SEIS_ANOS,
    supresion: 'retener_por_ley',
    nota: 'Borrar el consentimiento destruiría justamente la prueba de que el tratamiento estaba permitido. Es lo primero que pediría la Agencia.',
  },
];

export const ACTIVIDAD_POR_CODIGO = new Map(REGISTRO_TRATAMIENTO.map((a) => [a.codigo, a]));

/** Los derechos que el titular puede ejercer, con el nombre que usa la ley. */
export const DERECHOS = [
  { codigo: 'acceso', nombre: 'Acceso', que: 'Saber qué datos tenemos tuyos y de dónde salieron.' },
  {
    codigo: 'rectificacion',
    nombre: 'Rectificación',
    que: 'Corregir lo que esté equivocado o incompleto.',
  },
  {
    codigo: 'supresion',
    nombre: 'Supresión',
    que: 'Pedir que se borren, salvo lo que otra ley obliga a conservar.',
  },
  {
    codigo: 'oposicion',
    nombre: 'Oposición',
    que: 'Retirar una autorización que diste, como la de divulgar tus antecedentes.',
  },
  {
    codigo: 'portabilidad',
    nombre: 'Portabilidad',
    que: 'Llevarte tus datos en un archivo que otro sistema pueda leer.',
  },
] as const;

/** Campos que el propio titular puede corregir sin que nadie los revise. */
export const CAMPOS_RECTIFICABLES = ['nombre', 'apellido', 'telefono', 'email'] as const;
export type CampoRectificable = (typeof CAMPOS_RECTIFICABLES)[number];

/**
 * El RUT no está en la lista de arriba a propósito. Identifica a la persona en
 * la escritura, así que cambiarlo solo no es corregir un dato: es cambiar de
 * quién es la operación. Pasa por revisión humana.
 */
export const CAMPOS_CON_REVISION = ['rut'] as const;
