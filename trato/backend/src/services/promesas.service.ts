import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Promesa } from '../models/Promesa';
import { ClausulaPromesa } from '../models/ClausulaPromesa';
import { Propiedad } from '../models/Propiedad';
import { Usuario } from '../models/Usuario';
import { ErrorApi } from '../utils/ErrorApi';
import {
  CLAUSULAS,
  CLAUSULA_POR_CODIGO,
  clausulasObligatorias,
  estaCompleta,
  marcadoresPendientes,
  verificar1554,
  type EstadoRequisito,
} from '../dominio/promesa';

const ESTADOS_ABIERTOS = ['negociando', 'acordada'];

function formatearPrecio(monto: number, moneda: string): string {
  const n = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(monto);
  return moneda === 'uf' ? `UF ${n}` : `$${n}`;
}

/**
 * Rellena la plantilla con lo que ya sabemos. Lo que no sabemos queda con su
 * marcador entre llaves a la vista: un hueco visible se negocia, uno inventado
 * se firma sin que nadie lo note.
 */
function armarTexto(codigo: string, propiedad: Propiedad, promesa: Promesa): string {
  const def = CLAUSULA_POR_CODIGO.get(codigo);
  if (!def) throw ErrorApi.solicitudInvalida('Cláusula desconocida');

  const depto = propiedad.depto ? ` depto ${propiedad.depto}` : '';
  const valores: Record<string, string | null> = {
    direccion: `${propiedad.calle} ${propiedad.numero}${depto}`,
    comuna: propiedad.comuna,
    fojas: propiedad.fojas,
    numero: propiedad.numeroInscripcion,
    ano: propiedad.anoInscripcion === null ? null : String(propiedad.anoInscripcion),
    rol: propiedad.rolAvaluo,
    conservador: propiedad.comuna,
    precio: formatearPrecio(promesa.precio, promesa.moneda),
    pie: promesa.pie === null ? null : formatearPrecio(promesa.pie, promesa.moneda),
    saldo:
      promesa.pie === null
        ? null
        : formatearPrecio(promesa.precio - promesa.pie, promesa.moneda),
  };

  return def.plantilla.replace(/\{(\w+)\}/g, (marcador, clave: string) => {
    const valor = valores[clave];
    return valor ? valor : marcador;
  });
}

async function cargar(promesaId: string): Promise<Promesa> {
  const promesa = await Promesa.findByPk(promesaId, {
    include: [
      { model: ClausulaPromesa, as: 'clausulas' },
      { model: Propiedad, as: 'propiedad' },
    ],
  });
  if (!promesa) throw ErrorApi.noEncontrado('Promesa no encontrada');
  return promesa;
}

function exigirParte(promesa: Promesa, usuarioId: string): 'comprador' | 'vendedor' {
  if (promesa.compradorId === usuarioId) return 'comprador';
  if (promesa.vendedorId === usuarioId) return 'vendedor';
  throw ErrorApi.prohibido('Esta promesa no es tuya');
}

export async function abrir(
  propiedadId: string,
  compradorId: string,
  datos: { precio: number; pie?: number; fechaEscritura?: string },
): Promise<Promesa> {
  const propiedad = await Propiedad.findByPk(propiedadId);
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
  if (propiedad.vendedorId === compradorId) {
    throw ErrorApi.solicitudInvalida('Esta propiedad es tuya');
  }
  if (!['publicada', 'reservada'].includes(propiedad.estado)) {
    throw ErrorApi.conflicto('Esta propiedad no está disponible');
  }
  if (datos.pie !== undefined && datos.pie >= datos.precio) {
    throw ErrorApi.solicitudInvalida('El pie no puede ser igual o mayor que el precio');
  }

  const abierta = await Promesa.findOne({
    where: { propiedadId, compradorId, estado: { [Op.in]: ESTADOS_ABIERTOS } },
  });
  if (abierta) return cargar(abierta.id);

  return sequelize.transaction(async (t) => {
    const promesa = await Promesa.create(
      {
        propiedadId,
        compradorId,
        vendedorId: propiedad.vendedorId,
        precio: datos.precio,
        moneda: propiedad.moneda,
        pie: datos.pie ?? null,
        fechaEscritura: datos.fechaEscritura ? new Date(datos.fechaEscritura) : null,
      },
      { transaction: t },
    );

    // Las obligatorias nacen con la promesa: sin ellas no hay nada que negociar
    // y la promesa sería nula. Las propone el comprador, que es quien abre.
    const obligatorias = clausulasObligatorias(propiedad.tieneHipoteca);
    await ClausulaPromesa.bulkCreate(
      obligatorias.map((def, i) => ({
        promesaId: promesa.id,
        codigo: def.codigo,
        texto: armarTexto(def.codigo, propiedad, promesa),
        orden: i,
        propuestaPorId: compradorId,
      })),
      { transaction: t },
    );

    return promesa;
  });
}

