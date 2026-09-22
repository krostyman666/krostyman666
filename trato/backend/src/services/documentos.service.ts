import { Documento, type EstadoDocumento } from '../models/Documento';
import { Propiedad } from '../models/Propiedad';
import { CATALOGO, ETAPAS, POR_CODIGO, type Etapa } from '../dominio/documentos.catalogo';
import { ErrorApi } from '../utils/ErrorApi';
import { LIMITE_BYTES, MIMES_ACEPTADOS, ETIQUETAS_ACEPTADAS, tipoRealDe } from '../dominio/archivos';
import * as almacenamiento from './almacenamiento.service';
import { exigirAccesoAlExpediente } from './propiedades.service';

export interface ResumenEtapa {
  etapa: Etapa;
  total: number;
  recibidos: number;
  aprobados: number;
  vencidos: number;
  completa: boolean;
}

export interface Informe {
  propiedadId: string;
  totalDocumentos: number;
  /** Papeles que tenemos, vigentes. Es lo que el vendedor controla. */
  recibidos: number;
  /** De esos, los que la notaría revisó y aprobó. Es la puerta final. */
  aprobados: number;
  observados: number;
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
  const aprobados = vigentes.filter((d) => d.conforme);
  const observados = vigentes.filter((d) => d.validacion === 'observado');
  const vencidos = vigentes.filter((d) => d.vencido);

  const porEtapa: ResumenEtapa[] = ETAPAS.map((etapa) => {
    const deEtapa = vigentes.filter((d) => POR_CODIGO.get(d.codigo)?.etapa === etapa);
    const ok = deEtapa.filter((d) => d.estado === 'recibido' && !d.vencido);
    const listos = deEtapa.filter((d) => d.conforme);
    return {
      etapa,
      total: deEtapa.length,
      recibidos: ok.length,
      aprobados: listos.length,
      vencidos: deEtapa.filter((d) => d.vencido).length,
      completa: deEtapa.length > 0 && listos.length === deEtapa.length,
    };
  }).filter((e) => e.total > 0);

  return {
    propiedadId,
    totalDocumentos: vigentes.length,
    recibidos: recibidos.length,
    aprobados: aprobados.length,
    observados: observados.length,
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

/**
 * Sube el archivo de un documento del expediente.
 *
 * Subir un archivo es, de un tirón, marcar el documento como recibido: tener el
 * papel es justamente lo que "recibido" significa. Por eso acá se fija también
 * la fecha de emisión, que es la que gobierna la vigencia. Cambiar el archivo
 * hace que la notaría tenga que revisar de nuevo (hook del modelo): lo que
 * aprobó antes ya no es lo que está en el expediente.
 */
export async function subirArchivo(
  documentoId: string,
  vendedorId: string,
  contenido: Buffer,
  tipoDeclarado: string,
  fechaEmision: Date,
): Promise<Documento> {
  const documento = await Documento.findByPk(documentoId, {
    include: [{ model: Propiedad, as: 'propiedad' }],
  });
  if (!documento) throw ErrorApi.noEncontrado('Documento no encontrado');

  const propiedad = documento.get('propiedad') as Propiedad | undefined;
  if (propiedad?.vendedorId !== vendedorId) {
    throw ErrorApi.prohibido('Este documento no es de una propiedad tuya');
  }

  if (contenido.length === 0) {
    throw ErrorApi.solicitudInvalida('El archivo llegó vacío', 'archivo_vacio');
  }
  if (contenido.length > LIMITE_BYTES) {
    throw ErrorApi.solicitudInvalida(
      `El archivo pesa más de ${Math.round(LIMITE_BYTES / 1024 / 1024)} MB`,
      'archivo_grande',
    );
  }

  // El tipo se decide por el contenido, no por lo que declara el cliente. Si no
  // coinciden, se rechaza: o el archivo no es lo que dice ser, o está corrupto.
  const tipoReal = tipoRealDe(contenido);
  if (!tipoReal) {
    throw ErrorApi.solicitudInvalida(
      `El archivo no es un formato aceptado. Se aceptan ${ETIQUETAS_ACEPTADAS}.`,
      'tipo_no_aceptado',
    );
  }
  if (!MIMES_ACEPTADOS.includes(tipoDeclarado) || tipoDeclarado !== tipoReal.mime) {
    throw ErrorApi.solicitudInvalida(
      `El archivo dice ser ${tipoDeclarado || 'de tipo desconocido'} pero su contenido es ${tipoReal.etiqueta}.`,
      'tipo_incoherente',
    );
  }

  const anterior = documento.archivoUrl;
  const guardado = await almacenamiento.guardar(
    propiedad.id,
    documento.id,
    contenido,
    tipoReal.mime,
  );

  const actualizado = await documento.update({
    archivoUrl: guardado.clave,
    estado: 'recibido',
    fechaEmision,
  });

  // El archivo viejo se borra después de que el nuevo quedó guardado y la fila
  // apunta a él: si algo falla antes, el vendedor conserva el que tenía.
  await almacenamiento.eliminar(anterior);

  return actualizado;
}

/**
 * Entrega el archivo para descargarlo, tras confirmar que quien pide tiene
 * acceso al expediente: el dueño, la notaría a cargo de esa operación o el
 * equipo interno. Un comprador no, ni con sesión. Va por acá y no por una URL
 * estática justamente para que ese control exista.
 */
export async function descargarArchivo(
  documentoId: string,
  usuarioId: string,
): Promise<{ contenido: Buffer; tipo: string; nombre: string }> {
  const documento = await Documento.findByPk(documentoId);
  if (!documento) throw ErrorApi.noEncontrado('Documento no encontrado');
  if (!documento.archivoUrl) throw ErrorApi.noEncontrado('Este documento no tiene archivo');

  await exigirAccesoAlExpediente(documento.propiedadId, usuarioId);

  const contenido = await almacenamiento.leer(documento.archivoUrl);
  const tipoReal = tipoRealDe(contenido);
  const def = POR_CODIGO.get(documento.codigo);
  const base = (def?.nombre ?? documento.codigo).replace(/[^\w.-]+/g, '_');

  return {
    contenido,
    tipo: tipoReal?.mime ?? 'application/octet-stream',
    nombre: `${base}.${documento.archivoUrl.split('.').pop() ?? 'bin'}`,
  };
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
