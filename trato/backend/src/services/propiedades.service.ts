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
import { redondearSector } from '../utils/geo';
import { ErrorApi } from '../utils/ErrorApi';

export interface FiltrosBusqueda {
  comuna?: string;
  tipo?: TipoPropiedad;
  moneda?: Moneda;
  precioMin?: number;
  precioMax?: number;
  dormitoriosMin?: number;
  superficieMin?: number;
  estacionamientosMin?: number;
  conBodega?: boolean;
  /** Recorte del mapa (vista actual), para refrescar la lista al mover/zoom. */
  bbox?: { norte: number; sur: number; este: number; oeste: number };
  ordenar?: 'recientes' | 'precio_asc' | 'precio_desc';
  pagina?: number;
  porPagina?: number;
}

/**
 * Lo que nadie fuera del dueño, su notaría o el equipo interno necesita ver:
 * identificadores internos y antecedentes de inscripción/avalúo, que van en
 * el informe pagado, no en la vitrina. Comparte lista `obtenerPublica` (la
 * ficha) y `buscar` (el listado) -- antes `buscar` no excluía nada.
 */
const ATRIBUTOS_INTERNOS = [
  'fojas',
  'numeroInscripcion',
  'anoInscripcion',
  'rolAvaluo',
  'avaluoFiscalCache',
  'contribucionesCache',
  'vendedorId',
  'notariaId',
  'conservadorId',
] as const;

function conSectorAproximado(propiedad: Propiedad): Propiedad {
  propiedad.setDataValue('latitud', redondearSector(propiedad.latitud));
  propiedad.setDataValue('longitud', redondearSector(propiedad.longitud));
  return propiedad;
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

const ORDEN: Record<NonNullable<FiltrosBusqueda['ordenar']>, [string, string][]> = {
  recientes: [['createdAt', 'DESC']],
  precio_asc: [['precio', 'ASC']],
  precio_desc: [['precio', 'DESC']],
};

export async function buscar(filtros: FiltrosBusqueda) {
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = Math.min(50, Math.max(1, filtros.porPagina ?? 20));

  const where: WhereOptions<InferAttributes<Propiedad>> = { estado: 'publicada' };

  if (filtros.comuna) Object.assign(where, { comuna: { [Op.iLike]: filtros.comuna } });
  if (filtros.tipo) Object.assign(where, { tipo: filtros.tipo });
  if (filtros.dormitoriosMin) {
    Object.assign(where, { dormitorios: { [Op.gte]: filtros.dormitoriosMin } });
  }
  if (filtros.superficieMin) {
    Object.assign(where, { superficieConstruida: { [Op.gte]: filtros.superficieMin } });
  }
  if (filtros.estacionamientosMin) {
    Object.assign(where, { estacionamientos: { [Op.gte]: filtros.estacionamientosMin } });
  }
  if (filtros.conBodega) Object.assign(where, { bodegas: { [Op.gte]: 1 } });
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

  // El recorte del mapa filtra sobre la coordenada real en BD, no sobre el
  // sector redondeado que se devuelve: filtrar por el valor ya redondeado
  // dejaría fuera propiedades que sí están dentro del recuadro visible.
  if (filtros.bbox) {
    Object.assign(where, {
      latitud: { [Op.between]: [filtros.bbox.sur, filtros.bbox.norte] },
      longitud: { [Op.between]: [filtros.bbox.oeste, filtros.bbox.este] },
    });
  }

  const { rows, count } = await Propiedad.findAndCountAll({
    where,
    attributes: { exclude: [...ATRIBUTOS_INTERNOS] },
    limit: porPagina,
    offset: (pagina - 1) * porPagina,
    order: ORDEN[filtros.ordenar ?? 'recientes'],
  });

  return { propiedades: rows.map(conSectorAproximado), total: count, pagina, porPagina };
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
    attributes: { exclude: [...ATRIBUTOS_INTERNOS] },
    include: [{ model: Usuario, as: 'vendedor', attributes: ['nombre'] }],
  });

  if (!propiedad || !['publicada', 'reservada', 'vendida'].includes(propiedad.estado)) {
    throw ErrorApi.noEncontrado('Propiedad no encontrada');
  }
  // La coordenada exacta tampoco va en la ficha pública, por la misma razón
  // que la dirección exacta: mandar el punto real en el JSON y sólo dibujar
  // un círculo en el cliente (lo que hacía antes `MapaPropiedad`) no protege
  // nada -- cualquiera que mire la respuesta cruda ve la ubicación exacta.
  return conSectorAproximado(propiedad);
}

/**
 * Lo mismo que `obtenerPublica`, salvo para quien tiene derecho a ver todo: así
 * el dueño puede abrir su propia ficha aunque esté en borrador, y no se le
 * responde 404 sobre su propia propiedad.
 */
export async function obtenerParaVisitante(
  id: string,
  usuarioId: string,
): Promise<Propiedad> {
  try {
    await exigirAccesoAlExpediente(id, usuarioId);
  } catch {
    return obtenerPublica(id);
  }
  return obtener(id);
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
  // "Vendida" no se declara: se fija sola cuando la notaría aprueba la
  // inscripción de dominio, porque recién ahí se transfiere de verdad (ver
  // dominio/escritura.ts). Permitir que el vendedor la marque a mano dejaría
  // una propiedad "vendida" sin escritura ni inscripción detrás.
  if (estado === 'vendida') {
    throw ErrorApi.solicitudInvalida(
      'El estado "vendida" no se marca a mano: se fija solo cuando la notaría aprueba la inscripción de dominio.',
      'vendida_no_manual',
    );
  }
  return propiedad.update({ estado });
}
