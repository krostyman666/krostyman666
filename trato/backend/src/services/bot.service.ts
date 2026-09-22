import { Op } from 'sequelize';
import { MensajeBot } from '../models/MensajeBot';
import { Propiedad } from '../models/Propiedad';
import { Usuario } from '../models/Usuario';
import { ErrorApi } from '../utils/ErrorApi';
import { env } from '../config/env';
import { cuposDisponibles } from './visitas.service';
import { PLAZO_TITULOS_HABILES } from '../dominio/informe.catalogo';
import {
  ETIQUETA_DESTINO,
  ETIQUETA_FUENTE,
  TEMAS,
  ZONAS_RESERVADAS,
  noEntendido,
  type ContextoBot,
  type Destino,
  type Respuesta,
  type Tema,
  type ZonaReservada,
} from '../dominio/bot.catalogo';

/** Cuántas respuestas se emiten por pregunta. Más de dos y deja de ser una
 * respuesta: es un folleto, y el comprador no lo lee. */
const MAX_RESPUESTAS = 2;

const LARGO_MAXIMO_PREGUNTA = 500;

/**
 * Normaliza para comparar: minúsculas, sin tildes y sin puntuación.
 *
 * La ñ se mapea a n a propósito, junto con las tildes. Nadie escribe "baño"
 * con ñ en un buscador apurado, y el catálogo tiene las frases ya normalizadas
 * del mismo modo.
 */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface Coincidencia<T> {
  item: T;
  /** Cuántas frases del ítem aparecieron. */
  aciertos: number;
  /** Largo de la frase más específica que calzó. Desempata. */
  especificidad: number;
}

function coincidencias<T extends { frases: string[] }>(
  texto: string,
  items: T[],
): Coincidencia<T>[] {
  return items
    .map((item) => {
      const calzadas = item.frases.filter((f) => texto.includes(f));
      return {
        item,
        aciertos: calzadas.length,
        especificidad: calzadas.reduce((max, f) => Math.max(max, f.length), 0),
      };
    })
    .filter((c) => c.aciertos > 0)
    .sort((a, b) => b.especificidad - a.especificidad || b.aciertos - a.aciertos);
}

export interface Intencion {
  zonas: ZonaReservada[];
  temas: Tema[];
}

/**
 * De la pregunta a los temas del catálogo.
 *
 * Es el único punto difuso del bot y el único lugar donde tendría sentido
 * poner un modelo: clasificar dentro de este conjunto cerrado. Las respuestas
 * no se generan nunca (ver el encabezado de `bot.catalogo.ts`), así que una
 * clasificación errada devuelve una respuesta cierta sobre otro tema, o una
 * derivación, pero no una afirmación falsa sobre el inmueble.
 *
 * Las zonas reservadas se evalúan aparte y ganan: una pregunta que toca el
 * estado legal se contesta con el límite, aunque también pregunte los metros.
 * Poner al lado una respuesta segura de sí desdibujaría justo el mensaje que
 * tiene que quedar claro.
 */
export function detectarIntencion(pregunta: string): Intencion {
  const texto = normalizar(pregunta);

  const zonas = coincidencias(texto, ZONAS_RESERVADAS).map((c) => c.item);
  const subsumidos = new Set(zonas.flatMap((z) => z.subsume ?? []));

  const temas = coincidencias(texto, TEMAS)
    .map((c) => c.item)
    .filter((t) => !subsumidos.has(t.codigo));

  return { zonas, temas };
}

/**
 * Lo que el bot sabe de la propiedad: la ficha pública y nada más.
 *
 * No recibe el expediente ni los antecedentes de inscripción, y no es un
 * olvido. Si el bot pudiera leerlos, regalaría lo que el comprador paga en el
 * informe y expondría datos del vendedor que necesitan su autorización
 * expresa. El límite queda en el tipo, no en la disciplina de quien escriba el
 * próximo tema.
 */
