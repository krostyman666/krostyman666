import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/database';
import { Informe } from './Informe';
import { Usuario } from './Usuario';
import {
  ESTADOS_PAGO,
  MEDIOS_PAGO,
  PROVEEDORES_PAGO,
  type EstadoPago,
  type MedioPago,
  type ProveedorPago,
} from '../dominio/pagos';

/**
 * El cobro de un informe.
 *
 * `monto` se copia y no se lee del informe ni del precio configurado: lo que se
 * cobró es un hecho fechado y cambiar el precio de lista no puede reescribir lo
 * que alguien ya pagó.
 *
 * `referencia` es el código que el comprador pone en el mensaje de la
 * transferencia, y es lo que permite calzarla contra la cartola. Con Flow pasa a
 * guardar el identificador de la orden.
 */
export class Pago extends Model<InferAttributes<Pago>, InferCreationAttributes<Pago>> {
  declare id: CreationOptional<string>;
  declare informeId: ForeignKey<Informe['id']>;
  declare compradorId: ForeignKey<Usuario['id']>;

  declare monto: number;
  declare medio: MedioPago;
  declare proveedor: ProveedorPago;
  declare estado: CreationOptional<EstadoPago>;

  /** Código para calzar la transferencia, o el id de la orden del proveedor. */
  declare referencia: string;

  /** Lo que el comprador dice haber transferido, para que alguien lo revise. */
  declare reportadoEn: CreationOptional<Date | null>;
  declare pagadoEn: CreationOptional<Date | null>;
  /** Quién lo concilió. Queda registrado: es plata. */
  declare conciliadoPorId: CreationOptional<string | null>;
  declare nota: CreationOptional<string | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Pago.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    informeId: { type: DataTypes.UUID, allowNull: false },
    compradorId: { type: DataTypes.UUID, allowNull: false },

    monto: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    medio: { type: DataTypes.ENUM(...MEDIOS_PAGO), allowNull: false },
    proveedor: { type: DataTypes.ENUM(...PROVEEDORES_PAGO), allowNull: false },
    estado: {
      type: DataTypes.ENUM(...ESTADOS_PAGO),
      allowNull: false,
      defaultValue: 'pendiente',
    },

    referencia: { type: DataTypes.STRING(40), allowNull: false, unique: true },

    reportadoEn: { type: DataTypes.DATE, allowNull: true },
    pagadoEn: { type: DataTypes.DATE, allowNull: true },
    conciliadoPorId: { type: DataTypes.UUID, allowNull: true },
    nota: { type: DataTypes.TEXT, allowNull: true },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Pago',
    tableName: 'pagos',
    indexes: [
      { fields: ['informe_id'] },
      { fields: ['comprador_id'] },
      { fields: ['estado'] },
    ],
  },
);

Informe.hasMany(Pago, { foreignKey: 'informeId', as: 'pagos' });
Pago.belongsTo(Informe, { foreignKey: 'informeId', as: 'informe' });
Pago.belongsTo(Usuario, { foreignKey: 'compradorId', as: 'comprador' });
