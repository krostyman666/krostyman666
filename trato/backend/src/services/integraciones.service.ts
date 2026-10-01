import { Op } from 'sequelize';
import { Propiedad } from '../models/Propiedad';
import { ErrorApi } from '../utils/ErrorApi';

/**
 * Lo que un flujo externo (n8n) empuja de vuelta a Trato tras consultar los
 * portales públicos de SII y Tesorería por rol. Ninguno de los dos publica
 * API propia, pero ambos permiten consultar por rol sin clave personal: el
 * avalúo fiscal en sii.cl, y las contribuciones en tesoreria.cl igual que
 * cualquiera que va a pagar una cuenta ajena. Scraping de un portal público
 * es un trabajo de automatización, no una integración oficial, y por eso vive
 * fuera del backend: n8n hace la consulta, y acá sólo se recibe el resultado.
 *
 * Las contribuciones NO reemplazan el certificado del expediente para
 * efectos de escriturar -- ese sigue siendo el papel que la notaría aprueba.
 * Esto es el adelanto informativo que ve el comprador antes de ofertar.
 */

export const AVALUO_FISCAL_VIGENCIA_DIAS = 180;
export const CONTRIBUCIONES_VIGENCIA_DIAS = 30;

export interface AvaluoFiscalDatos {
  avaluoTotal: number;
  avaluoExento: number;
  avaluoAfecto: number;
  vigencia: string;
}

export interface CuotaContribucion {
  periodo: string;
  monto: number;
  vencimiento: string | null;
  estado: 'pagada' | 'pendiente' | 'atrasada';
}

export interface ContribucionesDatos {
  cuotas: CuotaContribucion[];
  totalAdeudadoClp: number;
  alDia: boolean;
}

export function tieneCacheFresca(cache: Record<string, unknown> | null, vigenciaDias: number): boolean {
  if (!cache) return false;
  const consultadoEn = cache.consultadoEn;
  if (typeof consultadoEn !== 'string') return false;
  const dias = (Date.now() - new Date(consultadoEn).getTime()) / 86_400_000;
  return dias <= vigenciaDias;
}

async function propiedadConRol(propiedadId: string): Promise<Propiedad> {
  const propiedad = await Propiedad.findByPk(propiedadId);
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
  if (!propiedad.rolAvaluo) {
    throw ErrorApi.conflicto('Esta propiedad no tiene rol de avalúo informado', 'sin_rol_avaluo');
  }
  return propiedad;
}

export interface PropiedadPendiente {
  id: string;
  rolAvaluo: string;
  titulo: string;
  comuna: string;
}

/**
 * Propiedades con rol pero sin dato fresco: la cola de trabajo, tanto de n8n
 * como de quien la llene a mano cuando el flujo automático no pueda (bloqueo
 * anti-bot, portal caído, lo que sea). Trae título y comuna -- a n8n le sirven
 * poco, pero a una persona mirando la lista sí le hacen falta para saber cuál
 * propiedad es cuál.
 */
export async function propiedadesPendientes(
  tipo: 'avaluo_fiscal' | 'contribuciones',
): Promise<PropiedadPendiente[]> {
  const campo = tipo === 'avaluo_fiscal' ? 'avaluoFiscalCache' : 'contribucionesCache';
  const vigenciaDias = tipo === 'avaluo_fiscal' ? AVALUO_FISCAL_VIGENCIA_DIAS : CONTRIBUCIONES_VIGENCIA_DIAS;

  const propiedades = await Propiedad.findAll({
    where: {
      rolAvaluo: { [Op.ne]: null },
      estado: { [Op.in]: ['publicada', 'reservada'] },
    },
    attributes: ['id', 'rolAvaluo', 'titulo', 'comuna', campo],
  });

  return propiedades
    .filter((p) => !tieneCacheFresca(p.get(campo) as Record<string, unknown> | null, vigenciaDias))
    .map((p) => ({ id: p.id, rolAvaluo: p.rolAvaluo as string, titulo: p.titulo, comuna: p.comuna }));
}

/**
 * `fuente` distingue quién llenó el dato: 'n8n' cuando lo empuja el flujo
 * automático, 'manual' cuando lo escribió alguien del equipo porque el portal
 * bloqueó la consulta automática. El informe no distingue -- a ambos los
 * muestra con su fecha -- pero queda la trazabilidad de cómo se obtuvo.
 */
export async function guardarAvaluoFiscal(
  propiedadId: string,
  datos: AvaluoFiscalDatos,
  fuente: 'n8n' | 'manual' = 'n8n',
): Promise<Propiedad> {
  const propiedad = await propiedadConRol(propiedadId);
  await propiedad.update({
    avaluoFiscalCache: { ...datos, fuente, consultadoEn: new Date().toISOString() },
  });
  return propiedad;
}

export async function guardarContribuciones(
  propiedadId: string,
  datos: ContribucionesDatos,
  fuente: 'n8n' | 'manual' = 'n8n',
): Promise<Propiedad> {
  const propiedad = await propiedadConRol(propiedadId);
  await propiedad.update({
    contribucionesCache: { ...datos, fuente, consultadoEn: new Date().toISOString() },
  });
  return propiedad;
}
