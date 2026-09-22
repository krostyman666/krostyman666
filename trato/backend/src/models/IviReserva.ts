import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
  type NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';
import { IviEspecialista } from './IviEspecialista';

export type TipoConsulta = 'inicial' | 'seguimiento' | 'congelacion';
export type EstadoReserva = 'reservada' | 'confirmada' | 'completada' | 'cancelada';
export type CanalConsulta = 'presencial' | 'videollamada';

export class IviReserva extends Model<
  InferAttributes<IviReserva>,
  InferCreationAttributes<IviReserva>
> {
  declare id: CreationOptional<string>;
  declare reservaNumero: CreationOptional<string>; // RES-20260918-001

  // Cliente
  declare email: string;
  declare telefono: string;
  declare nombre: string;
  declare rut: string;
  declare edad?: number | null;

  // Cita
  declare tipoConsulta: TipoConsulta;
  declare especialistaId: ForeignKey<IviEspecialista['id']>;
  declare fechaCita: Date;
  declare horaCita: string; // HH:mm
  declare canal: CreationOptional<CanalConsulta>; // presencial, videollamada

  // Presupuesto
  declare presupuestoId?: string | null;
  declare montoTotal: number;

  // Pago
  declare pagoId?: string | null;
  declare estadoPago: CreationOptional<string>; // pendiente, procesando, pagado, fallido, reembolsado

  // Confirmación
  declare qrCode?: string | null;
  declare confirmadoPorPaciente: CreationOptional<boolean>;
  declare confirmadoEn?: Date | null;

  // Estados
  declare estado: CreationOptional<EstadoReserva>; // reservada, confirmada, completada, cancelada

  // Notas
  declare notasPaciente?: string | null;
  declare notasInterno?: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Relaciones
  declare especialista?: NonAttribute<IviEspecialista>;
}

IviReserva.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reservaNumero: {
      type: DataTypes.STRING(50),
      unique: true,
      comment: 'RES-20260918-001',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rut: {
      type: DataTypes.STRING(12),
      allowNull: false,
    },
    edad: {
      type: DataTypes.INTEGER,
    },
    tipoConsulta: {
      type: DataTypes.ENUM('inicial', 'seguimiento', 'congelacion'),
      allowNull: false,
    },
    especialistaId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ivi_especialistas',
        key: 'id',
      },
    },
    fechaCita: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    horaCita: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    canal: {
      type: DataTypes.ENUM('presencial', 'videollamada'),
      defaultValue: 'presencial',
    },
    presupuestoId: {
      type: DataTypes.UUID,
    },
    montoTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    pagoId: {
      type: DataTypes.UUID,
    },
    estadoPago: {
      type: DataTypes.ENUM(
        'pendiente',
        'procesando',
        'pagado',
        'fallido',
        'reembolsado'
      ),
      defaultValue: 'pendiente',
    },
    qrCode: {
      type: DataTypes.TEXT,
    },
    confirmadoPorPaciente: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    confirmadoEn: {
      type: DataTypes.DATE,
    },
    estado: {
      type: DataTypes.ENUM('reservada', 'confirmada', 'completada', 'cancelada'),
      defaultValue: 'reservada',
    },
    notasPaciente: {
      type: DataTypes.TEXT,
    },
    notasInterno: {
      type: DataTypes.TEXT,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'ivi_reservas',
    timestamps: true,
  }
);

IviReserva.belongsTo(IviEspecialista, {
  foreignKey: 'especialistaId',
  as: 'especialista',
});

IviReserva.addIndex(['email'], { name: 'idx_reserva_email' });
IviReserva.addIndex(['fechaCita'], { name: 'idx_reserva_fecha' });
IviReserva.addIndex(['estadoPago'], { name: 'idx_reserva_estado_pago' });
