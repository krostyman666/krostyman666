/**
 * La promesa de compraventa y sus cláusulas.
 *
 * EL ARTÍCULO 1554 MANDA. El Código Civil parte diciendo que "la promesa de
 * celebrar un contrato no produce obligación alguna", y sólo la salva si
 * concurren cuatro circunstancias. Falta una y la promesa es nula de nulidad
 * absoluta: no vale nada, y el comprador que pagó un pie queda sin contrato que
 * exigir. Por eso los cuatro requisitos se verifican en código y bloquean el
 * paso a firma, en vez de quedar como advertencia que alguien lee o no.
 *
 * LO DEMÁS SE NEGOCIA. Arras, multa, plazo de entrega y quién paga qué son
 * cláusulas que las partes acuerdan. El sistema las mueve entre las dos, deja
 * el rastro de quién propuso qué, y exige que ambas acepten el mismo texto.
 *
 * ADVERTENCIA: los textos de acá son plantillas para negociar, no un contrato
 * listo para firmar. La promesa final la revisa un abogado antes de la firma
 * —para eso existe el rol— y los montos y porcentajes por defecto son prácticas
 * de mercado, no reglas legales.
 */

export const ESTADOS_PROMESA = [
  'negociando',
  'acordada', // ambas partes aceptaron todas las cláusulas y se cumple el 1554
  'firmada',
  'cumplida', // se otorgó la escritura
  'desistida',
] as const;
export type EstadoPromesa = (typeof ESTADOS_PROMESA)[number];

/**
 * Los cuatro requisitos del artículo 1554. `campo` apunta a lo que hay que
 * llenar para satisfacerlo.
 */
export interface RequisitoLegal {
  codigo: string;
  numeral: string;
  exige: string;
  porQue: string;
}

export const REQUISITOS_1554: RequisitoLegal[] = [
  {
    codigo: 'por_escrito',
    numeral: '1554 Nº1',
    exige: 'Que la promesa conste por escrito.',
    porQue:
      'Es lo que la hace solemne. Un acuerdo de palabra sobre un inmueble no obliga a nadie.',
  },
  {
    codigo: 'contrato_eficaz',
    numeral: '1554 Nº2',
    exige: 'Que el contrato prometido no sea de los que las leyes declaran ineficaces.',
    porQue:
      'Prometer una compraventa que la ley no permite —un bien embargado sin alzamiento, por ejemplo— no se sanea firmando.',
  },
  {
    codigo: 'plazo_o_condicion',
    numeral: '1554 Nº3',
    exige: 'Que contenga un plazo o condición que fije la época de la celebración.',
    porQue:
      'Sin fecha cierta nadie puede exigir que se firme. Es el requisito que más promesas anula.',
  },
  {
    codigo: 'contrato_especificado',
    numeral: '1554 Nº4',
    exige:
      'Que el contrato prometido esté especificado de tal modo que sólo falten la tradición de la cosa o las solemnidades legales.',
    porQue:
      'El inmueble, el precio y la forma de pago tienen que estar determinados. Una promesa que deja el precio "a convenir" es nula.',
  },
];

export const TIPOS_CLAUSULA = ['obligatoria', 'negociable'] as const;
export type TipoClausula = (typeof TIPOS_CLAUSULA)[number];

export interface DefinicionClausula {
  codigo: string;
  titulo: string;
  tipo: TipoClausula;
  /** Qué requisito del 1554 satisface, si satisface alguno. */
  satisface?: string;
  queDice: string;
  porQueImporta: string;
  /** Texto de partida para negociar. Lleva marcadores entre llaves. */
  plantilla: string;
  /** Sólo se crea si la propiedad tiene hipoteca declarada. */
  soloSiHipoteca?: boolean;
}

