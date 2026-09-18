import { Op } from 'sequelize';
import { Propiedad } from '../models/Propiedad';
import { Usuario } from '../models/Usuario';
import { Documento } from '../models/Documento';
import { Informe, type EstadoInforme } from '../models/Informe';
import { Consentimiento } from '../models/Consentimiento';
import { env } from '../config/env';
import { ErrorApi } from '../utils/ErrorApi';
import {
  APORTES_TITULOS,
  LIMITES_ANTECEDENTES,
  PLAZO_TITULOS_HABILES,
  costoDeInsumos,
  costoEsIncompleto,
  nombreDelNivel,
  seccionesDeNivel,
  type ContextoInforme,
} from '../dominio/informe.catalogo';

/** Redacción vigente de la autorización del vendedor. Subir al cambiar el texto. */
export const VERSION_CONSENTIMIENTO = 'divulgacion-2026-09';

export const TEXTO_CONSENTIMIENTO =
  'Autorizo a Trato a mostrar a compradores interesados los antecedentes de esta ' +
  'propiedad y el avance de sus trámites, incluidos los certificados que Trato ' +
  'obtenga de registros públicos, con el fin de que puedan evaluar la compra. ' +
  'Puedo revocar esta autorización en cualquier momento.';

const ESTADOS_QUE_ADMITEN_INFORME = ['publicada', 'reservada'];

function contextoDe(propiedad: Propiedad): ContextoInforme {
  return {
    esDepartamento: propiedad.tipo === 'departamento',
    tieneConstruccion: propiedad.tipo !== 'terreno' && propiedad.tipo !== 'parcela',
  };
}

export async function consentimientoVigente(
  propiedadId: string,
): Promise<Consentimiento | null> {
  return Consentimiento.findOne({
    where: { propiedadId, tipo: 'divulgacion_antecedentes', revocadoEn: null },
    order: [['otorgadoEn', 'DESC']],
  });
}

export async function otorgarConsentimiento(
  propiedadId: string,
  vendedorId: string,
  ip?: string,
): Promise<Consentimiento> {
  const propiedad = await Propiedad.findByPk(propiedadId);
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
  if (propiedad.vendedorId !== vendedorId) {
    throw ErrorApi.prohibido('Sólo el dueño puede autorizar la divulgación');
  }

  const yaHay = await consentimientoVigente(propiedadId);
  if (yaHay && yaHay.textoVersion === VERSION_CONSENTIMIENTO) return yaHay;

  // Cambió la redacción: la anterior se revoca y se registra una nueva, para que
  // quede el rastro de qué texto aceptó y cuándo.
  if (yaHay) await yaHay.update({ revocadoEn: new Date() });

  return Consentimiento.create({
    propiedadId,
    usuarioId: vendedorId,
    tipo: 'divulgacion_antecedentes',
    textoVersion: VERSION_CONSENTIMIENTO,
    ip: ip ?? null,
  });
}

export async function revocarConsentimiento(
  propiedadId: string,
  vendedorId: string,
): Promise<void> {
  const propiedad = await Propiedad.findByPk(propiedadId);
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
  if (propiedad.vendedorId !== vendedorId) {
    throw ErrorApi.prohibido('Sólo el dueño puede revocar la divulgación');
  }

  const vigente = await consentimientoVigente(propiedadId);
  if (vigente) await vigente.update({ revocadoEn: new Date() });
}

interface SeccionEmitida {
  codigo: string;
  titulo: string;
  queResponde: string;
  fuente: string;
  /** Lo que se pudo llenar. null cuando la fuente todavía no está conectada. */
  datos: Record<string, unknown> | null;
  /** Por qué viene vacía, si viene vacía. */
  sinDatos?: string;
}

/**
 * Arma las secciones del nivel gratis con lo que ya tenemos en casa.
 *
 * El avalúo del SII y las contribuciones de Tesorería se consultan por rol y son
 * gratis, pero ninguno de los dos publica API: hoy salen marcados como fuente
 * pendiente en vez de inventar el dato. Preferir el hueco explícito al número
 * plausible es la única opción defendible cuando el comprador va a decidir una
 * compra con esto.
 */
