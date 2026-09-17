import { Documento, type EstadoDocumento } from '../models/Documento';
import { Propiedad } from '../models/Propiedad';
import { CATALOGO, ETAPAS, POR_CODIGO, type Etapa } from '../dominio/documentos.catalogo';
import { ErrorApi } from '../utils/ErrorApi';

export interface ResumenEtapa {
  etapa: Etapa;
  total: number;
  recibidos: number;
  vencidos: number;
  completa: boolean;
}

export interface Informe {
  propiedadId: string;
  totalDocumentos: number;
  recibidos: number;
  vencidos: number;
  pendientes: number;
  avance: number;
  porEtapa: ResumenEtapa[];
  documentos: Record<string, unknown>[];
}

export async function informeDePropiedad(propiedadId: string): Promise<Informe> {
  const propiedad = await Propiedad.findByPk(propiedadId, {
    include: [{ model: Documento, as: 'documentos' }],
  });
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');

  const documentos = (propiedad.get('documentos') as Documento[] | undefined) ?? [];
  const vigentes = documentos.filter((d) => d.estado !== 'no_aplica');

  const recibidos = vigentes.filter((d) => d.estado === 'recibido' && !d.vencido);
  const vencidos = vigentes.filter((d) => d.vencido);

  const porEtapa: ResumenEtapa[] = ETAPAS.map((etapa) => {
    const deEtapa = vigentes.filter((d) => POR_CODIGO.get(d.codigo)?.etapa === etapa);
    const ok = deEtapa.filter((d) => d.estado === 'recibido' && !d.vencido);
    const mal = deEtapa.filter((d) => d.vencido);
    return {
      etapa,
      total: deEtapa.length,
      recibidos: ok.length,
      vencidos: mal.length,
      completa: deEtapa.length > 0 && ok.length === deEtapa.length,
    };
  }).filter((e) => e.total > 0);

  return {
    propiedadId,
    totalDocumentos: vigentes.length,
    recibidos: recibidos.length,
    vencidos: vencidos.length,
    pendientes: vigentes.length - recibidos.length,
    avance: vigentes.length > 0 ? Math.round((recibidos.length / vigentes.length) * 100) : 0,
    porEtapa,
    documentos: documentos.map((d) => d.toJSON()),
  };
}

export async function actualizarDocumento(
  documentoId: string,
  vendedorId: string,
  cambios: {
    estado?: EstadoDocumento;
    archivoUrl?: string | null;
    fechaEmision?: Date | null;
    observaciones?: string | null;
    costoClp?: number | null;
  },
): Promise<Documento> {
  const documento = await Documento.findByPk(documentoId, {
    include: [{ model: Propiedad, as: 'propiedad' }],
  });
  if (!documento) throw ErrorApi.noEncontrado('Documento no encontrado');

  const propiedad = documento.get('propiedad') as Propiedad | undefined;
  if (propiedad?.vendedorId !== vendedorId) {
    throw ErrorApi.prohibido('Este documento no es de una propiedad tuya');
  }

  if (cambios.estado === 'recibido' && !cambios.fechaEmision && !documento.fechaEmision) {
    throw ErrorApi.solicitudInvalida(
      'Un documento recibido necesita fecha de emisión para calcular su vigencia',
      'falta_fecha_emision',
    );
  }

  return documento.update(cambios);
}

export function catalogoPublico() {
  return CATALOGO.map((d) => ({
    codigo: d.codigo,
    nombre: d.nombre,
    emisor: d.emisor,
    responsable: d.responsable,
    etapa: d.etapa,
    vigenciaDias: d.vigenciaDias,
    condicional: d.condicional ?? null,
    comoSeObtiene: d.comoSeObtiene,
  }));
}