export const CLAUSULAS: DefinicionClausula[] = [
  {
    codigo: 'individualizacion',
    titulo: 'Individualización del inmueble',
    tipo: 'obligatoria',
    satisface: 'contrato_especificado',
    queDice: 'Qué propiedad se promete vender, con su inscripción en el Conservador.',
    porQueImporta:
      'Sin foja, número y año nadie puede saber con certeza cuál inmueble es. Es lo que el 1554 Nº4 exige determinar.',
    plantilla:
      'El inmueble ubicado en {direccion}, comuna de {comuna}, inscrito a fojas {fojas} número {numero} del Registro de Propiedad del Conservador de Bienes Raíces de {conservador} del año {ano}, rol de avalúo {rol}.',
  },
  {
    codigo: 'precio_y_pago',
    titulo: 'Precio y forma de pago',
    tipo: 'obligatoria',
    satisface: 'contrato_especificado',
    queDice: 'Cuánto se paga, en qué moneda y cómo se entera.',
    porQueImporta:
      'Una promesa que deja el precio "a convenir" es nula. La forma de pago tiene que decir qué parte va al contado y qué parte con crédito.',
    plantilla:
      'El precio de la compraventa es de {precio} y se pagará: {pie} al momento de la firma de la presente promesa, y el saldo de {saldo} al momento de la escritura de compraventa.',
  },
  {
    codigo: 'plazo',
    titulo: 'Plazo para escriturar',
    tipo: 'obligatoria',
    satisface: 'plazo_o_condicion',
    queDice: 'Cuándo, a más tardar, se firma la compraventa definitiva.',
    porQueImporta:
      'Es el requisito que más promesas anula. Con fondos propios se usan 60 días; con crédito hipotecario, 90 a 120.',
    plantilla:
      'La escritura de compraventa se otorgará a más tardar el día {fecha}, en la notaría que las partes acuerden.',
  },
  {
    codigo: 'alzamiento',
    titulo: 'Alzamiento de la hipoteca',
    tipo: 'obligatoria',
    satisface: 'contrato_eficaz',
    soloSiHipoteca: true,
    queDice: 'Cómo y cuándo se alza la hipoteca que pesa sobre el inmueble.',
    porQueImporta:
      'Prometer la venta de un inmueble hipotecado sin decir cómo se alza deja al comprador comprando la deuda. El 1554 Nº2 exige que el contrato prometido no sea de los que la ley declara ineficaces.',
    plantilla:
      'El promitente vendedor se obliga a alzar, a su costa y antes de la escritura de compraventa, la hipoteca que grava el inmueble a favor de {banco}, y a acompañar el certificado de gravámenes que acredite el alzamiento.',
  },
  {
    codigo: 'condicion_credito',
    titulo: 'Sujeta a aprobación del crédito',
    tipo: 'negociable',
    satisface: 'plazo_o_condicion',
    queDice: 'Que la compraventa sólo se exige si al comprador le aprueban el crédito.',
    porQueImporta:
      'Protege al comprador: si el banco rechaza, la promesa se deshace sin multa. Sin esta cláusula pierde el pie por algo que no controla.',
    plantilla:
      'La obligación de celebrar la compraventa queda sujeta a la condición suspensiva de que el banco apruebe al promitente comprador un crédito hipotecario por {monto}. Si al {fecha} el crédito no estuviere aprobado, la promesa quedará sin efecto y se restituirá lo pagado, sin multa para ninguna de las partes.',
  },
  {
    codigo: 'arras',
    titulo: 'Arras o señal',
    tipo: 'negociable',
    queDice: 'Qué pasa con lo pagado si alguien se arrepiente.',
    porQueImporta:
      'En el esquema simple, el comprador que se arrepiente pierde el pie y el vendedor que se arrepiente lo devuelve doblado. Conviene decir cuál de los dos esquemas rige.',
    plantilla:
      'Las partes acuerdan que lo pagado se entrega en arras. Si el promitente comprador desistiere, las perderá. Si desistiere el promitente vendedor, deberá restituirlas dobladas.',
  },
  {
    codigo: 'multa',
    titulo: 'Multa por incumplimiento',
    tipo: 'negociable',
    queDice: 'Cuánto paga quien no cumple.',
    porQueImporta:
      'Sin multa pactada el afectado queda sin herramienta para reclamar. En propiedades usadas se usa entre 5% y 10% del precio.',
    plantilla:
      'La parte que no cumpliere pagará a la otra, a título de multa, el {porcentaje}% del precio de la compraventa, sin perjuicio del derecho a exigir el cumplimiento forzado.',
  },
  {
    codigo: 'entrega',
    titulo: 'Entrega material del inmueble',
    tipo: 'negociable',
    queDice: 'Cuándo se entregan las llaves.',
    porQueImporta:
      'No es lo mismo que la escritura. Si no se dice, se discute después, y es la pelea más común entre las partes.',
    plantilla:
      'El inmueble se entregará materialmente al promitente comprador el día {fecha}, desocupado y libre de ocupantes.',
  },
  {
    codigo: 'gastos',
    titulo: 'Quién paga qué',
    tipo: 'negociable',
    queDice: 'Reparto de los gastos de notaría, Conservador y del crédito.',
    porQueImporta:
      'La costumbre reparte la notaría y el Conservador, pero los gastos del crédito son del comprador. Dejarlo escrito evita el reclamo al final.',
    plantilla:
      'Los gastos de la escritura de compraventa y de su inscripción en el Conservador se pagarán por mitades entre las partes. Los gastos del crédito hipotecario serán de cargo del promitente comprador.',
  },
  {
    codigo: 'estado_inmueble',
    titulo: 'Estado en que se recibe',
    tipo: 'negociable',
    queDice: 'Que el inmueble se entrega al día en contribuciones y gastos comunes.',
    porQueImporta:
      'Las contribuciones impagas siguen al inmueble, no al vendedor. Sin esta cláusula las hereda el comprador.',
    plantilla:
      'El promitente vendedor declara que el inmueble se encuentra al día en contribuciones y gastos comunes a la fecha de la escritura, y se obliga a mantenerlo así hasta entonces.',
  },
];

