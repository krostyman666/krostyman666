import { api } from './api';

export type Destino = 'informe' | 'visita' | 'persona';

export interface RespuestaBot {
  texto: string;
  fuente: 'vendedor' | 'plataforma' | 'ley';
  etiquetaFuente: string;
  destino?: Destino;
  origen: string;
}

export interface Contestacion {
  id: string;
  pregunta: string;
  respuestas: RespuestaBot[];
  entendido: boolean;
  destino: Destino | null;
  etiquetaDestino: string | null;
  derivada: boolean;
}

export interface Sugerida {
  codigo: string;
  pregunta: string;
}

export interface MensajeHistorial {
  id: string;
  pregunta: string | null;
  respuesta: string;
  destino: Destino | null;
  createdAt: string;
}

const CLAVE_SESION = 'trato_bot_sesion';

/**
 * Identificador de la conversación anónima. Lo genera el navegador y no
 * identifica a la persona: agrupa lo que preguntó esta pestaña para poder leer
 * el hilo. Se lee en un efecto, nunca en el render, porque `localStorage` no
 * existe en el servidor y leerlo ahí rompe la hidratación.
 */
export function obtenerSesion(): string {
  try {
    const guardada = window.localStorage.getItem(CLAVE_SESION);
    if (guardada) return guardada;
    const nueva =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(CLAVE_SESION, nueva);
    return nueva;
  } catch {
    // Modo privado o storage bloqueado: una sesión efímera igual sirve para
    // el hilo de esta carga de página.
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export async function preguntar(
  propiedadId: string,
  pregunta: string,
  sesion: string,
): Promise<Contestacion> {
  const { data } = await api.post<Contestacion>(`/bot/propiedad/${propiedadId}`, {
    pregunta,
    sesion,
  });
  return data;
}

export async function obtenerSugeridas(): Promise<Sugerida[]> {
  const { data } = await api.get<{ sugeridas: Sugerida[] }>('/bot/sugeridas');
  return data.sugeridas;
}

export async function obtenerHistorial(
  propiedadId: string,
  sesion: string,
): Promise<MensajeHistorial[]> {
  const { data } = await api.get<{ mensajes: MensajeHistorial[] }>(
    `/bot/propiedad/${propiedadId}?sesion=${encodeURIComponent(sesion)}`,
  );
  return data.mensajes;
}

/** A dónde lleva el botón que acompaña una respuesta derivada. */
export function enlaceDestino(destino: Destino, propiedadId: string): string | null {
  if (destino === 'informe') return `/propiedades/${propiedadId}#informe`;
  if (destino === 'visita') return `/propiedades/${propiedadId}#visita`;
  return null; // 'persona' no navega: queda como derivación en la cola interna.
}
