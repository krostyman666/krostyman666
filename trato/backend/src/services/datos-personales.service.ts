import crypto from 'crypto';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Usuario, hashearPassword } from '../models/Usuario';
import { Propiedad } from '../models/Propiedad';
import { Documento } from '../models/Documento';
import { Visita, ESTADOS_VISITA_ACTIVOS } from '../models/Visita';
import { Informe } from '../models/Informe';
import { Consentimiento } from '../models/Consentimiento';
import { SolicitudDatos, type ResultadoSolicitud } from '../models/SolicitudDatos';
import { PurgaRegistro } from '../models/PurgaRegistro';
import { ErrorApi } from '../utils/ErrorApi';
import {
  CAMPOS_RECTIFICABLES,
  DERECHOS,
  REGISTRO_TRATAMIENTO,
  type CampoRectificable,
} from '../dominio/datos-personales';

/** Estados en que una propiedad todavía está en juego. */
const PROPIEDAD_EN_CURSO = ['en_revision', 'publicada', 'reservada'];

async function exigirUsuario(usuarioId: string): Promise<Usuario> {
  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario) throw ErrorApi.noEncontrado('Usuario no encontrado');
  return usuario;
}

/**
 * Todo lo que Trato tiene sobre el titular, en un JSON que otro sistema pueda
 * leer. Cubre acceso y portabilidad de una vez: son el mismo dato, cambia el
 * formato en que se entrega.
 */
export async function exportarDe(usuarioId: string) {
  const usuario = await exigirUsuario(usuarioId);

  const [propiedades, visitasComoComprador, visitasComoAsesor, informes, consentimientos, solicitudes] =
    await Promise.all([
      Propiedad.findAll({
        where: { vendedorId: usuarioId },
        include: [{ model: Documento, as: 'documentos' }],
      }),
      Visita.findAll({ where: { compradorId: usuarioId } }),
      Visita.findAll({ where: { asesorId: usuarioId } }),
      Informe.findAll({ where: { compradorId: usuarioId } }),
      Consentimiento.findAll({ where: { usuarioId } }),
      SolicitudDatos.findAll({ where: { usuarioId } }),
    ]);

  await SolicitudDatos.create({
    usuarioId,
    tipo: 'portabilidad',
    resultado: 'atendida',
    detalle: 'Exportación completa entregada al titular.',
  });

  return {
    generadoEn: new Date().toISOString(),
    // El hash de la clave no va: entregarlo no le sirve al titular y sí
    // serviría a quien intercepte el archivo.
    cuenta: usuario.toJSON(),
    propiedades,
    visitas: { comoComprador: visitasComoComprador, comoAsesor: visitasComoAsesor },
    informes,
    consentimientos,
    solicitudesPrevias: solicitudes,
    registroDeTratamiento: REGISTRO_TRATAMIENTO,
    derechos: DERECHOS,
  };
}

export async function rectificar(
  usuarioId: string,
  cambios: Partial<Record<CampoRectificable, string>>,
): Promise<Usuario> {
  const usuario = await exigirUsuario(usuarioId);

  const permitidos: Partial<Record<CampoRectificable, string>> = {};
  for (const campo of CAMPOS_RECTIFICABLES) {
    if (cambios[campo] !== undefined) permitidos[campo] = cambios[campo];
  }
  if (Object.keys(permitidos).length === 0) {
    throw ErrorApi.solicitudInvalida('No hay nada que corregir');
  }

  await usuario.update(permitidos);

  await SolicitudDatos.create({
    usuarioId,
    tipo: 'rectificacion',
    resultado: 'atendida',
    detalle: `Campos corregidos: ${Object.keys(permitidos).join(', ')}.`,
  });

  return usuario;
}

export interface Evaluacion {
  puedeSuprimir: boolean;
  bloqueos: { motivo: string; detalle: string }[];
  seAnonimiza: string[];
  seRetiene: { categoria: string; meses: number | null; porque: string }[];
}

/**
 * Qué pasaría si el titular pide la supresión.
 *
 * Se le muestra antes de ejecutar, porque "borramos todo" sería falso: hay
 * documentación de compraventa que otra norma obliga a conservar. Decirlo de
 * frente es además lo que la ley pide.
 */