export const CLAUSULA_POR_CODIGO = new Map(CLAUSULAS.map((c) => [c.codigo, c]));

/** Las obligatorias que aplican a este caso. El alzamiento sólo si hay hipoteca. */
export function clausulasObligatorias(tieneHipoteca: boolean): DefinicionClausula[] {
  return CLAUSULAS.filter(
    (c) => c.tipo === 'obligatoria' && (!c.soloSiHipoteca || tieneHipoteca),
  );
}

/** Plazos de uso común, en días. No son reglas legales. */
export const PLAZOS_SUGERIDOS = {
  fondosPropios: 60,
  conCredito: 105,
};

export interface EstadoRequisito {
  codigo: string;
  numeral: string;
  exige: string;
  porQue: string;
  cumplido: boolean;
  falta: string | null;
}

export interface DatosParaVerificar {
  /** Toda promesa nace escrita acá: el requisito Nº1 se cumple por construcción. */
  tienePrecio: boolean;
  tieneFormaPago: boolean;
  tieneIndividualizacion: boolean;
  tienePlazoOCondicion: boolean;
  /** El vendedor declaró hipoteca y no hay alzamiento comprometido. */
  hipotecaSinResolver: boolean;
}

/**
 * Los cuatro requisitos, uno por uno, con lo que falta.
 *
 * Se devuelve el detalle y no un booleano porque decirle a alguien "tu promesa
 * es inválida" sin señalar qué falta lo deja igual de trabado.
 */
export function verificar1554(datos: DatosParaVerificar): EstadoRequisito[] {
  return REQUISITOS_1554.map((r) => {
    let cumplido = true;
    let falta: string | null = null;

    if (r.codigo === 'contrato_eficaz' && datos.hipotecaSinResolver) {
      cumplido = false;
      falta =
        'La propiedad tiene hipoteca declarada y la promesa no dice cómo se alza antes de la escritura.';
    }

    if (r.codigo === 'plazo_o_condicion' && !datos.tienePlazoOCondicion) {
      cumplido = false;
      falta = 'Falta la fecha límite para escriturar, o una condición que fije la época.';
    }

    if (r.codigo === 'contrato_especificado') {
      const faltantes: string[] = [];
      if (!datos.tieneIndividualizacion) faltantes.push('la individualización del inmueble');
      if (!datos.tienePrecio) faltantes.push('el precio');
      if (!datos.tieneFormaPago) faltantes.push('la forma de pago');
      if (faltantes.length > 0) {
        cumplido = false;
        falta = `Falta ${faltantes.join(', ')}.`;
      }
    }

    return { ...r, cumplido, falta };
  });
}

export function cumpleElArticulo(datos: DatosParaVerificar): boolean {
  return verificar1554(datos).every((r) => r.cumplido);
}

/**
 * Los marcadores de la plantilla que quedaron sin llenar.
 *
 * Una cláusula con `{fojas}` adentro no está especificada, y el 1554 Nº4 exige
 * justamente que lo esté. Por eso una cláusula con huecos no se puede aceptar
 * ni cuenta para los requisitos: firmar eso es firmar una promesa nula.
 */
export function marcadoresPendientes(texto: string): string[] {
  return [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
}

export function estaCompleta(texto: string): boolean {
  return marcadoresPendientes(texto).length === 0;
}
