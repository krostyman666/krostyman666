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

  /**
   * Dónde se guardan los archivos del expediente. `local` escribe al disco del
   * backend y sirve para desarrollo; en producción hay que pasar a `s3` (las
   * llaves AWS ya están reservadas en `.env.example`), porque el disco del
   * contenedor es efímero y no se comparte entre instancias. Nunca son públicos:
   * son los papeles legales del vendedor y se sirven por endpoint autenticado.
   */
  almacenamiento: {
    driver: (process.env.ALMACENAMIENTO_DRIVER ?? 'local') as 'local' | 's3',
    dirLocal: process.env.ALMACENAMIENTO_DIR ?? path.resolve(__dirname, '../../../almacenamiento'),
    s3Bucket: process.env.AWS_S3_BUCKET ?? '',
    s3Region: process.env.AWS_REGION ?? '',
  },

  /**
   * Firma de la promesa. Sin credenciales de un proveedor de firma electrónica
   * avanzada, la plataforma firma con firma electrónica simple (Ley 19.799), que
   * es válida para una promesa —contrato entre partes, no escritura pública—
   * aunque con menor valor probatorio. DocuSign, o un proveedor local de FEA,
   * entra por acá para subir ese valor probatorio sin rehacer el flujo.
   */
  firma: {
    proveedor: (process.env.FIRMA_PROVEEDOR ?? 'simple') as 'simple' | 'docusign',
    docusignBaseUrl: process.env.DOCUSIGN_BASE_URL ?? '',
    docusignAccountId: process.env.DOCUSIGN_ACCOUNT_ID ?? '',
  },
} as const;

export function cuentaDeCobroConfigurada(): boolean {
  const c = env.cuentaCobro;
  return Boolean(c.banco && c.numero && c.titular && c.rut);
}

export const esProduccion = env.nodeEnv === 'production';