export async function evaluarSupresion(usuarioId: string): Promise<Evaluacion> {
  await exigirUsuario(usuarioId);

  const bloqueos: Evaluacion['bloqueos'] = [];

  const enCurso = await Propiedad.count({
    where: { vendedorId: usuarioId, estado: { [Op.in]: PROPIEDAD_EN_CURSO } },
  });
  if (enCurso > 0) {
    bloqueos.push({
      motivo: 'Tienes una operación en curso',
      detalle:
        enCurso === 1
          ? '1 propiedad publicada o reservada. Retírala primero: sin tus datos no se puede escriturar.'
          : `${enCurso} propiedades publicadas o reservadas. Retíralas primero: sin tus datos no se puede escriturar.`,
    });
  }

  const visitasActivas = await Visita.count({
    where: { compradorId: usuarioId, estado: { [Op.in]: ESTADOS_VISITA_ACTIVOS } },
  });
  if (visitasActivas > 0) {
    bloqueos.push({
      motivo: 'Tienes visitas agendadas',
      detalle: `${visitasActivas} ${visitasActivas === 1 ? 'visita' : 'visitas'} por realizarse. Cancélalas y volvemos a evaluar.`,
    });
  }

  const [vendidas, informesEntregados, consentimientos] = await Promise.all([
    Propiedad.count({ where: { vendedorId: usuarioId, estado: 'vendida' } }),
    Informe.count({ where: { compradorId: usuarioId, estado: 'entregado' } }),
    Consentimiento.count({ where: { usuarioId } }),
  ]);

  // Sólo se anuncia lo que de verdad existe. Decirle a alguien que le
  // retenemos autorizaciones que nunca dio es una respuesta falsa, y además
  // convierte una supresión completa en parcial sin motivo.
  const seRetiene = REGISTRO_TRATAMIENTO.filter((a) => a.supresion === 'retener_por_ley')
    .filter((a) => {
      if (a.codigo === 'propiedad' || a.codigo === 'expediente') return vendidas > 0;
      if (a.codigo === 'informes') return informesEntregados > 0;
      if (a.codigo === 'consentimientos') return consentimientos > 0;
      return true;
    })
    .map((a) => ({ categoria: a.categoria, meses: a.conservacionMeses, porque: a.nota }));

  return {
    puedeSuprimir: bloqueos.length === 0,
    bloqueos,
    seAnonimiza: REGISTRO_TRATAMIENTO.filter(
      (a) => a.supresion === 'anonimizable' || a.supresion === 'suprimible',
    ).map((a) => a.categoria),
    seRetiene,
  };
}

/** Marcador que reemplaza al nombre. Que se lea como lo que es. */
const NOMBRE_SUPRIMIDO = 'Titular';
const APELLIDO_SUPRIMIDO = 'suprimido';

export async function ejecutarSupresion(
  usuarioId: string,
): Promise<{ resultado: ResultadoSolicitud; evaluacion: Evaluacion }> {
  const evaluacion = await evaluarSupresion(usuarioId);
  if (!evaluacion.puedeSuprimir) {
    throw ErrorApi.conflicto(
      evaluacion.bloqueos.map((b) => b.motivo).join('. '),
      'supresion_bloqueada',
    );
  }

  const usuario = await exigirUsuario(usuarioId);
  if (usuario.anonimizadoEn) {
    throw ErrorApi.conflicto('Esta cuenta ya está anonimizada');
  }

  const corto = usuarioId.replace(/-/g, '').slice(0, 12);

  await sequelize.transaction(async (t) => {
    await usuario.update(
      {
        // El correo tiene índice único, así que el marcador también debe serlo.
        // .invalid está reservado por RFC 2606: nunca resuelve a un buzón real.
        email: `suprimido-${corto}@trato.invalid`,
        nombre: NOMBRE_SUPRIMIDO,
        apellido: APELLIDO_SUPRIMIDO,
        rut: null,
        telefono: null,
        // La cuenta queda sin forma de entrar, sin borrar la fila.
        passwordHash: await hashearPassword(crypto.randomBytes(32).toString('hex')),
        anonimizadoEn: new Date(),
      },
      { transaction: t },
    );

    // Texto libre escrito por la persona: puede contener cualquier cosa y no
    // hay obligación de conservarlo.
    await Visita.update(
      { mensaje: null },
      { where: { compradorId: usuarioId }, transaction: t },
    );

    // Las publicaciones que nunca vendieron salen de circulación. No se borran
    // porque de ellas cuelga el expediente, pero dejan de estar públicas.
    await Propiedad.update(
      { estado: 'retirada' },
      {
        where: { vendedorId: usuarioId, estado: { [Op.in]: PROPIEDAD_EN_CURSO } },
        transaction: t,
      },
    );
  });

  const resultado: ResultadoSolicitud =
    evaluacion.seRetiene.length > 0 ? 'atendida_parcial' : 'atendida';

  await SolicitudDatos.create({
    usuarioId,
    tipo: 'supresion',
    resultado,
    detalle:
      evaluacion.seRetiene.length > 0
        ? `Cuenta anonimizada. Se retiene por obligación legal: ${evaluacion.seRetiene.map((r) => r.categoria).join('; ')}.`
        : 'Cuenta anonimizada. No quedó nada por retener.',
  });

  return { resultado, evaluacion };
}

