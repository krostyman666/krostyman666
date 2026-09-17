import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Propiedad } from '../models/Propiedad';
import { Usuario } from '../models/Usuario';
import { DisponibilidadVisita } from '../models/DisponibilidadVisita';
import { Visita, ESTADOS_VISITA_ACTIVOS, type EstadoVisita } from '../models/Visita';
import { ErrorApi } from '../utils/ErrorApi';
import {
  diaIsoChileno,
  horaDePared,
  instanteChileno,
  minutosDeHora,
  sumarDias,
} from '../utils/tiempo';

/** Lo que dura la visita con el comprador adentro. */
export const DURACION_VISITA_MIN = 45;

/**
 * Cada cuánto empieza un cupo. La diferencia con la duración es el traslado del
 * asesor: por eso los cupos de una misma propiedad quedan pegados y el asesor
 * alcanza a hacer varios seguidos sin cruzar la ciudad entremedio.
 */
export const PASO_CUPO_MIN = 60;

/** Nadie agenda para dentro de una hora: el asesor tiene que poder llegar. */
export const AVISO_MINIMO_HORAS = 12;

export const DIAS_VENTANA = 14;

export interface Cupo {
  inicio: string;
  fin: string;
  /** Capacidad del cupo: 1 en visita individual, más en open house. */
  lugares: number;
  ocupados: number;
}

export interface DiaConCupos {
  dia: string;
  cupos: Cupo[];
}

