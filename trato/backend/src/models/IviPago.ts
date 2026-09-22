import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/database';
import { IviReserva } from './IviReserva';

export type EstadoPago =
  | 'pendiente'
  | 'procesando'
  | 'autorizado'
  | 'pagado'
  | 'fallido'
  | 'anulado';

export class IviPago extends Model<
  InferAttributes<IviPago>,
  InferCreationAttributes<IviPago>
> {
  declare id: CreationOptional<string>;

  declare reservaId: ForeignKey<IviReserva['id']>;

  // Detalles del pago
  declare monto: number;
  declare medioPago: string; // webpay, transferencia, tarjeta

  // Webpay (Transbank)
  declare webpayOrdenCompra?: string | null;
  declare webpayToken?: string | null;
  declare webpayRespuesta?: Record<string, unknown> | null; // JSON completo de Transbank

  // Estados
  declare estado: CreationOptional<EstadoPago>;

  // Intentos
  declare numeroIntentos: CreationOptional<number>;
  declare ultimoIntento?: Date | null;

  // Respuestas de error
  declare codigoError?: string | null;
  declare mensajeError?: string | null;

  // Transaccionalidad
  declare transaccionId?: string | null; // ID de Transbank
  declare fechaTransaccion?: Date | null;

  // Webhook
  declare webhookRecibido: CreationOptional<boolean>;
  declare webhookEn?: Date | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

IviPago.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reservaId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ivi_reservas',
        key: 'id',
      },
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    medioPago: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'webpay, transferencia, tarjeta',
    },
    webpayOrdenCompra: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    webpayToken: {
      type: DataTypes.STRING(255),
    },
    webpayRespuesta: {
      type: DataTypes.JSON,
      comment: 'Respuesta completa de Transbank',
    },
    estado: {
      type: DataTypes.ENUM(
        'pendiente',
        'procesando',
        'autorizado',
        'pagado',
        'fallido',
        'anulado'
      ),
      defaultValue: 'pendiente',
    },
    numeroIntentos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ultimoIntento: {
      type: DataTypes.DATE,
    },
    codigoError: {
      type: DataTypes.STRING(50),
    },
    mensajeError: {
      type: DataTypes.TEXT,
    },
    transaccionId: {
      type: DataTypes.STRING(255),
      comment: 'ID único de Transbank',
    },
    fechaTransaccion: {
      type: DataTypes.DATE,
    },
    webhookRecibido: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    webhookEn: {
      type: DataTypes.DATE,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'ivi_pagos',
    timestamps: true,
  }
);

IviPago.belongsTo(IviReserva, {
  foreignKey: 'reservaId',
});

IviPago.addIndex(['estado'], { name: 'idx_pago_estado' });
IviPago.addIndex(['reservaId'], { name: 'idx_pago_reserva' });
