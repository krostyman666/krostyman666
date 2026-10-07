import { env } from '../config/env';

/**
 * UF del día, consultada a mindicador.cl y cacheada en memoria del proceso.
 *
 * La UF cambia una vez al día, así que no hace falta volver a pedirla en cada
 * request: se cachea por `VIGENCIA_CACHE_MS` y, si mindicador.cl no responde,
 * se sirve el último valor cacheado aunque esté vencido -- sigue siendo una UF
 * real y reciente, mejor que inventar un número. Sólo se cae al
 * `env.uf.fallbackClp` fijo si el proceso nunca logró una consulta exitosa.
 */

export interface ValorUf {
  valorClp: number;
  /** Fecha que informa mindicador.cl para ese valor (ISO). */
  fecha: string;
  fuente: 'mindicador' | 'fallback';
}

interface RespuestaMindicador {
  serie?: { fecha: string; valor: number }[];
}

const VIGENCIA_CACHE_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 5_000;

let cache: (ValorUf & { consultadoEn: number }) | null = null;

function sinConsultadoEn(valor: ValorUf & { consultadoEn: number }): ValorUf {
  const { valorClp, fecha, fuente } = valor;
  return { valorClp, fecha, fuente };
}

export async function obtenerUf(): Promise<ValorUf> {
  const ahora = Date.now();
  if (cache && ahora - cache.consultadoEn < VIGENCIA_CACHE_MS) {
    return sinConsultadoEn(cache);
  }

  try {
    const controlador = new AbortController();
    const timeout = setTimeout(() => controlador.abort(), TIMEOUT_MS);
    let respuesta: Response;
    try {
      respuesta = await fetch(env.uf.apiUrl, { signal: controlador.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!respuesta.ok) throw new Error(`mindicador.cl respondió ${respuesta.status}`);

    const datos = (await respuesta.json()) as RespuestaMindicador;
    const ultimo = datos.serie?.[0];
    if (!ultimo || typeof ultimo.valor !== 'number') {
      throw new Error('Respuesta de mindicador.cl sin una serie válida');
    }

    cache = { valorClp: ultimo.valor, fecha: ultimo.fecha, fuente: 'mindicador', consultadoEn: ahora };
    return sinConsultadoEn(cache);
  } catch {
    if (cache) return sinConsultadoEn(cache);
    return { valorClp: env.uf.fallbackClp, fecha: new Date(ahora).toISOString(), fuente: 'fallback' };
  }
}