function armarAntecedentes(
  propiedad: Propiedad,
  documentos: Documento[],
  conConsentimiento: boolean,
): SeccionEmitida[] {
  const ctx = contextoDe(propiedad);

  return seccionesDeNivel('antecedentes', ctx).map((seccion) => {
    const base = {
      codigo: seccion.codigo,
      titulo: seccion.titulo,
      queResponde: seccion.queResponde,
      fuente: seccion.fuente,
    };

    if (seccion.requiereConsentimiento && !conConsentimiento) {
      return {
        ...base,
        datos: null,
        sinDatos: 'El vendedor no ha autorizado mostrar estos antecedentes.',
      };
    }

    switch (seccion.codigo) {
      case 'identificacion':
        return {
          ...base,
          datos: {
            tipo: propiedad.tipo,
            comuna: propiedad.comuna,
            region: propiedad.region,
            rolAvaluo: propiedad.rolAvaluo,
            superficieConstruida: propiedad.superficieConstruida,
            superficieTotal: propiedad.superficieTotal,
            // Sin rol de avalúo no se puede consultar al SII ni a Tesorería.
            faltaRolAvaluo: propiedad.rolAvaluo === null,
          },
        };

      case 'avaluo_fiscal':
      case 'contribuciones':
        return {
          ...base,
          datos: null,
          sinDatos: propiedad.rolAvaluo
            ? 'Fuente por conectar: se consulta por rol y es gratis, pero no publica API.'
            : 'El vendedor todavía no informó el rol de avalúo, que es la llave de esta consulta.',
        };

      case 'avance_expediente': {
        const conformes = documentos.filter((d) => d.conforme).length;
        return {
          ...base,
          datos: {
            total: documentos.length,
            conformes,
            // "Conforme" exige recibido, vigente y aprobado por la notaría.
            // Contar sólo los recibidos daría un avance que no es real.
            avance: documentos.length > 0 ? conformes / documentos.length : 0,
          },
        };
      }

      case 'declaraciones_vendedor':
        return {
          ...base,
          datos: {
            tieneHipoteca: propiedad.tieneHipoteca,
            esDepartamento: ctx.esDepartamento,
            anoConstruccion: propiedad.anoConstruccion,
            advertencia: 'Son declaraciones del vendedor. El nivel de títulos las verifica.',
          },
        };

      case 'costos_operacion':
        return {
          ...base,
          datos: {
            comisionTrato: '1% + IVA sobre el precio de venta',
            precio: propiedad.precio,
            moneda: propiedad.moneda,
            // No se estiman a propósito: son aranceles de terceros que varían
            // por notaría, por territorio y por banco. Poner una cifra
            // inventada acá sería peor que dejar el hueco.
            noEstimados: [
              'Notaría',
              'Conservador de Bienes Raíces',
              'Gastos del crédito hipotecario, si hay',
            ],
          },
        };

      default:
        return { ...base, datos: null, sinDatos: 'Sección sin armar.' };
    }
  });
}

async function cargarPropiedadParaInforme(propiedadId: string): Promise<Propiedad> {
  const propiedad = await Propiedad.findByPk(propiedadId, {
    include: [{ model: Documento, as: 'documentos' }],
  });
  if (!propiedad) throw ErrorApi.noEncontrado('Propiedad no encontrada');
  if (!ESTADOS_QUE_ADMITEN_INFORME.includes(propiedad.estado)) {
    throw ErrorApi.conflicto('Esta propiedad no está publicada');
  }
  return propiedad;
}

export async function emitirAntecedentes(
  propiedadId: string,
  compradorId: string,
): Promise<Informe> {
  const propiedad = await cargarPropiedadParaInforme(propiedadId);
  if (propiedad.vendedorId === compradorId) {
    throw ErrorApi.solicitudInvalida('Esta propiedad es tuya');
  }

  const consentimiento = await consentimientoVigente(propiedadId);
  const documentos = (propiedad.get('documentos') as Documento[] | undefined) ?? [];

  const secciones = armarAntecedentes(propiedad, documentos, consentimiento !== null);

  return Informe.create({
    propiedadId,
    compradorId,
    nivel: 'antecedentes',
    estado: 'emitido',
    precioClp: 0,
    emitidoEn: new Date(),
    contenido: {
      nombre: nombreDelNivel('antecedentes', false),
      secciones,
      limites: LIMITES_ANTECEDENTES,
      aportesDelNivelPagado: APORTES_TITULOS,
      // La base de licitud que habilitó las secciones del vendedor, fechada.
      consentimiento: consentimiento
        ? { version: consentimiento.textoVersion, otorgadoEn: consentimiento.otorgadoEn }
        : null,
    },
  });
}

const ESTADOS_ABIERTOS: EstadoInforme[] = ['esperando_pago', 'en_preparacion'];

