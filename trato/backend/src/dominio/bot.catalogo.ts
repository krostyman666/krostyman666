/**
 * El bot que responde al comprador en la ficha de la propiedad.
 *
 * QUÉ CONTESTA Y QUÉ NO
 *
 * Contesta dos cosas: la publicación (metros, dormitorios, año, precio de
 * lista, modalidad de visita) y el proceso (cómo se agenda, qué trae el
 * informe, cómo funciona la comisión, qué es una promesa, por qué la escritura
 * va ante notario). Nada más.
 *
 * Todo lo que toque el estado legal del inmueble, su valor real, las deudas que
 * arrastra o un consejo sobre si conviene comprarlo, se deriva. No es prudencia
 * de más: en una compraventa esas frases son declaraciones materiales. Decir
 * "no tiene hipoteca" y que sí la tenga no es un bot equivocado, es
 * responsabilidad civil por el perjuicio y publicidad engañosa bajo la Ley
 * 19.496, que llega a 1.500 UTM y considera engañosa también la inducción a
 * error por omisión o ambigüedad.
 *
 * POR QUÉ LAS RESPUESTAS NO LAS ESCRIBE UN MODELO
 *
 * El texto que lee el comprador sale siempre de acá: o es una constante, o lo
 * arma `responde()` con campos que están guardados. Ninguna frase se genera.
 * Un modelo generativo no puede garantizar que no afirme un hecho que nadie
 * verificó, y acá el costo de esa afirmación lo paga el comprador en la
 * escritura.
 *
 * Eso deja un solo lugar donde un modelo sí ayuda y es seguro: clasificar la
 * pregunta dentro de este conjunto cerrado de temas, o sea reemplazar
 * `detectarIntencion` del servicio. Una clasificación errada devuelve una
 * respuesta cierta pero fuera de lugar, o una derivación. Nunca una mentira.
 *
 * LA ASIMETRÍA DE LA HIPOTECA
 *
 * `Propiedad.tieneHipoteca` existe, y aun así el bot no responde "no tiene
 * hipoteca". Las dos direcciones no valen lo mismo:
 *
 *   - Que el vendedor declare que SÍ hay hipoteca es una advertencia. Callarla
 *     sería omitir algo que el comprador necesita, así que se dice, etiquetada
 *     como declaración del vendedor.
 *   - Que no la haya declarado NO es un certificado de que no exista. Quien
 *     puede decir eso es el Conservador, en el certificado de hipotecas,
 *     gravámenes y prohibiciones. Ahí el bot deriva al informe.
 *
 * La misma asimetría vale para deudas, embargos y prohibiciones: lo que suma
 * riesgo se informa, lo que lo descarta se certifica.
 */

import { formatearMonto } from '../utils/formato';

/** Dónde manda el bot lo que no le corresponde contestar. */
export const DESTINOS = ['informe', 'visita', 'persona'] as const;
export type Destino = (typeof DESTINOS)[number];

export const ETIQUETA_DESTINO: Record<Destino, string> = {
  informe: 'Informe del inmueble',
  visita: 'Visita con un asesor',
  persona: 'Un asesor te responde',
};

/** De dónde sale lo que afirma la respuesta. Va a la vista, no en el código. */
export const FUENTES = ['vendedor', 'plataforma', 'ley'] as const;
export type Fuente = (typeof FUENTES)[number];

export const ETIQUETA_FUENTE: Record<Fuente, string> = {
  vendedor: 'Lo declaró el vendedor',
  plataforma: 'Dato de Trato',
  ley: 'Así funciona el trámite en Chile',
};

/** Duplicado a propósito de `frontend/src/lib/comision.ts`: la tasa es la misma
 * decisión comercial y el IVA es legal. Se unifican en `shared/` cuando exista. */
export const TASA_COMISION = 0.01;
export const IVA = 0.19;

export interface Respuesta {
  texto: string;
  fuente: Fuente;
  /** Si viene, la respuesta además empuja al comprador a este paso. */
  destino?: Destino;
}

/** Lo que el bot necesita saber de la propiedad. Es la ficha pública y nada
 * más: los mismos campos que `obtenerPublica`, sin foja, rol ni expediente. */
