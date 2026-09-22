import { sequelize } from '../config/database';
import { Promesa } from '../models/Promesa';
import { ClausulaPromesa } from '../models/ClausulaPromesa';
import { Usuario } from '../models/Usuario';
import { FirmaPromesa } from '../models/FirmaPromesa';
import { ErrorApi } from '../utils/ErrorApi';
import { env } from '../config/env';
import { hashDe, renderizarPromesa, type RolFirma } from '../dominio/firma';

async function cargarCompleta(promesaId: string): Promise<Promesa> {
  const promesa = await Promesa.findByPk(promesaId, {
    include: [
      { model: ClausulaPromesa, as: 'clausulas' },
      { model: Usuario, as: 'comprador' },
      { model: Usuario, as: 'vendedor' },
      { model: FirmaPromesa, as: 'firmas' },
    ],
  });
  if (!promesa) throw ErrorApi.noEncontrado('Promesa no encontrada');
  return promesa;
}

function rolDe(promesa: Promesa, usuarioId: string): RolFirma {
  if (promesa.compradorId === usuarioId) return 'comprador';
  if (promesa.vendedorId === usuarioId) return 'vendedor';
  throw ErrorApi.prohibido('Esta promesa no es tuya');
}

function textoDe(promesa: Promesa): string {
  const clausulas = (promesa.get('clausulas') as ClausulaPromesa[] | undefined) ?? [];
  const comprador = promesa.get('comprador') as Usuario;
  const vendedor = promesa.get('vendedor') as Usuario;
  return renderizarPromesa(clausulas, comprador, vendedor);
}

export interface EstadoFirma {
  texto: string;
  hash: string;
  proveedor: string;
  /** null si la promesa todavía no se puede firmar; el motivo si no. */
  bloqueo: string | null;
  firmas: {
    rol: RolFirma;
    nombre: string;
    firmadoEn: Date;
    /** El texto guardado sigue dando su hash: nadie tocó la fila. */
    integra: boolean;
  }[];
  yaFirmaste: boolean;
  puedesFirmar: boolean;
  estaFirmada: boolean;
}

/**
 * El documento que se firma.
 *
 * Con la primera firma el contrato queda congelado: la segunda parte firma
 * exactamente los mismos bytes, no una nueva composición del mismo contenido.
 * Si se volviera a renderizar, cualquier cambio de plantilla —un deploy
 * nuestro— produciría dos documentos distintos firmados por cada parte, y el
 * hash dejaría de significar algo.
 *
 * Que las cláusulas no puedan cambiar entre una firma y otra lo garantizan los
 * guards de la promesa: acordada no admite editar cláusulas, y `reabrir` está
 * bloqueado desde que existe una firma.
 */
function documentoDe(
  promesa: Promesa,
  firmas: FirmaPromesa[],
): { texto: string; hash: string } {
  const previa = firmas[0];
  if (previa) return { texto: previa.texto, hash: previa.textoHash };
  const texto = textoDe(promesa);
  return { texto, hash: hashDe(texto) };
}

/**
 * Por qué todavía no se puede firmar, o null si se puede.
 *
 * El orden importa: primero el estado de la promesa, después la revisión del
 * abogado. Firmar es el último paso y sólo tras la revisión, como dice el flujo:
 * la promesa acordada la revisa un abogado antes de la firma.
 */
function motivoDeBloqueo(promesa: Promesa): string | null {
  if (promesa.estado === 'firmada' || promesa.estado === 'cumplida') return null;
  if (promesa.estado === 'negociando') {
    return 'La promesa todavía está en negociación. Primero hay que acordarla.';
  }
  if (promesa.estado === 'desistida') {
    return 'Esta promesa se desistió.';
  }
  if (promesa.revisadaEn === null) {
    return 'Falta que un abogado revise la promesa antes de firmarla.';
  }
  return null;
}