export async function pedirTitulos(
  propiedadId: string,
  compradorId: string,
): Promise<Informe> {
  const propiedad = await cargarPropiedadParaInforme(propiedadId);
  if (propiedad.vendedorId === compradorId) {
    throw ErrorApi.solicitudInvalida('Esta propiedad es tuya');
  }

  const abierto = await Informe.findOne({
    where: {
      propiedadId,
      compradorId,
      nivel: 'titulos',
      estado: { [Op.in]: ESTADOS_ABIERTOS },
    },
  });
  if (abierto) return abierto;

  const ctx = contextoDe(propiedad);

  return Informe.create({
    propiedadId,
    compradorId,
    nivel: 'titulos',
    estado: 'esperando_pago',
    precioClp: env.precioInformeTitulosClp,
    contenido: {
      nombre: nombreDelNivel('titulos', false),
      // Se promete lo que se va a pedir, con su fuente y su costo, antes de
      // cobrar: el comprador tiene que poder ver qué compra.
      seccionesPrometidas: seccionesDeNivel('titulos', ctx).map((s) => ({
        codigo: s.codigo,
        titulo: s.titulo,
        queResponde: s.queResponde,
        fuente: s.fuente,
        condicional: s.condicional ?? null,
      })),
      plazoHabiles: PLAZO_TITULOS_HABILES,
      costoInsumosClp: costoDeInsumos('titulos', ctx),
      costoInsumosIncompleto: costoEsIncompleto('titulos', ctx),
    },
  });
}

export async function informesDeComprador(compradorId: string): Promise<Informe[]> {
  return Informe.findAll({
    where: { compradorId },
    include: [
      {
        model: Propiedad,
        as: 'propiedad',
        attributes: ['id', 'titulo', 'comuna', 'tipo', 'precio', 'moneda'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
}

export async function obtenerParaComprador(
  informeId: string,
  compradorId: string,
): Promise<Informe> {
  const informe = await Informe.findByPk(informeId, {
    include: [
      {
        model: Propiedad,
        as: 'propiedad',
        attributes: ['id', 'titulo', 'comuna', 'tipo', 'precio', 'moneda'],
      },
    ],
  });
  if (!informe) throw ErrorApi.noEncontrado('Informe no encontrado');
  if (informe.compradorId !== compradorId) {
    throw ErrorApi.prohibido('Este informe no es tuyo');
  }
  return informe;
}

/**
 * La firma del abogado. Sin conclusión no se firma: un estudio de títulos sin
 * conclusión no dice lo único que el comprador necesita saber, y la pauta del
 * Colegio de Abogados la exige junto con el detalle de los defectos.
 */
export async function firmarTitulos(
  informeId: string,
  abogadoId: string,
  conclusion: string,
  defectos: string[],
): Promise<Informe> {
  const informe = await Informe.findByPk(informeId);
  if (!informe) throw ErrorApi.noEncontrado('Informe no encontrado');
  if (informe.nivel !== 'titulos') {
    throw ErrorApi.solicitudInvalida('Sólo se firma el informe de títulos');
  }
  if (informe.estado !== 'en_preparacion') {
    throw ErrorApi.conflicto('El informe tiene que estar pagado y en preparación para firmarse');
  }

  const abogado = await Usuario.findByPk(abogadoId);
  if (!abogado || (abogado.rol !== 'abogado' && abogado.rol !== 'admin')) {
    throw ErrorApi.prohibido('Sólo un abogado puede firmar un estudio de títulos');
  }
  // La pauta del Colegio de Abogados exige los datos del abogado en el informe.
  // Una cuenta anonimizada no los tiene, así que no puede responder por nada.
  if (abogado.rut === null) {
    throw ErrorApi.conflicto('La cuenta del abogado no tiene RUT vigente para firmar');
  }

  return informe.update({
    abogadoId,
    firmadoEn: new Date(),
    conclusion,
    defectos,
    contenido: {
      ...informe.contenido,
      nombre: nombreDelNivel('titulos', true),
      // Los datos del abogado quedan en el informe, no sólo la referencia: el
      // comprador tiene que ver quién responde por la conclusión.
      firmadoPor: { nombre: `${abogado.nombre} ${abogado.apellido}`, rut: abogado.rut },
    },
  });
}

/** Entrega el informe de títulos ya reunido. Lo hace el equipo interno. */
export async function entregarTitulos(
  informeId: string,
  secciones: SeccionEmitida[],
): Promise<Informe> {
  const informe = await Informe.findByPk(informeId);
  if (!informe) throw ErrorApi.noEncontrado('Informe no encontrado');
  if (informe.estado !== 'en_preparacion') {
    throw ErrorApi.conflicto('El informe no está en preparación');
  }

  return informe.update({
    estado: 'entregado',
    entregadoEn: new Date(),
    emitidoEn: informe.emitidoEn ?? new Date(),
    contenido: { ...informe.contenido, secciones },
  });
}

export async function cambiarEstado(
  informeId: string,
  estado: Extract<EstadoInforme, 'en_preparacion' | 'anulado'>,
): Promise<Informe> {
  const informe = await Informe.findByPk(informeId);
  if (!informe) throw ErrorApi.noEncontrado('Informe no encontrado');

  if (estado === 'en_preparacion') {
    if (informe.estado !== 'esperando_pago') {
      throw ErrorApi.conflicto('Sólo un informe esperando pago pasa a preparación');
    }
    return informe.update({ estado, pagadoEn: new Date() });
  }

  return informe.update({ estado });
}