export async function contextoDe(propiedadId: string): Promise<ContextoBot> {
  const propiedad = await Propiedad.findByPk(propiedadId);
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
  if (!['publicada', 'reservada', 'vendida'].includes(propiedad.estado)) {
    throw ErrorApi.noEncontrado('Propiedad no encontrada');
  }

  const dias = await cuposDisponibles(propiedadId);
  const cuposLibres = dias.reduce(
    (total, d) => total + d.cupos.filter((c) => c.ocupados < c.lugares).length,
    0,
  );

  return {
    tipo: propiedad.tipo,
    comuna: propiedad.comuna,
    region: propiedad.region,
    precio: propiedad.precio,
    moneda: propiedad.moneda,
    dormitorios: propiedad.dormitorios,
    banos: propiedad.banos,
    superficieTotal: propiedad.superficieTotal === null ? null : Number(propiedad.superficieTotal),
    superficieConstruida:
      propiedad.superficieConstruida === null ? null : Number(propiedad.superficieConstruida),
    estacionamientos: propiedad.estacionamientos,
    bodegas: propiedad.bodegas,
    anoConstruccion: propiedad.anoConstruccion,
    tieneHipoteca: propiedad.tieneHipoteca,
    visitantesPorCupo: propiedad.visitantesPorCupo,
    estado: propiedad.estado,
    cuposLibres,
    precioInformeClp: env.precioInformeTitulosClp,
    plazoInformeHabiles: PLAZO_TITULOS_HABILES,
  };
}

export interface RespuestaVisible extends Respuesta {
  etiquetaFuente: string;
  /** Código del tema o de la zona que la produjo. Para medir, no para mostrar. */
  origen: string;
}

export interface Contestacion {
  id: string;
  pregunta: string;
  respuestas: RespuestaVisible[];
  entendido: boolean;
  destino: Destino | null;
  etiquetaDestino: string | null;
  /** Verdadero cuando la pregunta tocó algo que el bot no afirma por sí mismo. */
  derivada: boolean;
}

export async function responder(
  propiedadId: string,
  pregunta: string,
  usuarioId: string | null,
  sesion: string,
): Promise<Contestacion> {
  const limpia = pregunta.trim().slice(0, LARGO_MAXIMO_PREGUNTA);
  if (limpia.length === 0) {
    throw ErrorApi.solicitudInvalida('Escribe tu pregunta', 'pregunta_vacia');
  }

  const ctx = await contextoDe(propiedadId);
  const { zonas, temas } = detectarIntencion(limpia);

  const deZonas: RespuestaVisible[] = zonas.map((z) => ({
    ...z.responde(ctx),
    origen: z.codigo,
    etiquetaFuente: '',
  }));
  const deTemas: RespuestaVisible[] = temas.map((t) => ({
    ...t.responde(ctx),
    origen: t.codigo,
    etiquetaFuente: '',
  }));

  const entendido = zonas.length > 0 || temas.length > 0;
  const respuestas = entendido
    ? [...deZonas, ...deTemas].slice(0, MAX_RESPUESTAS)
    : [{ ...noEntendido(), origen: 'sin_reconocer', etiquetaFuente: '' }];

  for (const r of respuestas) r.etiquetaFuente = ETIQUETA_FUENTE[r.fuente];

  // El destino de la zona manda sobre el del tema: lo que el bot no contestó
  // es lo que el comprador tiene que ir a buscar.
  const destino =
    deZonas.find((r) => r.destino)?.destino ?? respuestas.find((r) => r.destino)?.destino ?? null;

  const fila = await MensajeBot.create({
    propiedadId,
    usuarioId,
    sesion,
    pregunta: limpia,
    respuesta: respuestas.map((r) => r.texto).join('\n\n'),
    temas: temas.map((t) => t.codigo),
    zonas: zonas.map((z) => z.codigo),
    destino,
    entendido,
  });

  return {
    id: fila.id,
    pregunta: limpia,
    respuestas,
    entendido,
    destino,
    etiquetaDestino: destino ? ETIQUETA_DESTINO[destino] : null,
    derivada: zonas.length > 0 || !entendido,
  };
}

