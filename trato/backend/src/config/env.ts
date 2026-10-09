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
  /** La URL pública propia, para construir la urlConfirmation que Flow llama. */
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:3001',
  databaseUrl: requerido('DATABASE_URL'),
  /**
   * Conexiones máximas del pool por proceso. En serverless (Vercel) cada
   * instancia tibia abre su propio pool, así que un `max` pensado para un
   * único proceso persistente agota rápido el límite del proveedor con
   * varias instancias concurrentes. El default bajo en producción asume un
   * pooler (pgbouncer/Neon/Supabase) por delante multiplexando.
   */
  dbPoolMax: Number(process.env.DB_POOL_MAX ?? (process.env.NODE_ENV === 'production' ? 3 : 10)),
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
   * Flow: el agregador que da Webpay sin que Trato pase por la certificación
   * de Transbank (ver `dominio/pagos.ts`). Sin `apiKey`/`secretKey` el medio
   * "webpay" no se ofrece -- no hay nada que simular con cuentas de sandbox
   * que nadie creó todavía.
   */
  flow: {
    apiKey: process.env.FLOW_API_KEY ?? '',
    secretKey: process.env.FLOW_SECRET_KEY ?? '',
    baseUrl: process.env.FLOW_BASE_URL ?? 'https://sandbox.flow.cl/api',
  },

  /**
   * Dónde se guardan los archivos del expediente. `local` escribe al disco del
   * backend y sirve para desarrollo; en producción es `vercel-blob` (ver
   * `almacenamiento.service.ts`), porque el disco del contenedor serverless es
   * efímero y no se comparte entre invocaciones. Nunca son públicos: son los
   * papeles legales del vendedor y se sirven por endpoint autenticado.
   */
  almacenamiento: {
    driver: (process.env.ALMACENAMIENTO_DRIVER ?? 'local') as 'local' | 'vercel-blob',
    dirLocal: process.env.ALMACENAMIENTO_DIR ?? path.resolve(__dirname, '../../../almacenamiento'),
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

  /**
   * Avalúo fiscal por rol. El SII no publica API propia: hay que contratar un
   * proveedor de terceros (BaseAPI u otro con cobertura del catastro SII) que sí
   * la ofrezca vía REST. Mientras `proveedor` sea 'ninguno' (el default sin
   * contratar), `consultarAvaluoFiscal` no llama a nada. Esto es un respaldo:
   * la vía principal es `avaluoFiscalCache` en la propiedad, que puebla el
   * flujo de n8n (ver `integraciones.service.ts`) consultando el portal
   * público por rol, sin pagar nada.
   */
  sii: {
    proveedor: (process.env.SII_PROVEEDOR ?? 'ninguno') as 'ninguno' | 'baseapi',
    baseapiUrl: process.env.BASEAPI_URL ?? 'https://api.baseapi.cl',
    baseapiKey: process.env.BASEAPI_KEY ?? '',
  },

  /**
   * Llave que usan los flujos externos (n8n) para empujar datos consultados a
   * `/api/v1/integraciones/*`. No es un usuario ni un JWT: es un sistema
   * llamando, no una persona de la operación, y un JWT de 7 días rotando en un
   * flujo de n8n es más riesgo que una llave fija que se puede revocar
   * cambiando una variable de entorno. Vacía por defecto: sin ella, las rutas
   * de integración rechazan todo.
   */
  integracion: {
    apiKey: process.env.INTEGRACION_API_KEY ?? '',
  },

  /**
   * UF del día, para la calculadora de ahorro de la landing. `fallbackClp` sólo
   * se usa si mindicador.cl nunca respondió desde que arrancó el proceso (ni
   * siquiera hay un valor cacheado de antes); mientras haya uno en caché, se
   * sirve ese aunque esté vencido -- sigue siendo una UF real y reciente, mejor
   * que un número fijo. Ver `services/uf.service.ts`.
   */
  uf: {
    apiUrl: process.env.UF_API_URL ?? 'https://mindicador.cl/api/uf',
    fallbackClp: Number(process.env.UF_FALLBACK_CLP ?? 39_000),
  },

  /**
   * Correo saliente (avisos de vencimiento de certificados, por ahora). Sin
   * `SMTP_HOST` el envío no se intenta: se registra y se dice, no se finge.
   * Mismo patrón que `sii.proveedor: 'ninguno'`.
   */
  email: {
    smtpHost: process.env.SMTP_HOST ?? '',
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpUser: process.env.SMTP_USER ?? '',
    smtpPassword: process.env.SMTP_PASSWORD ?? '',
    from: process.env.EMAIL_FROM ?? 'Trato <no-responder@trato.cl>',
  },
} as const;

export function cuentaDeCobroConfigurada(): boolean {
  const c = env.cuentaCobro;
  return Boolean(c.banco && c.numero && c.titular && c.rut);
}

export const esProduccion = env.nodeEnv === 'production';
