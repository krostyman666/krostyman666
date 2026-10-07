import { api } from './api';
import { UF_FALLBACK_CLP } from './comision';

/**
 * UF del día, vía el backend (que a su vez la cachea desde mindicador.cl --
 * ver `backend/src/services/uf.service.ts`). Se cachea también acá, en
 * memoria del módulo, para no repetir la consulta en cada render del mismo
 * componente ni entre componentes distintos que la usen en la misma carga de
 * página.
 */

export interface ValorUf {
  valorClp: number;
  fecha: string;
  fuente: 'mindicador' | 'fallback' | 'sin-conexion';
}

let cache: Promise<ValorUf> | null = null;

async function pedir(): Promise<ValorUf> {
  try {
    const { data } = await api.get<{ valorClp: number; fecha: string; fuente: 'mindicador' | 'fallback' }>(
      '/uf',
    );
    return data;
  } catch {
    // El backend ya tiene su propio fallback; si esto se dispara es porque ni
    // siquiera se pudo contactar al backend. `sin-conexion` lo distingue de
    // `fallback` (que sí es una respuesta válida del backend, sólo que el
    // backend tampoco pudo contactar a mindicador.cl).
    return { valorClp: UF_FALLBACK_CLP, fecha: new Date().toISOString(), fuente: 'sin-conexion' };
  }
}

export function obtenerUf(): Promise<ValorUf> {
  if (!cache) cache = pedir();
  return cache;
}
