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

  /**
   * Precio del informe de títulos. Placeholder, como `UF_FALLBACK_CLP`: el
   * costo de insumos conocido son los $13.500 de la carpeta del Conservador de
   * Santiago, y el resto del margen es decisión comercial sin tomar. Se guarda
   * en cada informe al momento de pedirlo, así que cambiarlo no altera lo ya
   * cobrado.
   */
  precioInformeTitulosClp: Number(process.env.PRECIO_INFORME_TITULOS_CLP ?? 49_000),

  /**
   * Cuenta a la que el comprador transfiere. Sin ella no se ofrece el medio:
   * mostrar instrucciones vacías es peor que no ofrecerlo.
   */
  cuentaCobro: {
    banco: process.env.COBRO_BANCO ?? '',
    tipoCuenta: process.env.COBRO_TIPO_CUENTA ?? '',
    numero: process.env.COBRO_NUMERO_CUENTA ?? '',
    titular: process.env.COBRO_TITULAR ?? '',
    rut: process.env.COBRO_RUT ?? '',
    email: process.env.COBRO_EMAIL ?? '',
  },
} as const;

export function cuentaDeCobroConfigurada(): boolean {
  const c = env.cuentaCobro;
  return Boolean(c.banco && c.numero && c.titular && c.rut);
}

export const esProduccion = env.nodeEnv === 'production';