export interface ContextoBot {
  tipo: string;
  comuna: string;
  region: string;
  precio: number;
  moneda: 'clp' | 'uf';
  dormitorios: number | null;
  banos: number | null;
  superficieTotal: number | null;
  superficieConstruida: number | null;
  estacionamientos: number;
  bodegas: number;
  anoConstruccion: number | null;
  tieneHipoteca: boolean;
  visitantesPorCupo: number;
  estado: string;
  /** Cupos de visita libres en la ventana que se ofrece hoy. */
  cuposLibres: number;
  /** Precio vigente del informe de títulos, en pesos. */
  precioInformeClp: number;
  plazoInformeHabiles: { minimo: number; maximo: number };
}

interface Reconocible {
  codigo: string;
  /**
   * Cómo lo pregunta la gente. Se buscan como subcadena sobre el texto
   * normalizado, sin límite de palabra: así "metro" toma también "metros" y
   * "cuadrados" toma "mt2 cuadrados", que es como se escribe en la práctica.
   * El costo es algún falso positivo, y un falso positivo acá devuelve una
   * respuesta cierta sobre otro tema, no una afirmación falsa.
   */
  frases: string[];
}

export interface Tema extends Reconocible {
  /** Qué pregunta contesta, para la lista de sugerencias de la UI. */
  ejemplo: string;
  /** Se ofrece como sugerencia en la ficha. */
  sugerido?: boolean;
  responde(ctx: ContextoBot): Respuesta;
}

/**
 * Materias que el bot no contesta aunque tenga el dato a mano. Se evalúan
 * antes que los temas y siempre derivan: son el límite que hace que este bot
 * se pueda poner en producción.
 */
export interface ZonaReservada extends Reconocible {
  destino: Destino;
  /** Por qué está acá. Para quien lea el código, no para el comprador. */
  porque: string;
  /**
   * Temas que esta zona tapa cuando ambos calzan. "Avalúo" cae en `valor_real`
   * y también rozaría `precio`: si la zona reservada actuó, poner al lado la
   * respuesta suelta del tema desdibuja el límite. Sin esto los dos conviven.
   */
  subsume?: string[];
  responde(ctx: ContextoBot): Respuesta;
}

// ---------------------------------------------------------------------------
// Zonas reservadas
// ---------------------------------------------------------------------------