/**
 * El hilo de una conversación. Se pide por sesión y no por usuario porque el
 * bot contesta sin login: la sesión la genera el navegador y agrupa lo que esa
 * pestaña preguntó, sin identificar a nadie.
 */
export async function historial(
  propiedadId: string,
  sesion: string,
): Promise<MensajeBot[]> {
  return MensajeBot.findAll({
    where: { propiedadId, sesion },
    order: [['createdAt', 'ASC']],
    limit: 50,
  });
}

/**
 * Lo que quedó esperando a una persona, en dos listas por MOTIVO, no por
 * urgencia: las dos hay que atenderlas.
 *
 * Toda pregunta no entendida deriva a persona, así que "no entendida" es un
 * subconjunto de "derivada a persona". Partir por atención dejaría la segunda
 * lista siempre vacía. Se parte por la razón de la derivación, que es lo que
 * dice qué hacer con cada una:
 *
 *   - `derivaciones`: el bot SÍ entendió y aun así no contestó —precio, estado
 *     legal, contacto del vendedor—. Es el límite funcionando; sólo falta que
 *     una persona cierre con el comprador.
 *   - `sinEntender`: el bot NO entendió. También hay que responderle al
 *     comprador, y además es la lista de temas que al catálogo le faltan.
 *
 * Así cada mensaje cae en exactamente una, las dos tienen contenido, y la
 * sección en que aparece explica por qué está ahí.
 */
export async function pendientes() {
  const comun = {
    include: [
      { model: Propiedad, as: 'propiedad', attributes: ['id', 'titulo', 'comuna'] },
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'],
      },
    ],
    order: [['createdAt', 'ASC']] as [string, string][],
    limit: 100,
  };

  const [derivaciones, sinEntender] = await Promise.all([
    MensajeBot.findAll({
      where: { destino: 'persona', entendido: true, atendidoEn: null },
      ...comun,
    }),
    MensajeBot.findAll({
      where: { entendido: false, atendidoEn: null },
      ...comun,
    }),
  ]);

  return { derivaciones, sinEntender };
}

export async function atender(
  mensajeId: string,
  asesorId: string,
  nota: string,
): Promise<MensajeBot> {
  const mensaje = await MensajeBot.findByPk(mensajeId);
  if (!mensaje) throw ErrorApi.noEncontrado('Mensaje no encontrado');
  if (mensaje.atendidoEn) {
    throw ErrorApi.conflicto('Esta pregunta ya fue atendida', 'ya_atendida');
  }

  return mensaje.update({
    atendidoEn: new Date(),
    atendidoPorId: asesorId,
    notaInterna: nota,
  });
}

/**
 * Cómo le está yendo al bot.
 *
 * La cifra que importa es `sinEntender`: mientras suba, el catálogo va
 * quedando corto. `derivadas` no es una falla —derivar es lo que el bot debe
 * hacer con el estado legal— pero si se dispara, el embudo hacia el informe
 * está haciendo su trabajo o el catálogo está siendo demasiado prudente.
 */
export async function resumen(desde?: Date) {
  const where = desde ? { createdAt: { [Op.gte]: desde } } : {};

  const [total, noEntendidas, derivadas, porAtender] = await Promise.all([
    MensajeBot.count({ where }),
    MensajeBot.count({ where: { ...where, entendido: false } }),
    MensajeBot.count({ where: { ...where, destino: { [Op.ne]: null } } }),
    MensajeBot.count({ where: { destino: 'persona', atendidoEn: null } }),
  ]);

  return {
    total,
    noEntendidas,
    derivadas,
    porAtender,
    tasaSinEntender: total > 0 ? noEntendidas / total : 0,
  };
}
