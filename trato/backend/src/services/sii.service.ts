import { env } from '../config/env';

/**
 * Avalúo fiscal por rol, vía un proveedor de terceros.
 *
 * El SII no publica API propia -- su sitio es un formulario HTML, no un
 * endpoint documentado. La única vía automatizable es contratar un proveedor
 * externo que sí ofrezca el catastro SII por REST (p.ej. BaseAPI). Mientras
 * `env.sii.proveedor` sea 'ninguno' -- el default sin contratar -- esta
 * función no llama a nada y retorna null: el informe muestra "fuente por
 * conectar" en vez de inventar un número, igual que con la cuenta de cobro o
 * las credenciales de Flow.
 */
export interface AvaluoFiscal {
  rol: string;
  /** Avalúo total, en pesos. */
  avaluoTotal: number;
  avaluoExento: number;
  avaluoAfecto: number;
  /** Semestre de vigencia del avalúo, tal como lo informa el SII (p.ej. "2026-2"). */
  vigencia: string;
}

export function siiConfigurado(): boolean {
  return env.sii.proveedor !== 'ninguno' && Boolean(env.sii.baseapiKey);
}

/**
 * Consulta el avalúo fiscal por rol. Retorna null si el proveedor no está
 * contratado, o si la consulta falla -- nunca lanza, porque el informe gratis
 * no puede caerse por una integración externa que no controlamos.
 */
export async function consultarAvaluoFiscal(rol: string): Promise<AvaluoFiscal | null> {
  if (!siiConfigurado()) return null;

  try {
    const respuesta = await fetch(
      `${env.sii.baseapiUrl}/avaluo-fiscal?rol=${encodeURIComponent(rol)}`,
      { headers: { Authorization: `Bearer ${env.sii.baseapiKey}` } },
    );
    if (!respuesta.ok) return null;

    const datos = (await respuesta.json()) as Partial<AvaluoFiscal>;
    if (
      typeof datos.avaluoTotal !== 'number' ||
      typeof datos.avaluoExento !== 'number' ||
      typeof datos.avaluoAfecto !== 'number' ||
      typeof datos.vigencia !== 'string'
    ) {
      return null;
    }

    return {
      rol,
      avaluoTotal: datos.avaluoTotal,
      avaluoExento: datos.avaluoExento,
      avaluoAfecto: datos.avaluoAfecto,
      vigencia: datos.vigencia,
    };
  } catch {
    return null;
  }
}
