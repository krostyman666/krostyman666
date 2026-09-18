export type NivelInforme = 'antecedentes' | 'titulos';

export type EstadoInforme =
  | 'emitido'
  | 'esperando_pago'
  | 'en_preparacion'
  | 'entregado'
  | 'anulado';

export interface SeccionInforme {
  codigo: string;
  titulo: string;
  queResponde: string;
  fuente: string;
  datos: Record<string, unknown> | null;
  sinDatos?: string;
}

export interface SeccionPrometida {
  codigo: string;
  titulo: string;
  queResponde: string;
  fuente: string;
  condicional: string | null;
}

export interface ContenidoInforme {
  nombre: string;
  secciones?: SeccionInforme[];
  seccionesPrometidas?: SeccionPrometida[];
  limites?: string[];
  aportesDelNivelPagado?: string[];
  consentimiento: { version: string; otorgadoEn: string } | null;
  plazoHabiles?: { minimo: number; maximo: number };
  costoInsumosClp?: number;
  firmadoPor?: { nombre: string; rut: string };
}

export interface InformeApi {
  id: string;
  nivel: NivelInforme;
  estado: EstadoInforme;
  precioClp: number;
  contenido: ContenidoInforme;
  emitidoEn: string | null;
  entregadoEn: string | null;
  firmadoEn: string | null;
  conclusion: string | null;
  defectos: string[];
  propiedad?: { id: string; titulo: string; comuna: string };
}

export interface NivelCatalogo {
  nombre: string;
  precioClp: number;
  inmediato: boolean;
  secciones: { codigo: string; titulo: string; queResponde: string; condicional?: string | null }[];
  limites?: string[];
  aportes?: string[];
  plazoHabiles?: { minimo: number; maximo: number };
}

export interface CatalogoInformes {
  niveles: { antecedentes: NivelCatalogo; titulos: NivelCatalogo };
}

export const ETIQUETA_ESTADO_INFORME: Record<EstadoInforme, string> = {
  emitido: 'Listo',
  esperando_pago: 'Esperando pago',
  en_preparacion: 'En preparación',
  entregado: 'Entregado',
  anulado: 'Anulado',
};

export const ETIQUETA_FUENTE: Record<string, string> = {
  sii: 'SII',
  tgr: 'Tesorería',
  cbr: 'Conservador de Bienes Raíces',
  municipalidad: 'Municipalidad',
  serviu: 'SERVIU',
  administracion_edificio: 'Administración del edificio',
  vendedor: 'Declarado por el vendedor',
  plataforma: 'Trato',
  abogado: 'Abogado',
};

const pesos = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatearPesos(monto: number): string {
  return pesos.format(monto);
}

/**
 * Sin firma de abogado es una carpeta de documentos, no un estudio de títulos.
 * El backend ya decide el nombre; esto es para no repetir la regla en la UI.
 */
export function esEstudioDeTitulos(informe: InformeApi): boolean {
  return informe.nivel === 'titulos' && informe.firmadoEn !== null;
}
