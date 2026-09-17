/**
 * Las visitas se agendan en hora de Chile, no en la del servidor.
 *
 * Chile cambia de horario en septiembre y abril, así que armar el instante con
 * `new Date(ano, mes, dia, hora)` deja las visitas corridas una hora dos veces
 * al año, y sólo para las que caen del otro lado del salto. De ahí que la hora
 * de pared se convierta siempre pasando por la zona.
 */
export const ZONA_CHILE = 'America/Santiago';

const formateador = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_CHILE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export interface HoraDePared {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
}

function partes(fecha: Date): Record<string, number> {
  const salida: Record<string, number> = {};
  for (const { type, value } of formateador.formatToParts(fecha)) {
    if (type !== 'literal') salida[type] = Number(value);
  }
  return salida;
}

/** Milisegundos de diferencia entre Chile y UTC en ese instante. */
function desfase(fecha: Date): number {
  const p = partes(fecha);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - fecha.getTime();
}

/** El instante UTC que corresponde a esa hora de pared chilena. */
export function instanteChileno(
  ano: number,
  mes: number,
  dia: number,
  hora: number,
  minuto: number,
): Date {
  const tentativo = Date.UTC(ano, mes - 1, dia, hora, minuto);
  const primero = desfase(new Date(tentativo));
  const corregido = tentativo - primero;

  // En el fin de semana del cambio de hora el desfase del instante corregido
  // puede no ser el mismo que el del tentativo; gana el del corregido.
  const segundo = desfase(new Date(corregido));
  return new Date(segundo === primero ? corregido : tentativo - segundo);
}

/** Esa hora de pared, leída en Chile. */
export function horaDePared(fecha: Date): HoraDePared {
  const p = partes(fecha);
  return { ano: p.year, mes: p.month, dia: p.day, hora: p.hour, minuto: p.minute };
}

/** 0 = domingo, como `Date.getDay()`, pero en el calendario chileno. */
export function diaSemanaChileno(fecha: Date): number {
  const { ano, mes, dia } = horaDePared(fecha);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

/** "2026-09-17" del día chileno al que pertenece el instante. */
export function diaIsoChileno(fecha: Date): string {
  const { ano, mes, dia } = horaDePared(fecha);
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Corre el día calendario, sin tocar la hora de pared. */
export function sumarDias(dia: HoraDePared, dias: number): HoraDePared {
  const movido = new Date(Date.UTC(dia.ano, dia.mes - 1, dia.dia + dias));
  return {
    ano: movido.getUTCFullYear(),
    mes: movido.getUTCMonth() + 1,
    dia: movido.getUTCDate(),
    hora: dia.hora,
    minuto: dia.minuto,
  };
}

/** "14:30:00" o "14:30" → minutos desde medianoche. */
export function minutosDeHora(hora: string): number {
  const [h, m] = hora.split(':');
  return Number(h) * 60 + Number(m ?? 0);
}