export const ZONAS_RESERVADAS: ZonaReservada[] = [
  {
    codigo: 'estado_legal',
    frases: [
      'hipoteca',
      'hipotecad',
      'gravamen',
      'gravamenes',
      'embargo',
      'prohibicion',
      'litigio',
      'juicio',
      'demanda',
      'quien es el dueno',
      'a nombre de quien',
      'dueno inscrito',
      'titulo',
      'titulos',
      'inscripcion',
      'conservador',
      'expropiacion',
      'expropiad',
      'esta saneada',
      'sin problemas legales',
      'papeles en regla',
      'papeles al dia',
      'esta regularizada',
      'posesion efectiva',
      'herencia',
    ],
    destino: 'informe',
    porque:
      'Afirmar el estado legal de un inmueble es una declaración material en la compraventa. Lo certifica el Conservador, no nosotros.',
    responde(ctx) {
      // Asimetría: la hipoteca declarada se informa; la no declarada no se
      // desmiente. Ver el encabezado del archivo.
      const declarada = ctx.tieneHipoteca
        ? 'El vendedor declaró que la propiedad tiene una hipoteca, y nosotros gestionamos su alzamiento como parte de la operación. '
        : '';
      return {
        texto:
          `${declarada}El resto del estado legal —dueño inscrito, gravámenes, embargos y prohibiciones— no te lo puedo afirmar yo: lo certifica el Conservador de Bienes Raíces del territorio, y viene en el informe del inmueble. ` +
          `Lo tienes en ${ctx.plazoInformeHabiles.minimo} a ${ctx.plazoInformeHabiles.maximo} días hábiles por ${formatearMonto(ctx.precioInformeClp, 'clp')}.`,
        fuente: ctx.tieneHipoteca ? 'vendedor' : 'ley',
        destino: 'informe',
      };
    },
  },
  {
    codigo: 'deudas',
    frases: [
      'deuda',
      'deudas',
      'debe',
      'moroso',
      'contribucion',
      'contribuciones',
      'impuesto territorial',
      'gastos comunes impagos',
      'debe gastos comunes',
      'al dia con',
      'dividendo',
    ],
    destino: 'informe',
    porque:
      'La deuda de contribuciones y la de gastos comunes siguen al inmueble, no al vendedor: las termina pagando el comprador. Van certificadas.',
    subsume: ['gastos_comunes'],
    responde(ctx) {
      return {
        texto:
          'Las deudas que arrastra una propiedad las paga quien la compra, no quien la vendió: las contribuciones siguen al inmueble, y bajo la Ley 21.442 el certificado de deuda de gastos comunes es título ejecutivo, o sea se cobra directo. ' +
          `Por eso no te las declaro de memoria: van certificadas por la Tesorería y por el administrador en el informe del inmueble, por ${formatearMonto(ctx.precioInformeClp, 'clp')}.`,
        fuente: 'ley',
        destino: 'informe',
      };
    },
  },
  {
    codigo: 'valor_real',
    frases: [
      'cuanto vale realmente',
      'esta caro',
      'esta barato',
      'vale la pena',
      'buen precio',
      'precio justo',
      'tasacion',
      'tasa',
      'avaluo',
      'negociable',
      'rebaja',
      'aceptaria',
      'me lo deja en',
      'hacer una oferta menor',
      'bajar el precio',
    ],
    destino: 'persona',
    porque:
      'Opinar sobre el precio es una recomendación en la que el comprador se apoya para decidir. Y el margen de negociación lo fija el vendedor, no nosotros.',
    subsume: ['precio'],
    responde(ctx) {
      return {
        texto:
          `El precio publicado es ${formatearMonto(ctx.precio, ctx.moneda)}. Si vale más o menos que eso no te lo puedo decir yo: no tasamos, y una opinión mía no te sirve para decidir una compra. ` +
          'Lo que sí tienes es el avalúo fiscal en el informe, que es la referencia del Estado y no es tasación comercial. Si quieres ofertar por otro monto, lo conversa un asesor con el vendedor.',
        fuente: 'plataforma',
        destino: 'persona',
      };
    },
  },
  {
    codigo: 'consejo',
    frases: [
      'me conviene',
      'que me recomiendas',
      'tu que harias',
      'es buena inversion',
      'deberia comprar',
      'que pasa si no',
      'me puede demandar',
      'puedo demandar',
      'como me protejo',
      'es seguro comprar',
      'riesgo',
      'estafa',
      'me pueden estafar',
    ],
    destino: 'persona',
    porque:
      'Recomendar una compra o anticipar consecuencias jurídicas es asesoría. La da una persona que responde por ella.',
    responde() {
      return {
        texto:
          'Esa la contesta una persona, no yo. Puedo explicarte cómo funciona cada paso del proceso, pero si conviene o no, o qué pasa si algo sale mal, es asesoría y la tiene que dar alguien que responda por lo que dice. Te pongo en contacto con un asesor y, si es materia legal, con el abogado del equipo.',
        fuente: 'plataforma',
        destino: 'persona',
      };
    },
  },
  {
    codigo: 'contacto_vendedor',
    frases: [
      'telefono del dueno',
      'numero del dueno',
      'contacto del dueno',
      'hablar con el dueno',
      'hablar directamente',
      'correo del vendedor',
      'quien vende',
      'por que vende',
      'por que la vende',
      'whatsapp del',
      'datos del vendedor',
    ],
    destino: 'persona',
    porque:
      'Son datos personales del vendedor y además el motivo de venta es información de negociación. La coordinación pasa por la plataforma, que es lo que el vendedor contrató.',
    responde() {
      return {
        texto:
          'Los datos de contacto del vendedor no los entrego: son datos personales suyos y él nos encargó a nosotros la coordinación. Todo lo que necesites preguntarle se lo lleva un asesor y te trae la respuesta. En la visita lo conoces si él quiere estar.',
        fuente: 'plataforma',
        destino: 'persona',
      };
    },
  },
  {
    codigo: 'direccion_exacta',
    frases: [
      'direccion exacta',
      'cual es la direccion',
      'en que calle',
      'que calle',
      'numero de la casa',
      'donde queda exactamente',
      'altura',
    ],
    destino: 'visita',
    porque:
      'Si la dirección va en la página pública, cualquiera llega al vendedor por fuera. Se entrega con la visita confirmada, igual que en el mapa.',
    responde(ctx) {
      return {
        texto:
          `La propiedad está en ${ctx.comuna}, ${ctx.region}, y en el mapa te marco el sector. La dirección exacta te la mandamos cuando la visita queda confirmada, junto con la hora y el nombre del asesor que te va a mostrar.`,
        fuente: 'plataforma',
        destino: 'visita',
      };
    },
  },
];