export interface EstadoNegociacion {
  requisitos: EstadoRequisito[];
  cumpleElArticulo: boolean;
  clausulasPendientes: string[];
  puedeAcordarse: boolean;
}

function evaluar(promesa: Promesa): EstadoNegociacion {
  const clausulas = (promesa.get('clausulas') as ClausulaPromesa[] | undefined) ?? [];
  const propiedad = promesa.get('propiedad') as Propiedad | undefined;

  // Una cláusula con marcadores sin llenar no cuenta, aunque esté aceptada: el
  // 1554 Nº4 exige que el contrato prometido esté especificado, y "{fojas}" no
  // especifica nada.
  const tiene = (codigo: string) =>
    clausulas.some(
      (c) => c.codigo === codigo && c.aceptadaPorId !== null && estaCompleta(c.texto),
    );

  const requisitos = verificar1554({
    tienePrecio: promesa.precio > 0,
    tieneFormaPago: tiene('precio_y_pago'),
    tieneIndividualizacion: tiene('individualizacion'),
    // El plazo del 1554 Nº3 se satisface con fecha cierta o con la condición
    // suspensiva del crédito, que también fija la época.
    tienePlazoOCondicion:
      (promesa.fechaEscritura !== null && tiene('plazo')) || tiene('condicion_credito'),
    hipotecaSinResolver: Boolean(propiedad?.tieneHipoteca) && !tiene('alzamiento'),
  });

  // Una aceptada con huecos también queda pendiente: si no, el acuerdo se
  // bloquea sin que se vea por qué.
  const pendientes = clausulas
    .filter((c) => c.aceptadaPorId === null || !estaCompleta(c.texto))
    .map((c) => CLAUSULA_POR_CODIGO.get(c.codigo)?.titulo ?? c.codigo);

  const cumple = requisitos.every((r) => r.cumplido);

  return {
    requisitos,
    cumpleElArticulo: cumple,
    clausulasPendientes: pendientes,
    puedeAcordarse: cumple && pendientes.length === 0,
  };
}

export async function obtener(promesaId: string, usuarioId: string) {
  const promesa = await cargar(promesaId);
  exigirParte(promesa, usuarioId);
  return { promesa, negociacion: evaluar(promesa), catalogo: CLAUSULAS };
}

export async function misPromesas(usuarioId: string): Promise<Promesa[]> {
  return Promesa.findAll({
    where: { [Op.or]: [{ compradorId: usuarioId }, { vendedorId: usuarioId }] },
    include: [
      { model: Propiedad, as: 'propiedad', attributes: ['id', 'titulo', 'comuna'] },
      { model: Usuario, as: 'comprador', attributes: ['id', 'nombre', 'apellido'] },
      { model: Usuario, as: 'vendedor', attributes: ['id', 'nombre', 'apellido'] },
    ],
    order: [['createdAt', 'DESC']],
  });
}

function exigirNegociando(promesa: Promesa): void {
  if (promesa.estado !== 'negociando') {
    throw ErrorApi.conflicto(
      promesa.estado === 'acordada'
        ? 'La promesa ya está acordada. Para cambiarla hay que reabrir la negociación.'
        : 'Esta promesa ya no se puede modificar',
    );
  }
}

export async function proponerClausula(
  promesaId: string,
  usuarioId: string,
  codigo: string,
  texto: string,
  comentario?: string,
): Promise<ClausulaPromesa> {
  const promesa = await cargar(promesaId);
  exigirParte(promesa, usuarioId);
  exigirNegociando(promesa);

  if (!CLAUSULA_POR_CODIGO.has(codigo)) {
    throw ErrorApi.solicitudInvalida('Cláusula desconocida');
  }

  const existente = await ClausulaPromesa.findOne({ where: { promesaId, codigo } });

  if (existente) {
    // El hook del modelo se encarga de anular la aceptación anterior.
    return existente.update({ texto, propuestaPorId: usuarioId, comentario: comentario ?? null });
  }

  const cuantas = await ClausulaPromesa.count({ where: { promesaId } });
  return ClausulaPromesa.create({
    promesaId,
    codigo,
    texto,
    orden: cuantas,
    propuestaPorId: usuarioId,
    comentario: comentario ?? null,
  });
}

