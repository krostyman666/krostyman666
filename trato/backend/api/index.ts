import type { IncomingMessage, ServerResponse } from 'http';
import app from '../src/index';
import { conectarBaseDatos } from '../src/config/database';

/**
 * En Vercel cada invocación puede reusar una instancia tibia del proceso, así
 * que la conexión se abre una vez y se reusa. Si falla, se limpia para que el
 * siguiente request reintente en vez de quedar con un rechazo cacheado para
 * siempre.
 */
let conexion: Promise<void> | null = null;

function asegurarConexion(): Promise<void> {
  if (!conexion) {
    conexion = conectarBaseDatos().catch((error) => {
      conexion = null;
      throw error;
    });
  }
  return conexion;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await asegurarConexion();
  app(req as never, res as never);
}
