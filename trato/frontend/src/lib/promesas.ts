export type EstadoPromesa =
  | 'negociando'
  | 'acordada'
  | 'firmada'
  | 'cumplida'
  | 'desistida';

export interface ClausulaApi {
  id: string;
  codigo: string;
  texto: string;
  orden: number;
  propuestaPorId: string;
  aceptadaPorId: string | null;
  aceptadaEn: string | null;
  comentario: string | null;
}

export interface PromesaApi {
  id: string;
  propiedadId: string;
  compradorId: string;
  vendedorId: string;
  precio: number;
  moneda: 'clp' | 'uf';
  pie: number | null;
  fechaEscritura: string | null;
  estado: EstadoPromesa;
  acordadaEn: string | null;
  firmadaEn: string | null;
  revisadaEn: string | null;
  motivoCierre: string | null;
  clausulas?: ClausulaApi[];
  propiedad?: { id: string; titulo: string; comuna: string };
  comprador?: { id: string; nombre: string; apellido: string };
  vendedor?: { id: string; nombre: string; apellido: string };
}

export interface RequisitoApi {
  codigo: string;
  numeral: string;
  exige: string;
  porQue: string;
  cumplido: boolean;
  falta: string | null;
}

export interface DefinicionClausulaApi {
  codigo: string;
  titulo: string;
  tipo: 'obligatoria' | 'negociable';
  queDice: string;
  porQueImporta: string;
  plantilla: string;
  soloSiHipoteca?: boolean;
}

export interface Negociacion {
  requisitos: RequisitoApi[];
  cumpleElArticulo: boolean;
  clausulasPendientes: string[];
  puedeAcordarse: boolean;
}

export interface RespuestaPromesa {
  promesa: PromesaApi;
  negociacion: Negociacion;
  catalogo: DefinicionClausulaApi[];
}

export interface FirmaApi {
  rol: 'comprador' | 'vendedor';
  nombre: string;
  firmadoEn: string;
  /** El texto guardado sigue dando su hash: nadie tocó el registro de la firma. */
  integra: boolean;
}

export interface EstadoFirmaApi {
  /** El contrato completo, tal como se firma. */
  texto: string;
  /** SHA-256 del texto: la huella de lo que se firma. */
  hash: string;
  proveedor: 'simple' | 'docusign';
  /** Por qué no se puede firmar todavía, o null si se puede. */
  bloqueo: string | null;
  firmas: FirmaApi[];
  yaFirmaste: boolean;
  puedesFirmar: boolean;
  estaFirmada: boolean;
}

export const ETIQUETA_ESTADO_PROMESA: Record<EstadoPromesa, string> = {
  negociando: 'En negociación',
  acordada: 'Acordada',
  firmada: 'Firmada',
  cumplida: 'Cumplida',
  desistida: 'Desistida',
};

export const COLOR_ESTADO_PROMESA: Record<EstadoPromesa, string> = {
  negociando: 'bg-trato-50 text-trato-700',
  acordada: 'bg-cierre-50 text-cierre-700',
  firmada: 'bg-cierre-50 text-cierre-700',
  cumplida: 'bg-tinta/5 text-tinta-suave',
  desistida: 'bg-red-50 text-red-700',
};

export function formatearMonto(monto: number, moneda: 'clp' | 'uf'): string {
  const n = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(monto);
  return moneda === 'uf' ? `UF ${n}` : `$${n}`;
}

/**
 * Los marcadores que la plantilla no pudo llenar quedan entre llaves a la
 * vista. Un hueco visible se negocia; uno inventado se firma sin que nadie lo
 * note.
 */
export function marcadoresPendientes(texto: string): string[] {
  return [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
}
