import path from 'path';
import dotenv from 'dotenv';

// El .env vive en la raiz del monorepo; el backend arranca desde backend/.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

function requerido(clave: string): string {
  const valor = process.env[clave];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${clave}. Revisa tu archivo .env`);
  }
  return valor;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.BACKEND_PORT ?? 3001),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  databaseUrl: requerido('DATABASE_URL'),
  jwtSecret: requerido('JWT_SECRET'),
  jwtExpira: process.env.JWT_EXPIRE ?? '7d',
} as const;

export const esProduccion = env.nodeEnv === 'production';
