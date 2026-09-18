import { Op } from 'sequelize';
import { Socio } from '../models/Socio';
import { Propiedad } from '../models/Propiedad';
import { Documento, type Validacion } from '../models/Documento';
import { Usuario } from '../models/Usuario';
import { ErrorApi } from '../utils/ErrorApi';

export async function listarSocios(
  tipo?: 'notaria' | 'conservador',
  comuna?: string,
): Promise<Socio[]> {
  const where: Record<string, unknown> = { activo: true };
  if (tipo) where.tipo = tipo;
  if (comuna) where.comuna = { [Op.iLike]: comuna };
  return Socio.findAll({ where, order: [['nombre', 'ASC']] });
}

export async function asignarNotaria(
  propiedadId: string,
  vendedorId: string,
  notariaId: string,
): Promise<Propiedad> {
  const propiedad = await Propiedad.findByPk(propiedadId);
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
  if (propiedad.vendedorId !== vendedorId) throw ErrorApi.prohibido('Esta propiedad no es tuya');

  const notaria = await Socio.findByPk(notariaId);
  if (!notaria || notaria.tipo !== 'notaria') {
    throw ErrorApi.solicitudInvalida('Esa notaría no existe', 'notaria_invalida');
  }
  if (!notaria.activo) {
    throw ErrorApi.solicitudInvalida('Esa notaría no está operativa', 'notaria_inactiva');
  }

  return propiedad.update({ notariaId });
}

async function socioDelUsuario(usuarioId: string): Promise<string> {
  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario) throw ErrorApi.noAutorizado();
  if (usuario.rol !== 'notaria' || !usuario.socioId) {
    throw ErrorApi.prohibido('Tu cuenta no está asociada a una notaría');
  }
  return usuario.socioId;
}

export interface CasoBandeja {
  propiedad: {
    id: string;
    titulo: string;
    calle: string;
    numero: string;
    comuna: string;
    estado: string;
  };
  // El RUT queda nulo si el vendedor ejerció su derecho de supresión.
  vendedor: { id: string; nombre: string; apellido: string; rut: string | null } | null;
  totalDocumentos: number;
  porRevisar: number;
  observados: number;
  aprobados: number;
  documentos: Record<string, unknown>[];
}

/** Lo que esta notaría tiene pendiente de revisar, propiedad por propiedad. */
export async function bandeja(usuarioId: string): Promise<CasoBandeja[]> {
  const notariaId = await socioDelUsuario(usuarioId);

  const propiedades = await Propiedad.findAll({
    where: { notariaId },
    include: [
      { model: Documento, as: 'documentos' },
      { model: Usuario, as: 'vendedor', attributes: ['id', 'nombre', 'apellido', 'rut'] },
    ],
    order: [['updatedAt', 'DESC']],
  });

  return propiedades.map((p) => {
    const docs = (p.get('documentos') as Documento[] | undefined) ?? [];
    const aplican = docs.filter((d) => d.estado !== 'no_aplica');
    const porRevisar = aplican.filter(
      (d) => d.estado === 'recibido' && !d.vencido && d.validacion === 'sin_revisar',
    );
    const observados = aplican.filter((d) => d.validacion === 'observado');

    return {
      propiedad: {
        id: p.id,
        titulo: p.titulo,
        calle: p.calle,
        numero: p.numero,
        comuna: p.comuna,
        estado: p.estado,
      },
      vendedor: (p.get('vendedor') as CasoBandeja['vendedor']) ?? null,
      totalDocumentos: aplican.length,
      porRevisar: porRevisar.length,
      observados: observados.length,
      aprobados: aplican.filter((d) => d.conforme).length,
      documentos: porRevisar.map((d) => d.toJSON()),
    };
  });
}

export async function validarDocumento(
  documentoId: string,
  usuarioId: string,
  validacion: Validacion,
  observacionNotaria?: string | null,
): Promise<Documento> {
  const notariaId = await socioDelUsuario(usuarioId);

  const documento = await Documento.findByPk(documentoId, {
    include: [{ model: Propiedad, as: 'propiedad' }],
  });
  if (!documento) throw ErrorApi.noEncontrado('Documento no encontrado');

  const propiedad = documento.get('propiedad') as Propiedad | undefined;
  if (propiedad?.notariaId !== notariaId) {
    throw ErrorApi.prohibido('Esta propiedad no está asignada a tu notaría');
  }

  if (documento.estado !== 'recibido') {
    throw ErrorApi.solicitudInvalida(
      'Todavía no está el documento: no hay nada que revisar',
      'documento_no_recibido',
    );
  }

  if (validacion === 'observado' && !observacionNotaria?.trim()) {
    throw ErrorApi.solicitudInvalida(
      'Para observar un documento hay que decir qué corregir',
      'falta_observacion',
    );
  }

  return documento.update({
    validacion,
    validadoPorId: usuarioId,
    validadoEn: new Date(),
    observacionNotaria: validacion === 'observado' ? observacionNotaria?.trim() : null,
  });
}

/**
 * El expediente está listo para escriturar cuando la notaría aprobó todo lo que
 * corresponde antes de la firma. La escritura y la inscripción quedan fuera:
 * son el resultado, no un requisito.
 */
export async function listoParaEscriturar(propiedadId: string) {
  const propiedad = await Propiedad.findByPk(propiedadId, {
    include: [{ model: Documento, as: 'documentos' }],
  });
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');

  const docs = (propiedad.get('documentos') as Documento[] | undefined) ?? [];
  const previos = docs.filter(
    (d) =>
      d.estado !== 'no_aplica' &&
      !['escritura_compraventa', 'inscripcion_dominio'].includes(d.codigo),
  );

  const faltantes = previos.filter((d) => !d.conforme);

  return {
    listo: faltantes.length === 0 && previos.length > 0,
    tieneNotaria: Boolean(propiedad.notariaId),
    faltan: faltantes.map((d) => ({
      codigo: d.codigo,
      estado: d.estado,
      validacion: d.validacion,
      vencido: d.vencido,
      observacionNotaria: d.observacionNotaria,
    })),
  };
}
