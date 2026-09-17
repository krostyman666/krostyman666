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
}

export function formatearPrecio(precio: number, moneda: 'clp' | 'uf'): string {
  const n = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(precio);
  return moneda === 'uf' ? `UF ${n}` : `$${n}`;
}

export function direccionCorta(p: PropiedadApi): string {
  const depto = p.depto ? ` depto ${p.depto}` : '';
  return `${p.calle} ${p.numero}${depto}, ${p.comuna}`;
}
