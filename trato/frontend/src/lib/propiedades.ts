export const TIPOS_PROPIEDAD = [
  { valor: 'casa', etiqueta: 'Casa' },
  { valor: 'departamento', etiqueta: 'Departamento' },
  { valor: 'oficina', etiqueta: 'Oficina' },
  { valor: 'terreno', etiqueta: 'Terreno' },
  { valor: 'parcela', etiqueta: 'Parcela' },
  { valor: 'bodega', etiqueta: 'Bodega' },
  { valor: 'estacionamiento', etiqueta: 'Estacionamiento' },
] as const;

export const REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
] as const;

export const ETIQUETA_EMISOR: Record<string, string> = {
  cbr: 'Conservador de Bienes Raíces',
  sii: 'SII',
  tgr: 'Tesorería',
  municipalidad: 'Municipalidad',
  serviu: 'SERVIU',
  registro_civil: 'Registro Civil',
  notaria: 'Notaría',
  banco: 'Banco',
  tasador: 'Tasador',
  administracion_edificio: 'Administración del edificio',
  plataforma: 'Trato',
  parte: 'Comprador o vendedor',
};

export const ETIQUETA_ETAPA: Record<string, string> = {
  publicacion: 'Para publicar',
  oferta: 'Para recibir ofertas',
  promesa: 'Para la promesa',
  credito: 'Para el crédito',
  escritura: 'Para la escritura',
  inscripcion: 'Para inscribir',
};

export const ETIQUETA_ESTADO_DOC: Record<string, string> = {
  requerido: 'Por pedir',
  solicitado: 'Solicitado',
  en_tramite: 'En trámite',
  recibido: 'Recibido',
  rechazado: 'Rechazado',
  no_aplica: 'No aplica',
};

export interface DocumentoApi {
  id: string;
  codigo: string;
  nombre: string;
  estado: string;
  emisor: string;
  responsable: string;
  etapa: string;
  comoSeObtiene: string | null;
  fechaEmision: string | null;
  vencido: boolean;
  diasParaVencer: number | null;
  costoClp: number | null;
  validacion: 'sin_revisar' | 'en_revision' | 'aprobado' | 'observado';
  observacionNotaria: string | null;
  conforme: boolean;
}

export interface InformeApi {
  propiedadId: string;
  totalDocumentos: number;
  recibidos: number;
  aprobados: number;
  observados: number;
  vencidos: number;
  pendientes: number;
  avance: number;
  porEtapa: {
    etapa: string;
    total: number;
    recibidos: number;
    aprobados: number;
    vencidos: number;
    completa: boolean;
  }[];
  documentos: DocumentoApi[];
}

export interface PropiedadApi {
  id: string;
  titulo: string;
  tipo: string;
  estado: string;
  precio: number;
  moneda: 'clp' | 'uf';
  calle: string;
  numero: string;
  depto: string | null;
  comuna: string;
  region: string;
  dormitorios: number | null;
  banos: number | null;
  superficieConstruida: number | null;
  fotos?: string[];
}

/** La ficha pública completa: lo que devuelve `GET /propiedades/:id`. */
export interface PropiedadDetalle extends PropiedadApi {
  descripcion: string | null;
  superficieTotal: number | null;
  estacionamientos: number;
  bodegas: number;
  anoConstruccion: number | null;
  tieneHipoteca: boolean;
  latitud: number | null;
  longitud: number | null;
  fotos: string[];
  vendedor?: { nombre: string } | null;
  createdAt: string;
}

export const ETIQUETA_TIPO: Record<string, string> = Object.fromEntries(
  TIPOS_PROPIEDAD.map((t) => [t.valor, t.etiqueta]),
);

export function formatearPrecio(precio: number, moneda: 'clp' | 'uf'): string {
  const n = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(precio);
  return moneda === 'uf' ? `UF ${n}` : `$${n}`;
}

/**
 * Las superficies llegan como DECIMAL de Postgres ("148.00"), así que se
 * redondean antes de mostrarlas: nadie publica una casa de 148,00 m².
 */
export function formatearSuperficie(valor: number | string | null): string | null {
  if (valor === null || valor === '') return null;
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  return `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(n)} m²`;
}

export function direccionCorta(p: PropiedadApi): string {
  const depto = p.depto ? ` depto ${p.depto}` : '';
  return `${p.calle} ${p.numero}${depto}, ${p.comuna}`;
}
