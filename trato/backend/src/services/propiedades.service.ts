import { Op, type WhereOptions, type InferAttributes } from 'sequelize';
import { sequelize } from '../config/database';
import { Propiedad, type EstadoPropiedad, type TipoPropiedad } from '../models/Propiedad';
import { Documento } from '../models/Documento';
import { Usuario } from '../models/Usuario';
import { documentosAplicables } from '../dominio/documentos.catalogo';
import { ErrorApi } from '../utils/ErrorApi';

export interface FiltrosBusqueda {
  comuna?: string;
  tipo?: TipoPropiedad;
  precioMin?: number;
  precioMax?: number;
  dormitoriosMin?: number;
  pagina?: number;
  porPagina?: number;
}

export async function crear(
  vendedorId: string,
  datos: Record<string, unknown>,
): Promise<Propiedad> {
  return sequelize.transaction(async (t) => {
    const propiedad = await Propiedad.create(
      { ...datos, vendedorId } as InferAttributes<Propiedad>,
      { transaction: t },
    );

    // La carpeta de documentos nace junto con la propiedad: es lo que el
    // vendedor ve como "que me falta" desde el primer minuto.
    const aplicables = documentosAplicables({
      esDepartamento: propiedad.tipo === 'departamento',
      tieneHipoteca: propiedad.tieneHipoteca,
      compraConCredito: true, // hasta que haya comprador, asumimos el caso mas exigente
    });

    await Documento.bulkCreate(
      aplicables.map((d) => ({ propiedadId: propiedad.id, codigo: d.codigo })),
      { transaction: t },
    );

    return propiedad;
  });
}

export async function buscar(filtros: FiltrosBusqueda) {
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = Math.min(50, Math.max(1, filtros.porPagina ?? 20));

  const where: WhereOptions<InferAttributes<Propiedad>> = { estado: 'publicada' };

  if (filtros.comuna) Object.assign(where, { comuna: { [Op.iLike]: filtros.comuna } });
  if (filtros.tipo) Object.assign(where, { tipo: filtros.tipo });
  if (filtros.dormitoriosMin) {
    Object.assign(where, { dormitorios: { [Op.gte]: filtros.dormitoriosMin } });
  }
  if (filtros.precioMin != null || filtros.precioMax != null) {
    const rango: Record<symbol, number> = {};
    if (filtros.precioMin != null) rango[Op.gte] = filtros.precioMin;
    if (filtros.precioMax != null) rango[Op.lte] = filtros.precioMax;
    Object.assign(where, { precio: rango });
  }

  const { rows, count } = await Propiedad.findAndCountAll({
    where,
    limit: porPagina,
    offset: (pagina - 1) * porPagina,
    order: [['createdAt', 'DESC']],
  });

  return { propiedades: rows, total: count, pagina, porPagina };
}

export async function obtener(id: string): Promise<Propiedad> {
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      { model: Documento, as: 'documentos' },
      { model: Usuario, as: 'vendedor', attributes: ['id', 'nombre', 'apellido'] },
    ],
  });
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
  return propiedad;
}

export async function listarDeVendedor(vendedorId: string): Promise<Propiedad[]> {
  return Propiedad.findAll({
    where: { vendedorId },
    include: [{ model: Documento, as: 'documentos' }],
    order: [['createdAt', 'DESC']],
  });
}

async function exigirPropia(id: string, vendedorId: string): Promise<Propiedad> {
  const propiedad = await Propiedad.findByPk(id);
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
  if (propiedad.vendedorId !== vendedorId) {
    throw ErrorApi.prohibido('Esta propiedad no es tuya');
  }
  return propiedad;
}

export async function actualizar(
  id: string,
  vendedorId: string,
  cambios: Record<string, unknown>,
): Promise<Propiedad> {
  const propiedad = await exigirPropia(id, vendedorId);
  return propiedad.update(cambios);
}

export async function cambiarEstado(
  id: string,
  vendedorId: string,
  estado: EstadoPropiedad,
): Promise<Propiedad> {
  const propiedad = await exigirPropia(id, vendedorId);
  return propiedad.update({ estado });
}