export interface BloqueDisponibilidad {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

async function exigirPropia(propiedadId: string, vendedorId: string): Promise<Propiedad> {
  const propiedad = await Propiedad.findByPk(propiedadId);
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
  if (propiedad.vendedorId !== vendedorId) {
    throw ErrorApi.prohibido('Esta propiedad no es tuya');
  }
  return propiedad;
}

export async function disponibilidadDe(propiedadId: string): Promise<DisponibilidadVisita[]> {
  return DisponibilidadVisita.findAll({
    where: { propiedadId },
    order: [
      ['diaSemana', 'ASC'],
      ['horaInicio', 'ASC'],
    ],
  });
}

export async function declararDisponibilidad(
  propiedadId: string,
  vendedorId: string,
  bloques: BloqueDisponibilidad[],
): Promise<DisponibilidadVisita[]> {
  await exigirPropia(propiedadId, vendedorId);

  for (const bloque of bloques) {
    const inicio = minutosDeHora(bloque.horaInicio);
    const fin = minutosDeHora(bloque.horaFin);
    if (fin - inicio < DURACION_VISITA_MIN) {
      throw ErrorApi.solicitudInvalida(
        `Cada ventana necesita al menos ${DURACION_VISITA_MIN} minutos para que quepa una visita`,
      );
    }
  }

  return sequelize.transaction(async (t) => {
    await DisponibilidadVisita.destroy({ where: { propiedadId }, transaction: t });
    return DisponibilidadVisita.bulkCreate(
      bloques.map((b) => ({ ...b, propiedadId })),
      { transaction: t },
    );
  });
}

/**
 * Los cupos concretos que el comprador puede tomar: la disponibilidad semanal
 * proyectada sobre los próximos días, menos lo ya reservado y lo que cae dentro
 * del aviso mínimo.
 */
export async function cuposDisponibles(
  propiedadId: string,
  dias = DIAS_VENTANA,
): Promise<DiaConCupos[]> {
  const propiedad = await Propiedad.findByPk(propiedadId, {
    attributes: ['id', 'visitantesPorCupo'],
  });
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');

  const lugares = propiedad.visitantesPorCupo;

  const ventanas = await disponibilidadDe(propiedadId);
  if (ventanas.length === 0) return [];

  const ahora = new Date();
  const desde = new Date(ahora.getTime() + AVISO_MINIMO_HORAS * 3_600_000);
  const hoy = horaDePared(ahora);
  const ultimo = sumarDias(hoy, dias);
  const hasta = instanteChileno(ultimo.ano, ultimo.mes, ultimo.dia, 23, 59);

  const tomadas = await Visita.findAll({
    where: {
      propiedadId,
      estado: { [Op.in]: ESTADOS_VISITA_ACTIVOS },
      inicio: { [Op.between]: [ahora, hasta] },
    },
    attributes: ['inicio', 'fin'],
  });

  const agenda: DiaConCupos[] = [];

  for (let d = 0; d <= dias; d++) {
    const fecha = sumarDias(hoy, d);
    const diaSemana = new Date(Date.UTC(fecha.ano, fecha.mes - 1, fecha.dia)).getUTCDay();
    const cupos: Cupo[] = [];

    for (const ventana of ventanas) {
      if (ventana.diaSemana !== diaSemana) continue;

      const abre = minutosDeHora(ventana.horaInicio);
      const cierra = minutosDeHora(ventana.horaFin);

      for (let m = abre; m + DURACION_VISITA_MIN <= cierra; m += PASO_CUPO_MIN) {
        const inicio = instanteChileno(
          fecha.ano,
          fecha.mes,
          fecha.dia,
          Math.floor(m / 60),
          m % 60,
        );
        if (inicio < desde) continue;

        const fin = new Date(inicio.getTime() + DURACION_VISITA_MIN * 60_000);
        const ocupados = tomadas.filter((t) => inicio < t.fin && t.inicio < fin).length;
        if (ocupados >= lugares) continue;

        cupos.push({ inicio: inicio.toISOString(), fin: fin.toISOString(), lugares, ocupados });
      }
    }

    if (cupos.length > 0) {
      cupos.sort((a, b) => a.inicio.localeCompare(b.inicio));
      agenda.push({
        dia: `${fecha.ano}-${String(fecha.mes).padStart(2, '0')}-${String(fecha.dia).padStart(2, '0')}`,
        cupos,
      });
    }
  }

  return agenda;
}

export async function solicitar(
  propiedadId: string,
  compradorId: string,
  inicioIso: string,
  mensaje?: string,
): Promise<Visita> {
  const inicio = new Date(inicioIso);
  if (Number.isNaN(inicio.getTime())) {
    throw ErrorApi.solicitudInvalida('La hora de la visita no es válida');
  }

  return sequelize.transaction(async (t) => {
    // Toma el cupo bajo llave: sin esto dos compradores que aprietan a la vez
    // quedan los dos con la misma hora y el asesor descubre el choque en la calle.
    const propiedad = await Propiedad.findByPk(propiedadId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
    if (propiedad.estado !== 'publicada') {
      throw ErrorApi.conflicto('Esta propiedad no está recibiendo visitas');
    }
    if (propiedad.vendedorId === compradorId) {
      throw ErrorApi.solicitudInvalida('Esta propiedad es tuya');
    }

    const agenda = await cuposDisponibles(propiedadId);
    const libre = agenda.some((d) => d.cupos.some((c) => c.inicio === inicio.toISOString()));
    if (!libre) {
      throw ErrorApi.conflicto('Ese horario ya no está disponible', 'cupo_tomado');
    }

    // En open house el cupo queda disponible aunque este comprador ya lo tomó,
    // así que sin este chequeo podría reservar dos lugares del mismo bloque.
    const yaVa = await Visita.findOne({
      where: {
        propiedadId,
        compradorId,
        inicio,
        estado: { [Op.in]: ESTADOS_VISITA_ACTIVOS },
      },
      transaction: t,
    });
    if (yaVa) {
      throw ErrorApi.conflicto('Ya tienes una visita reservada a esa hora', 'visita_repetida');
    }

    return Visita.create(
      {
        propiedadId,
        compradorId,
        inicio,
        fin: new Date(inicio.getTime() + DURACION_VISITA_MIN * 60_000),
        mensaje: mensaje ?? null,
      },
      { transaction: t },
    );
  });
}

const PROPIEDAD_EN_VISITA = {
  model: Propiedad,
  as: 'propiedad',
  attributes: ['id', 'titulo', 'calle', 'numero', 'depto', 'comuna', 'region', 'tipo'],
};

export async function visitasDeComprador(compradorId: string): Promise<Visita[]> {
  return Visita.findAll({
    where: { compradorId },
    include: [PROPIEDAD_EN_VISITA],
    order: [['inicio', 'DESC']],
  });
}

export async function visitasDePropiedad(
  propiedadId: string,
  vendedorId: string,
): Promise<Visita[]> {
  await exigirPropia(propiedadId, vendedorId);
  return Visita.findAll({
    where: { propiedadId },
    include: [{ model: Usuario, as: 'comprador', attributes: ['id', 'nombre', 'apellido'] }],
    order: [['inicio', 'ASC']],
  });
}

function limitesDelDia(diaIso: string): [Date, Date] {
  const [ano, mes, dia] = diaIso.split('-').map(Number);
  if (!ano || !mes || !dia) throw ErrorApi.solicitudInvalida('La fecha debe venir como 2026-09-17');
  const siguiente = sumarDias({ ano, mes, dia, hora: 0, minuto: 0 }, 1);
  return [
    instanteChileno(ano, mes, dia, 0, 0),
    instanteChileno(siguiente.ano, siguiente.mes, siguiente.dia, 0, 0),
  ];
}

/**
 * El día de un asesor, en orden cronológico.
 *
 * Va por hora y no por comuna a propósito: la hora ya la eligió el comprador y
 * no se puede mover, así que agrupar por zona produciría un recorrido imposible
 * (Ñuñoa 12:00 y después Providencia 10:00). Lo que sí se optimiza es a quién
 * se le asigna cada visita —ver `porAsignar`—, y `saltosDeComuna` mide cuántas
 * veces este día obliga a cruzar de zona.
 */
export async function agendaDeAsesor(asesorId: string, diaIso: string) {
  const [desde, hasta] = limitesDelDia(diaIso);

  const visitas = await Visita.findAll({
    where: {
      asesorId,
      estado: { [Op.in]: [...ESTADOS_VISITA_ACTIVOS, 'realizada'] },
      inicio: { [Op.gte]: desde, [Op.lt]: hasta },
    },
    include: [
      PROPIEDAD_EN_VISITA,
      { model: Usuario, as: 'comprador', attributes: ['id', 'nombre', 'apellido', 'telefono'] },
    ],
    order: [['inicio', 'ASC']],
  });

  const recorrido = visitas.map(
    (v) => (v.get('propiedad') as Propiedad | undefined)?.comuna ?? '—',
  );
  const saltosDeComuna = recorrido.filter((c, i) => i > 0 && c !== recorrido[i - 1]).length;

  return {
    dia: diaIso,
    total: visitas.length,
    comunas: [...new Set(recorrido)],
    saltosDeComuna,
    visitas,
  };
}

/**
 * Visitas pedidas y sin asesor, agrupadas por comuna y día. Los grupos grandes
 * primero: son los que rinden el viaje, y es la decisión que el coordinador toma.
 */
export async function porAsignar() {
  const visitas = await Visita.findAll({
    where: { estado: 'solicitada', asesorId: null, inicio: { [Op.gte]: new Date() } },
    include: [PROPIEDAD_EN_VISITA],
    order: [['inicio', 'ASC']],
  });

  const grupos = new Map<string, { comuna: string; dia: string; visitas: Visita[] }>();

  for (const visita of visitas) {
    const propiedad = visita.get('propiedad') as Propiedad | undefined;
    const comuna = propiedad?.comuna ?? '—';
    const dia = diaIsoChileno(visita.inicio);
    const clave = `${dia}|${comuna}`;
    const grupo = grupos.get(clave) ?? { comuna, dia, visitas: [] };
    grupo.visitas.push(visita);
    grupos.set(clave, grupo);
  }

  return [...grupos.values()].sort(
    (a, b) => b.visitas.length - a.visitas.length || a.dia.localeCompare(b.dia),
  );
}

export async function asignarAsesor(visitaId: string, asesorId: string): Promise<Visita> {
  const visita = await Visita.findByPk(visitaId);
  if (!visita) throw ErrorApi.noEncontrado('Visita no encontrada');

  const asesor = await Usuario.findByPk(asesorId);
  if (!asesor || (asesor.rol !== 'asesor' && asesor.rol !== 'admin')) {
    throw ErrorApi.solicitudInvalida('Ese usuario no es un asesor');
  }

  // Dos visitas a la misma hora sólo son un choque si son de propiedades
  // distintas: en open house el asesor muestra a varios compradores a la vez,
  // y eso es el punto.
  const choque = await Visita.findOne({
    where: {
      asesorId,
      id: { [Op.ne]: visitaId },
      propiedadId: { [Op.ne]: visita.propiedadId },
      estado: { [Op.in]: ESTADOS_VISITA_ACTIVOS },
      inicio: { [Op.lt]: visita.fin },
      fin: { [Op.gt]: visita.inicio },
    },
  });
  if (choque) {
    throw ErrorApi.conflicto(
      'El asesor ya tiene una visita en otra propiedad a esa hora',
      'asesor_ocupado',
    );
  }

  return visita.update({ asesorId, estado: 'confirmada' });
}

export async function cancelar(
  visitaId: string,
  usuarioId: string,
  motivo?: string,
): Promise<Visita> {
  const visita = await Visita.findByPk(visitaId, { include: [PROPIEDAD_EN_VISITA] });
  if (!visita) throw ErrorApi.noEncontrado('Visita no encontrada');

  const propiedad = visita.get('propiedad') as Propiedad | undefined;
  const esParte = visita.compradorId === usuarioId || propiedad?.vendedorId === usuarioId;
  if (!esParte) throw ErrorApi.prohibido('Esta visita no es tuya');

  if (visita.estado === 'realizada') {
    throw ErrorApi.conflicto('La visita ya se realizó');
  }

  return visita.update({ estado: 'cancelada', motivoCierre: motivo ?? null });
}

export async function marcarResultado(
  visitaId: string,
  asesorId: string,
  estado: Extract<EstadoVisita, 'realizada' | 'no_asistio'>,
  motivo?: string,
): Promise<Visita> {
  const visita = await Visita.findByPk(visitaId);
  if (!visita) throw ErrorApi.noEncontrado('Visita no encontrada');
  if (visita.asesorId !== asesorId) {
    throw ErrorApi.prohibido('Esta visita no está asignada a ti');
  }
  return visita.update({ estado, motivoCierre: motivo ?? null });
}