// ---------------------------------------------------------------------------
// Temas que sí contesta
// ---------------------------------------------------------------------------

function faltaDato(que: string, destino: Destino = 'persona'): Respuesta {
  return {
    texto: `${que} no lo tengo declarado en esta publicación, así que no te lo voy a inventar. Se lo preguntamos al vendedor y te respondemos.`,
    fuente: 'plataforma',
    destino,
  };
}

export const TEMAS: Tema[] = [
  {
    codigo: 'superficie',
    ejemplo: '¿Cuántos metros tiene?',
    sugerido: true,
    frases: [
      'metro',
      'metros',
      'm2',
      'mt2',
      'mts',
      'cuadrados',
      'superficie',
      'tamano',
      'que tan grande',
      'terreno',
      'construido',
    ],
    responde(ctx) {
      const partes: string[] = [];
      if (ctx.superficieConstruida) {
        partes.push(`${formatearMetros(ctx.superficieConstruida)} construidos`);
      }
      if (ctx.superficieTotal) {
        partes.push(`${formatearMetros(ctx.superficieTotal)} de terreno`);
      }
      if (partes.length === 0) return faltaDato('La superficie');
      return {
        texto: `Tiene ${partes.join(' y ')}. Es lo que declaró el vendedor al publicar; en la visita lo ves con el asesor y en el informe aparece la superficie que registra el SII.`,
        fuente: 'vendedor',
      };
    },
  },
  {
    codigo: 'distribucion',
    ejemplo: '¿Cuántos dormitorios y baños tiene?',
    sugerido: true,
    frases: [
      'dormitorio',
      'dormitorios',
      'habitacion',
      'pieza',
      'piezas',
      'cuarto',
      'bano',
      'banos',
      'bao',
      'cuantos ambientes',
      'distribucion',
    ],
    responde(ctx) {
      if (ctx.dormitorios === null && ctx.banos === null) {
        return faltaDato('La distribución');
      }
      const partes: string[] = [];
      if (ctx.dormitorios !== null) {
        partes.push(`${ctx.dormitorios} ${ctx.dormitorios === 1 ? 'dormitorio' : 'dormitorios'}`);
      }
      if (ctx.banos !== null) {
        partes.push(`${ctx.banos} ${ctx.banos === 1 ? 'baño' : 'baños'}`);
      }
      return { texto: `Tiene ${partes.join(' y ')}.`, fuente: 'vendedor' };
    },
  },
  {
    codigo: 'estacionamiento',
    ejemplo: '¿Tiene estacionamiento y bodega?',
    sugerido: true,
    frases: [
      'estacionamiento',
      'estacionamientos',
      'garage',
      'garaje',
      'auto',
      'bodega',
      'bodegas',
    ],
    responde(ctx) {
      const e = ctx.estacionamientos;
      const b = ctx.bodegas;
      if (e === 0 && b === 0) {
        return {
          texto:
            'En la publicación no hay estacionamiento ni bodega declarados. Si el edificio o el condominio tiene alguno disponible aparte, eso se lo consultamos al vendedor.',
          fuente: 'vendedor',
          destino: 'persona',
        };
      }
      const partes: string[] = [];
      if (e > 0) partes.push(`${e} ${e === 1 ? 'estacionamiento' : 'estacionamientos'}`);
      if (b > 0) partes.push(`${b} ${b === 1 ? 'bodega' : 'bodegas'}`);
      return {
        texto: `Incluye ${partes.join(' y ')}. En la escritura conviene revisar si van con rol propio, porque eso cambia cómo se transfieren; el informe lo aclara.`,
        fuente: 'vendedor',
      };
    },
  },
  {
    codigo: 'antiguedad',
    ejemplo: '¿De qué año es?',
    frases: ['ano de construccion', 'que ano', 'antiguedad', 'antigua', 'nueva', 'cuantos anos tiene'],
    responde(ctx) {
      if (ctx.anoConstruccion === null) return faltaDato('El año de construcción');
      const anos = new Date().getFullYear() - ctx.anoConstruccion;
      return {
        texto: `El vendedor declaró que se construyó el ${ctx.anoConstruccion}, o sea ${anos} ${anos === 1 ? 'año' : 'años'}. Si hubo ampliaciones después, lo que importa es que tengan recepción municipal: eso va verificado en el informe.`,
        fuente: 'vendedor',
      };
    },
  },
  {
    codigo: 'precio',
    ejemplo: '¿Cuánto cuesta y qué significa el precio en UF?',
    sugerido: true,
    frases: ['cuanto cuesta', 'cuanto sale', 'precio', 'valor', 'cuanto piden', 'en pesos', 'uf'],
    responde(ctx) {
      const enUf =
        ctx.moneda === 'uf'
          ? ' La UF cambia todos los días, así que el equivalente en pesos se fija recién al momento de pagar, no hoy.'
          : '';
      return {
        texto: `El precio publicado es ${formatearMonto(ctx.precio, ctx.moneda)}.${enUf}`,
        fuente: 'vendedor',
      };
    },
  },
  {
    codigo: 'gastos_comunes',
    ejemplo: '¿Cuánto son los gastos comunes?',
    frases: ['gasto comun', 'gastos comunes', 'administracion mensual', 'condominio cobra'],
    responde(ctx) {
      const esComunidad = ctx.tipo === 'departamento' || ctx.tipo === 'oficina';
      if (!esComunidad) {
        return {
          texto:
            'Esta propiedad no está publicada como parte de un condominio o edificio, así que no debería tener gastos comunes. Si igual hay una cuota de comunidad, lo confirmamos con el vendedor.',
          fuente: 'vendedor',
          destino: 'persona',
        };
      }
      return {
        texto:
          'El monto mensual no está declarado en la publicación y no te lo voy a estimar. Lo pedimos al administrador junto con el certificado de deuda de gastos comunes, que va en el informe del inmueble: ahí sale cuánto se paga y si hay algo pendiente.',
        fuente: 'plataforma',
        destino: 'informe',
      };
    },
  },
  {
    codigo: 'visita',
    ejemplo: '¿Cómo agendo una visita?',
    sugerido: true,
    frases: [
      'visita',
      'visitar',
      'ver la propiedad',
      'conocerla',
      'ir a verla',
      'agendar',
      'agenda',
      'cuando puedo',
      'horario',
      'hora disponible',
    ],
    responde(ctx) {
      const modalidad =
        ctx.visitantesPorCupo > 1
          ? `El vendedor la muestra en formato abierto: hasta ${ctx.visitantesPorCupo} personas en el mismo bloque.`
          : 'El vendedor la muestra de a un comprador por bloque.';
      const cupos =
        ctx.cuposLibres > 0
          ? `Hay ${ctx.cuposLibres} ${ctx.cuposLibres === 1 ? 'bloque disponible' : 'bloques disponibles'} en las próximas dos semanas.`
          : 'Ahora mismo no hay bloques abiertos; se liberan cuando el vendedor declara nuevos horarios.';
      return {
        texto: `Agendas acá mismo, en el recuadro de visitas: eliges el bloque y te confirmamos con la dirección exacta. Cada visita dura 45 minutos y la muestra un asesor de Trato, no el vendedor. ${modalidad} ${cupos}`,
        fuente: 'plataforma',
        destino: 'visita',
      };
    },
  },
  {
    codigo: 'comision',
    ejemplo: '¿Cuánto cobran de comisión?',
    sugerido: true,
    frases: [
      'comision',
      'cuanto cobran',
      'cuanto me cobran',
      'cobran ustedes',
      'es gratis',
      'tiene costo para mi',
      'corretaje',
    ],
    responde(ctx) {
      const neto = ctx.precio * TASA_COMISION;
      return {
        texto:
          `Cobramos 1% + IVA sobre el precio de venta, donde un corredor cobra entre 2% y 5% + IVA. Sobre ${formatearMonto(ctx.precio, ctx.moneda)} eso es ${formatearMonto(neto, ctx.moneda)} + IVA. ` +
          'Lo que pagas aparte es el informe del inmueble, si lo pides, y los costos propios del trámite: notaría, Conservador y, si compras con crédito, lo que cobre el banco.',
        fuente: 'plataforma',
      };
    },
  },
  {
    codigo: 'costos_cierre',
    ejemplo: '¿Qué gastos hay además del precio?',
    frases: [
      'gastos de notaria',
      'notaria cuesta',
      'gastos operacionales',
      'cuanto cuesta escriturar',
      'gastos de la compra',
      'quien paga',
      'impuesto',
    ],
    responde() {
      return {
        texto:
          'Además del precio hay tres cosas: la escritura en la notaría, la inscripción en el Conservador de Bienes Raíces y, si compras con crédito, los gastos operacionales del banco (tasación, estudio de títulos del banco y su propio seguro). Cómo se reparten entre comprador y vendedor no lo fija la ley: se acuerda, y queda escrito en la promesa. En el informe te entregamos el detalle con montos del territorio donde está la propiedad.',
        fuente: 'ley',
        destino: 'informe',
      };
    },
  },
  {
    codigo: 'informe',
    ejemplo: '¿Qué trae el informe del inmueble?',
    sugerido: true,
    frases: [
      'informe',
      'reporte',
      'que incluye el informe',
      'autofact',
      'antecedentes',
      'estudio de titulos cuesta',
      'cuanto cuesta el informe',
    ],
    responde(ctx) {
      return {
        texto:
          'Va en dos niveles. El gratis es inmediato y trae identificación del inmueble, avalúo fiscal, contribuciones, avance de los papeles y los costos de la operación; dice además, con todas sus letras, qué no es. ' +
          `El pagado cuesta ${formatearMonto(ctx.precioInformeClp, 'clp')} y suma lo que hay que comprar y esperar: la carpeta de títulos del Conservador de los últimos 10 años con dueño inscrito, hipotecas, gravámenes y prohibiciones, los certificados de no expropiación y la regularización de lo construido. ` +
          `Demora ${ctx.plazoInformeHabiles.minimo} a ${ctx.plazoInformeHabiles.maximo} días hábiles porque los certificados se piden en el Conservador del territorio y no hay forma de sacarlos al instante. Si además lo firma un abogado del equipo, pasa a ser un estudio de títulos y lleva su conclusión y su responsabilidad.`,
        fuente: 'plataforma',
        destino: 'informe',
      };
    },
  },
  {
    codigo: 'promesa',
    ejemplo: '¿Qué es la promesa de compraventa?',
    frases: ['promesa', 'prometer', 'reservar la propiedad', 'pie', 'arras', 'apartarla', 'congelar el precio'],
    responde() {
      return {
        texto:
          'Es el contrato con que las dos partes se comprometen a firmar la compraventa más adelante, típicamente mientras sale el crédito. Se redacta acá: el vendedor y tú proponen y aceptan cada cláusula —precio y forma de pago, plazo, multa, entrega, quién paga qué— y ninguna queda acordada si la otra parte no la aceptó. ' +
          'El artículo 1554 del Código Civil le pone cuatro requisitos y si falta uno la promesa es nula, así que el sistema no deja cerrarla hasta que los cuatro estén cumplidos. Antes de la firma la revisa un abogado.',
        fuente: 'ley',
      };
    },
  },
  {
    codigo: 'escritura',
    ejemplo: '¿Cómo se firma al final?',
    frases: [
      'escritura',
      'firmar',
      'firma electronica',
      'notario',
      'como se cierra',
      'cuando queda a mi nombre',
      'inscribir',
    ],
    responde() {
      return {
        texto:
          'La compraventa de un inmueble va por escritura pública ante notario: lo exige la ley y no se puede reemplazar por una firma electrónica. Después la escritura se inscribe en el Conservador de Bienes Raíces, y recién con esa inscripción la propiedad queda a tu nombre. Nosotros coordinamos la notaría, seguimos la inscripción y te avisamos cuando está. La promesa sí se puede firmar electrónicamente.',
        fuente: 'ley',
      };
    },
  },
  {
    codigo: 'credito',
    ejemplo: '¿Puedo comprar con crédito hipotecario?',
    frases: [
      'credito',
      'hipotecario',
      'banco',
      'financiar',
      'financiamiento',
      'preaprobado',
      'pie inicial',
      'cuanto necesito de pie',
    ],
    responde() {
      return {
        texto:
          'Sí, la mayoría compra así. Lo que cambia es el plazo: con fondos propios la promesa se cierra en unos 60 días y con crédito conviene dar 90 a 120, porque el banco hace su propia tasación y su propio estudio de títulos. Por eso la promesa suele llevar una cláusula que la deja sin efecto si el crédito no sale. Nosotros no vendemos créditos ni los tramitamos: eso lo ves con tu banco.',
        fuente: 'ley',
        destino: 'persona',
      };
    },
  },
  {
    codigo: 'que_es_trato',
    ejemplo: '¿Ustedes son corredores?',
    frases: [
      'son corredores',
      'corredor',
      'quienes son',
      'que es trato',
      'como funciona trato',
      'trato directo',
      'como funciona esto',
    ],
    responde() {
      return {
        texto:
          'No somos corredores. Esta propiedad la publica su dueño y nosotros gestionamos la operación completa: las visitas las muestra un asesor nuestro con sueldo fijo, los papeles y certificados los reunimos y los valida una notaría, la promesa se negocia en la plataforma y la escritura la coordinamos ante notario. Por eso la comisión es 1% + IVA y no 2% a 5%.',
        fuente: 'plataforma',
      };
    },
  },
  {
    codigo: 'disponible',
    ejemplo: '¿Sigue disponible?',
    frases: ['sigue disponible', 'esta disponible', 'ya se vendio', 'todavia esta', 'se vendio'],
    responde(ctx) {
      if (ctx.estado === 'vendida') {
        return { texto: 'Esta propiedad ya se vendió. La publicación queda visible como referencia.', fuente: 'plataforma' };
      }
      if (ctx.estado === 'reservada') {
        return {
          texto:
            'Está reservada: hay una promesa en curso. Todavía puedes agendar una visita y dejar tu interés, porque si esa operación no prospera la propiedad vuelve a quedar disponible.',
          fuente: 'plataforma',
          destino: 'visita',
        };
      }
      return {
        texto: 'Sí, está disponible y se puede visitar. Agendas el bloque acá mismo.',
        fuente: 'plataforma',
        destino: 'visita',
      };
    },
  },
];

export const TEMA_POR_CODIGO = new Map(TEMAS.map((t) => [t.codigo, t]));

/** Las que se ofrecen como botón en la ficha, para que el comprador no parta de una caja vacía. */
export const SUGERIDAS = TEMAS.filter((t) => t.sugerido).map((t) => ({
  codigo: t.codigo,
  pregunta: t.ejemplo,
}));

/** Cuando no se reconoce nada. Decir "no entendí" y derivar es mejor que adivinar. */
export function noEntendido(): Respuesta {
  return {
    texto:
      'Esa no la sé contestar. Manejo lo de la publicación —metros, distribución, precio, visitas— y cómo funciona el proceso: informe, promesa, escritura y comisión. Cualquier otra cosa se la paso a un asesor, que te responde.',
    fuente: 'plataforma',
    destino: 'persona',
  };
}

function formatearMetros(valor: number): string {
  return `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(valor)} m²`;
}
