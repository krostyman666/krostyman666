export const ZONA_CHILE = 'America/Santiago';

export const DIAS_SEMANA = [
  { valor: 1, etiqueta: 'Lunes' },
  { valor: 2, etiqueta: 'Martes' },
  { valor: 3, etiqueta: 'Miércoles' },
  { valor: 4, etiqueta: 'Jueves' },
  { valor: 5, etiqueta: 'Viernes' },
  { valor: 6, etiqueta: 'Sábado' },
  { valor: 0, etiqueta: 'Domingo' },
] as const;

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

export type EstadoVisita =
  | 'solicitada'
  | 'confirmada'
  | 'realizada'
  | 'cancelada'
  | 'no_asistio';

export interface VisitaApi {
  id: string;
  inicio: string;
  fin: string;
  estado: EstadoVisita;
  mensaje: string | null;
  motivoCierre: string | null;
  asesorId: string | null;
  propiedad?: {
    id: string;
    titulo: string;
    calle: string;
    numero: string;
    depto: string | null;
    comuna: string;
    tipo: string;
  };
  comprador?: { id: string; nombre: string; apellido: string; telefono?: string | null };
}

export const ETIQUETA_ESTADO_VISITA: Record<EstadoVisita, string> = {
  solicitada: 'Pedida',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
};

const soloHora = new Intl.DateTimeFormat('es-CL', {
  timeZone: ZONA_CHILE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const diaLargo = new Intl.DateTimeFormat('es-CL', {
  timeZone: ZONA_CHILE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const diaCompacto = new Intl.DateTimeFormat('es-CL', {
  timeZone: ZONA_CHILE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/** Siempre en hora de Chile: el comprador puede estar mirando desde afuera. */
export function formatearHora(iso: string): string {
  return soloHora.format(new Date(iso));
}

/** Para un día que ya viene calculado en Chile, como "2026-09-19". */
export function formatearDia(diaIso: string): string {
  // Se lee a mediodía para que el día no se corra al pasar por la zona.
  return diaLargo.format(new Date(`${diaIso}T12:00:00Z`));
}

/**
 * Para un instante UTC. Recortar los primeros 10 caracteres del ISO daría el
 * día en UTC: una visita a las 21:00 en Chile aparecería al día siguiente.
 */
export function formatearDiaDeInstante(iso: string): string {
  return diaLargo.format(new Date(iso));
}

/** "sáb, 19 sept" — para los chips del selector, donde el nombre largo no cabe. */
export function formatearDiaCompacto(diaIso: string): string {
  return diaCompacto.format(new Date(`${diaIso}T12:00:00Z`));
}

export function formatearRango(inicio: string, fin: string): string {
  return `${formatearHora(inicio)} a ${formatearHora(fin)}`;
}