/**
 * Datos que pasaron su plazo de conservación.
 *
 * No borra: informa. Quién ejecuta la purga y cuándo es una decisión operativa
 * que conviene tomar mirando la lista, no en un cron que nadie revisa.
 */
export async function datosVencidos(ahora = new Date()) {
  const vencidos: { actividad: string; categoria: string; cuantos: number; desde: Date }[] = [];

  for (const actividad of REGISTRO_TRATAMIENTO) {
    if (actividad.conservacionMeses === null) continue;

    const corte = new Date(ahora);
    corte.setMonth(corte.getMonth() - actividad.conservacionMeses);

    let cuantos = 0;
    if (actividad.codigo === 'visitas') {
      // mensaje ya en null es una visita que la purga (o una supresión) ya
      // anonimizó: no cuenta como pendiente, si no la lista nunca converge.
      cuantos = await Visita.count({
        where: {
          estado: { [Op.notIn]: ESTADOS_VISITA_ACTIVOS },
          fin: { [Op.lt]: corte },
          mensaje: { [Op.ne]: null },
        },
      });
    } else if (actividad.codigo === 'informes') {
      cuantos = await Informe.count({ where: { createdAt: { [Op.lt]: corte } } });
    } else if (actividad.codigo === 'consentimientos') {
      cuantos = await Consentimiento.count({ where: { revocadoEn: { [Op.lt]: corte } } });
    }

    if (cuantos > 0) {
      vencidos.push({
        actividad: actividad.codigo,
        categoria: actividad.categoria,
        cuantos,
        desde: corte,
      });
    }
  }

  return vencidos;
}

/** Las últimas corridas de la purga, para que quede a la vista que no es la primera vez. */
export async function historialPurgas(limite = 5): Promise<PurgaRegistro[]> {
  return PurgaRegistro.findAll({
    include: [{ model: Usuario, as: 'ejecutadaPor', attributes: ['id', 'nombre', 'apellido'] }],
    order: [['createdAt', 'DESC']],
    limit: limite,
  });
}

export interface AccionPurga {
  actividad: string;
  categoria: string;
  cuantos: number;
  accion: 'anonimizado';
}

/**
 * Ejecuta la purga de lo vencido -- lo que `datosVencidos()` sólo informaba.
 *
 * No toca todo lo que aparece en esa lista. De las categorías con plazo, sólo
 * `visitas` tiene una acción segura y ya establecida: borrar el mensaje libre,
 * exactamente lo que `ejecutarSupresion` hace a pedido de un comprador. Las
 * demás son evidencia que no conviene purgar a ciegas:
 *
 * - `informes` es la prueba de qué se le entregó al comprador y cuándo, y si
 *   lleva firma de abogado respalda una responsabilidad profesional. Decidir
 *   qué de su `contenido` (una foto JSON del informe) se puede anonimizar sin
 *   perder ese valor probatorio es una decisión de abogado, no de un bucle
 *   genérico.
 * - `consentimientos` ni siquiera se edita: el propio modelo lo dice --
 *   revocar llena `revocadoEn` y el historial queda intacto, porque borrar la
 *   fila destruiría justo la prueba de que el tratamiento estuvo autorizado.
 * - `rut`, `propiedad` y `expediente` cuentan desde que cierra la operación, y
 *   hoy no existe ese instante como campo (no hay "vendidaEn"): inventarlo acá
 *   sería adivinar, así que `datosVencidos()` tampoco los detecta todavía.
 *
 * Sigue siendo una decisión operativa y no un cron que nadie revisa -- lo que
 * cambia es que ahora hay cómo ejecutarla, en vez de sólo mirar la lista.
 */
export async function purgarVencidos(
  ejecutadaPorId: string,
  ahora = new Date(),
): Promise<AccionPurga[]> {
  const acciones: AccionPurga[] = [];

  const actividadVisitas = REGISTRO_TRATAMIENTO.find((a) => a.codigo === 'visitas');
  if (actividadVisitas?.conservacionMeses !== null && actividadVisitas?.conservacionMeses !== undefined) {
    const corte = new Date(ahora);
    corte.setMonth(corte.getMonth() - actividadVisitas.conservacionMeses);

    const [cuantos] = await Visita.update(
      { mensaje: null },
      {
        where: {
          estado: { [Op.notIn]: ESTADOS_VISITA_ACTIVOS },
          fin: { [Op.lt]: corte },
          mensaje: { [Op.ne]: null },
        },
      },
    );
    if (cuantos > 0) {
      acciones.push({
        actividad: actividadVisitas.codigo,
        categoria: actividadVisitas.categoria,
        cuantos,
        accion: 'anonimizado',
      });
    }
  }

  await PurgaRegistro.create({ ejecutadaPorId, acciones: acciones as unknown as Record<string, unknown>[] });

  return acciones;
}
