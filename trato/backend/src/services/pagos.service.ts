import crypto from 'crypto';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { Pago } from '../models/Pago';
import { Informe } from '../models/Informe';
import { Propiedad } from '../models/Propiedad';
import { Usuario } from '../models/Usuario';
import { env, cuentaDeCobroConfigurada } from '../config/env';
import { ErrorApi } from '../utils/ErrorApi';
import {
  MEDIOS,
  MEDIO_POR_CODIGO,
  costoDeCobrar,
  medioMasBarato,
  type MedioPago,
} from '../dominio/pagos';

/**
 * Sin I, O, 0 ni 1: el comprador va a copiar esto a mano en el mensaje de la
 * transferencia y esos cuatro se confunden entre sí.
 */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function referencia(): string {
  const bytes = crypto.randomBytes(6);
  let codigo = '';
  for (const b of bytes) codigo += ALFABETO[b % ALFABETO.length];
  return `TRATO-${codigo}`;
}

/** Los medios que se pueden ofrecer hoy, con su costo para nosotros. */
export function mediosDisponibles(monto: number) {
  return MEDIOS.filter((m) => {
    if (m.medio === 'transferencia') return cuentaDeCobroConfigurada();
    // Webpay necesita credenciales de Flow.
    return Boolean(process.env.FLOW_API_KEY);
  }).map((m) => ({
    medio: m.medio,
    nombre: m.nombre,
    confirmacion: m.confirmacion,
    nota: m.nota,
    costoParaTrato: Math.round(costoDeCobrar(monto, m.medio)),
    recomendado: m.medio === medioMasBarato(monto),
  }));
}

export function instruccionesTransferencia() {
  if (!cuentaDeCobroConfigurada()) return null;
  const c = env.cuentaCobro;
  return {
    banco: c.banco,
    tipoCuenta: c.tipoCuenta,
    numero: c.numero,
    titular: c.titular,
    rut: c.rut,
    email: c.email,
  };
}

async function exigirInformeCobrable(informeId: string, compradorId: string): Promise<Informe> {
  const informe = await Informe.findByPk(informeId);
  if (!informe) throw ErrorApi.noEncontrado('Informe no encontrado');
  if (informe.compradorId !== compradorId) {
    throw ErrorApi.prohibido('Este informe no es tuyo');
  }
  if (informe.nivel !== 'titulos') {
    throw ErrorApi.solicitudInvalida('El informe de antecedentes es gratis');
  }
  if (informe.estado !== 'esperando_pago') {
    throw ErrorApi.conflicto('Este informe no está esperando pago');
  }
  return informe;
}

export async function iniciar(
  informeId: string,
  compradorId: string,
  medio: MedioPago,
): Promise<Pago> {
  const informe = await exigirInformeCobrable(informeId, compradorId);

  const definicion = MEDIO_POR_CODIGO.get(medio);
  if (!definicion) throw ErrorApi.solicitudInvalida('Medio de pago desconocido');
  if (medio === 'transferencia' && !cuentaDeCobroConfigurada()) {
    throw ErrorApi.conflicto('La transferencia no está habilitada todavía');
  }
  if (definicion.proveedor === 'flow' && !process.env.FLOW_API_KEY) {
    throw ErrorApi.conflicto('El pago con tarjeta no está habilitado todavía');
  }

  // Un solo cobro abierto por informe: dos referencias vivas para la misma
  // deuda es la receta para cobrar dos veces o conciliar la equivocada.
  const abierto = await Pago.findOne({ where: { informeId, estado: 'pendiente' } });
  if (abierto) return abierto;

  return Pago.create({
    informeId,
    compradorId,
    // El monto se congela acá: es lo que se le cobró a esta persona.
    monto: informe.precioClp,
    medio,
    proveedor: definicion.proveedor,
    referencia: referencia(),
  });
}

/** El comprador avisa que transfirió. No confirma nada: lo revisa una persona. */
export async function reportar(
  pagoId: string,
  compradorId: string,
  nota?: string,
): Promise<Pago> {
  const pago = await Pago.findByPk(pagoId);
  if (!pago) throw ErrorApi.noEncontrado('Pago no encontrado');
  if (pago.compradorId !== compradorId) throw ErrorApi.prohibido('Este pago no es tuyo');
  if (pago.estado !== 'pendiente') {
    throw ErrorApi.conflicto('Este pago ya no está pendiente');
  }
  return pago.update({ reportadoEn: new Date(), nota: nota ?? pago.nota });
}

/**
 * Alguien calzó la transferencia contra la cartola y el informe entra en
 * preparación. Va en transacción porque cobrar y no avanzar el informe deja al
 * comprador pagando por nada.
 */
export async function conciliar(
  pagoId: string,
  adminId: string,
  nota?: string,
): Promise<Pago> {
  return sequelize.transaction(async (t) => {
    const pago = await Pago.findByPk(pagoId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!pago) throw ErrorApi.noEncontrado('Pago no encontrado');
    if (pago.estado === 'pagado') throw ErrorApi.conflicto('Este pago ya está conciliado');
    if (pago.estado !== 'pendiente') {
      throw ErrorApi.conflicto('Este pago está anulado o reembolsado');
    }

    const informe = await Informe.findByPk(pago.informeId, { transaction: t });
    if (!informe) throw ErrorApi.noEncontrado('Informe no encontrado');

    await informe.update(
      { estado: 'en_preparacion', pagadoEn: new Date() },
      { transaction: t },
    );

    return pago.update(
      {
        estado: 'pagado',
        pagadoEn: new Date(),
        conciliadoPorId: adminId,
        nota: nota ?? pago.nota,
      },
      { transaction: t },
    );
  });
}

export async function anular(pagoId: string, adminId: string, motivo: string): Promise<Pago> {
  const pago = await Pago.findByPk(pagoId);
  if (!pago) throw ErrorApi.noEncontrado('Pago no encontrado');
  if (pago.estado === 'pagado') {
    throw ErrorApi.conflicto('Un pago conciliado se reembolsa, no se anula', 'ya_pagado');
  }
  return pago.update({ estado: 'anulado', conciliadoPorId: adminId, nota: motivo });
}

/** Lo que espera que alguien lo revise. Los reportados primero. */
export async function porConciliar(): Promise<Pago[]> {
  return Pago.findAll({
    where: { estado: 'pendiente' },
    include: [
      { model: Usuario, as: 'comprador', attributes: ['id', 'nombre', 'apellido', 'email'] },
      {
        model: Informe,
        as: 'informe',
        include: [{ model: Propiedad, as: 'propiedad', attributes: ['id', 'titulo', 'comuna'] }],
      },
    ],
    order: [
      // Nulls al final: quien avisó que pagó lleva prioridad.
      [sequelize.literal('"Pago"."reportado_en" IS NULL'), 'ASC'],
      ['reportadoEn', 'ASC'],
      ['createdAt', 'ASC'],
    ],
  });
}

export async function deInforme(informeId: string, compradorId: string): Promise<Pago[]> {
  return Pago.findAll({
    where: { informeId, compradorId, estado: { [Op.ne]: 'anulado' } },
    order: [['createdAt', 'DESC']],
  });
}
