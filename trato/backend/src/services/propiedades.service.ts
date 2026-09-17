import { Op, type WhereOptions, type InferAttributes } from 'sequelize';
import { sequelize } from '../config/database';
import {
  Propiedad,
  type EstadoPropiedad,
  type Moneda,
  type TipoPropiedad,
} from '../models/Propiedad';
import { Documento } from '../models/Documento';
import { Usuario } from '../models/Usuario';
import { documentosAplicables } from '../dominio/documentos.catalogo';
import { ErrorApi } from '../utils/ErrorApi';

export interface FiltrosBusqueda {
  comuna?: string;
  tipo?: TipoPropiedad;
  moneda?: Moneda;
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
  if (filtros.moneda) Object.assign(where, { moneda: filtros.moneda });

  if (filtros.precioMin != null || filtros.precioMax != null) {
    const rango: Record<symbol, number> = {};
    if (filtros.precioMin != null) rango[Op.gte] = filtros.precioMin;
    if (filtros.precioMax != null) rango[Op.lte] = filtros.precioMax;
    Object.assign(where, { precio: rango });

    // `precio` guarda el número sin la moneda, así que un rango suelto mezcla
    // UF con pesos y "hasta 5000" devolvería casas de UF 5.000 junto a otras de
    // $5.000. Mientras no exista una columna normalizada, el rango se ancla a
    // una moneda: UF por defecto, que es como se publica en Chile.
    if (!filtros.moneda) Object.assign(where, { moneda: 'uf' });
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

/**
 * La ficha que ve cualquiera que abre el link, sin sesión.
 *
 * No trae el expediente: el estado de los papeles y las observaciones de la
 * notaría son del vendedor, y el detalle legal del inmueble es justamente lo
 * que el comprador paga en el informe. Servirlo aquí lo regalaría y además
 * expondría al vendedor.
 */
export async function obtenerPublica(id: string): Promise<Propiedad> {
  const propiedad = await Propiedad.findByPk(id, {
    attributes: {
      exclude: [
        // Antecedentes de la inscripción: van en el informe, no en la vitrina.
        'fojas',
        'numeroInscripcion',
        'anoInscripcion',
        'rolAvaluo',
        // Identificadores internos que no le sirven a quien mira la ficha.
        'vendedorId',
        'notariaId',
        'conservadorId',
      ],
    },
    include: [{ model: Usuario, as: 'vendedor', attributes: ['nombre'] }],
  });

  if (!propiedad || !['publicada', 'reservada', 'vendida'].includes(propiedad.estado)) {
    throw ErrorApi.noEncontrado('Propiedad no encontrada');
  }
  return propiedad;
}

/**
 * Quién puede ver el expediente: el dueño, la notaría a cargo de esa operación
 * y el equipo interno. Un comprador no, ni siquiera con sesión.
 */
export async function exigirAccesoAlExpediente(
  propiedadId: string,
  usuarioId: string,
): Promise<Propiedad> {
  const propiedad = await Propiedad.findByPk(propiedadId);
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
  if (propiedad.vendedorId === usuarioId) return propiedad;

  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario) throw ErrorApi.noAutorizado();

  if (usuario.rol === 'admin' || usuario.rol === 'asesor') return propiedad;
  if (usuario.rol === 'notaria' && usuario.socioId && usuario.socioId === propiedad.notariaId) {
    return propiedad;
  }

  throw ErrorApi.prohibido('No tienes acceso al expediente de esta propiedad');
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