export async function aceptarClausula(
  clausulaId: string,
  usuarioId: string,
): Promise<ClausulaPromesa> {
  const clausula = await ClausulaPromesa.findByPk(clausulaId);
  if (!clausula) throw ErrorApi.noEncontrado('Cláusula no encontrada');

  const promesa = await cargar(clausula.promesaId);
  exigirParte(promesa, usuarioId);
  exigirNegociando(promesa);

  // Quien propuso el texto ya está de acuerdo con él; aceptarlo de nuevo
  // cerraría la cláusula sin que la contraparte la haya visto.
  if (clausula.propuestaPorId === usuarioId) {
    throw ErrorApi.solicitudInvalida('Esta cláusula la propusiste tú: falta que la acepte la otra parte');
  }

  const huecos = marcadoresPendientes(clausula.texto);
  if (huecos.length > 0) {
    throw ErrorApi.solicitudInvalida(
      `Esta cláusula todavía tiene datos sin llenar: ${huecos.join(', ')}. Aceptar un texto con huecos deja la promesa sin especificar.`,
      'clausula_incompleta',
    );
  }
  if (clausula.aceptadaPorId !== null) return clausula;

  return clausula.update({ aceptadaPorId: usuarioId, aceptadaEn: new Date() });
}

export async function quitarClausula(
  clausulaId: string,
  usuarioId: string,
): Promise<void> {
  const clausula = await ClausulaPromesa.findByPk(clausulaId);
  if (!clausula) throw ErrorApi.noEncontrado('Cláusula no encontrada');

  const promesa = await cargar(clausula.promesaId);
  exigirParte(promesa, usuarioId);
  exigirNegociando(promesa);

  const def = CLAUSULA_POR_CODIGO.get(clausula.codigo);
  if (def?.tipo === 'obligatoria') {
    throw ErrorApi.solicitudInvalida(
      `"${def.titulo}" no se puede quitar: sin ella la promesa sería nula.`,
    );
  }

  await clausula.destroy();
}

/**
 * Cierra la negociación.
 *
 * No basta con que las partes estén de acuerdo: se vuelven a verificar los
 * cuatro requisitos del 1554 acá, porque este es el punto donde la promesa deja
 * de ser un borrador. Dejar pasar una promesa nula es peor que no tener promesa.
 */
export async function acordar(promesaId: string, usuarioId: string): Promise<Promesa> {
  const promesa = await cargar(promesaId);
  exigirParte(promesa, usuarioId);
  exigirNegociando(promesa);

  const estado = evaluar(promesa);
  if (!estado.cumpleElArticulo) {
    const faltas = estado.requisitos
      .filter((r) => !r.cumplido)
      .map((r) => `${r.numeral}: ${r.falta}`)
      .join(' ');
    throw ErrorApi.conflicto(`La promesa todavía sería nula. ${faltas}`, 'requisitos_1554');
  }
  if (estado.clausulasPendientes.length > 0) {
    throw ErrorApi.conflicto(
      `Faltan cláusulas por aceptar: ${estado.clausulasPendientes.join(', ')}.`,
      'clausulas_pendientes',
    );
  }

  return promesa.update({ estado: 'acordada', acordadaEn: new Date() });
}

export async function reabrir(promesaId: string, usuarioId: string): Promise<Promesa> {
  const promesa = await cargar(promesaId);
  exigirParte(promesa, usuarioId);
  if (promesa.estado !== 'acordada') {
    throw ErrorApi.conflicto('Sólo una promesa acordada y sin firmar se puede reabrir');
  }
  return promesa.update({ estado: 'negociando', acordadaEn: null });
}

export async function desistir(
  promesaId: string,
  usuarioId: string,
  motivo: string,
): Promise<Promesa> {
  const promesa = await cargar(promesaId);
  exigirParte(promesa, usuarioId);
  if (promesa.estado === 'firmada' || promesa.estado === 'cumplida') {
    throw ErrorApi.conflicto(
      'Una promesa firmada no se deshace por acá: eso lo rigen las arras y la multa que pactaron.',
    );
  }
  return promesa.update({ estado: 'desistida', cerradaEn: new Date(), motivoCierre: motivo });
}

/** La revisión del abogado antes de la firma. */
export async function revisar(promesaId: string, abogadoId: string): Promise<Promesa> {
  const promesa = await cargar(promesaId);
  if (promesa.estado !== 'acordada') {
    throw ErrorApi.conflicto('Sólo se revisa una promesa acordada');
  }

  const abogado = await Usuario.findByPk(abogadoId);
  if (!abogado || (abogado.rol !== 'abogado' && abogado.rol !== 'admin')) {
    throw ErrorApi.prohibido('Sólo un abogado revisa la promesa');
  }
  if (abogado.rut === null) {
    throw ErrorApi.conflicto('La cuenta del abogado no tiene RUT vigente');
  }

  return promesa.update({ revisadaPorId: abogadoId, revisadaEn: new Date() });
}