export async function estado(promesaId: string, usuarioId: string): Promise<EstadoFirma> {
  const promesa = await cargarCompleta(promesaId);
  rolDe(promesa, usuarioId);

  const firmas = (promesa.get('firmas') as FirmaPromesa[] | undefined) ?? [];
  const { texto, hash } = documentoDe(promesa, firmas);
  const bloqueo = motivoDeBloqueo(promesa);
  const yaFirmaste = firmas.some((f) => f.firmantePorId === usuarioId);
  const estaFirmada = promesa.estado === 'firmada' || promesa.estado === 'cumplida';

  return {
    texto,
    hash,
    proveedor: env.firma.proveedor,
    bloqueo,
    firmas: firmas.map((f) => {
      const u = f.rol === 'comprador'
        ? (promesa.get('comprador') as Usuario)
        : (promesa.get('vendedor') as Usuario);
      return {
        rol: f.rol,
        nombre: `${u.nombre} ${u.apellido}`.trim(),
        firmadoEn: f.firmadoEn,
        // Se compara el texto guardado contra su propio hash guardado. Eso
        // detecta que alguien haya editado la fila, y no se dispara solo porque
        // cambiemos la plantilla, que no altera lo ya firmado.
        integra: hashDe(f.texto) === f.textoHash,
      };
    }),
    yaFirmaste,
    puedesFirmar: bloqueo === null && !yaFirmaste && !estaFirmada,
    estaFirmada,
  };
}

/**
 * Firma la promesa por la parte que la pide.
 *
 * Firma electrónica simple: se guarda el documento exacto, su hash, la IP y la
 * hora. Cuando firman las dos partes —el mismo hash— la promesa pasa a firmada.
 * La transacción bloquea la fila para que dos firmas simultáneas no dejen la
 * promesa a medio cerrar.
 */
export async function firmar(
  promesaId: string,
  usuarioId: string,
  ip: string | null,
): Promise<EstadoFirma> {
  await sequelize.transaction(async (t) => {
    // Se bloquea sólo la fila de la promesa. Postgres no admite FOR UPDATE con el
    // outer join de los include, así que las asociaciones se cargan aparte: no
    // necesitan lock, lo que se serializa es el cierre de esta promesa.
    const promesa = await Promesa.findByPk(promesaId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!promesa) throw ErrorApi.noEncontrado('Promesa no encontrada');

    const rol = rolDe(promesa, usuarioId);
    const bloqueo = motivoDeBloqueo(promesa);
    if (bloqueo) throw ErrorApi.conflicto(bloqueo, 'firma_bloqueada');
    if (promesa.estado === 'firmada' || promesa.estado === 'cumplida') {
      throw ErrorApi.conflicto('Esta promesa ya está firmada', 'ya_firmada');
    }

    const firmas = await FirmaPromesa.findAll({ where: { promesaId }, transaction: t });
    if (firmas.some((f) => f.firmantePorId === usuarioId)) {
      throw ErrorApi.conflicto('Ya firmaste esta promesa', 'ya_firmaste');
    }

    // Con una firma puesta, el documento ya está congelado y la segunda parte
    // firma esos mismos bytes. Sólo el primer firmante lo compone.
    let texto: string;
    let hash: string;
    const previa = firmas[0];
    if (previa) {
      texto = previa.texto;
      hash = previa.textoHash;
    } else {
      const [clausulas, comprador, vendedor] = await Promise.all([
        ClausulaPromesa.findAll({ where: { promesaId }, transaction: t }),
        Usuario.findByPk(promesa.compradorId, { transaction: t }),
        Usuario.findByPk(promesa.vendedorId, { transaction: t }),
      ]);
      if (!comprador || !vendedor) throw ErrorApi.noEncontrado('Faltan las partes de la promesa');
      texto = renderizarPromesa(clausulas, comprador, vendedor);
      hash = hashDe(texto);
    }

    await FirmaPromesa.create(
      {
        promesaId,
        firmantePorId: usuarioId,
        rol,
        texto,
        textoHash: hash,
        proveedor: env.firma.proveedor,
        ip,
      },
      { transaction: t },
    );

    // Con las dos firmas, la promesa queda firmada.
    if (firmas.length + 1 >= 2) {
      await promesa.update({ estado: 'firmada', firmadaEn: new Date() }, { transaction: t });
    }
  });

  return estado(promesaId, usuarioId);
}

/** Cuántas firmas tiene una promesa. Lo usa `reabrir` para no mutar un contrato
 * que alguien ya firmó. */
export async function cantidadDeFirmas(promesaId: string): Promise<number> {
  return FirmaPromesa.count({ where: { promesaId } });
}
