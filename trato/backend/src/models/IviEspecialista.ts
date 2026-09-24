import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';

export class IviEspecialista extends Model<
  InferAttributes<IviEspecialista>,
  InferCreationAttributes<IviEspecialista>
> {
  declare id: CreationOptional<string>;

  declare nombre: string;
  declare especialidad: CreationOptional<string>; // Médico Reproductor, Psicólogo, etc
  declare email?: string | null;
  declare telefono?: string | null;

  // Disponibilidad / Calendario
  declare calendarioOutlookId?: string | null; // Integration con Outlook
  declare horarioInicio: CreationOptional<string>; // HH:mm
  declare horarioFin: CreationOptional<string>; // HH:mm
  declare diasDisponibles: CreationOptional<string>; // 'lunes,martes,miercoles,jueves,viernes'

  // Metadata
  declare activo: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

IviEspecialista.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    especialidad: {
      type: DataTypes.STRING(100),
      comment: 'Médico Reproductor, Psicólogo, etc',
    },
    email: {
      type: DataTypes.STRING(255),
      validate: {
        isEmail: true,
      },
    },
    telefono: {
      type: DataTypes.STRING(20),
    },
    calendarioOutlookId: {
      type: DataTypes.STRING(255),
      comment: 'Integration con Outlook para sincronizar disponibilidad',
    },
    horarioInicio: {
      type: DataTypes.TIME,
      defaultValue: '09:00:00',
    },
    horarioFin: {
      type: DataTypes.TIME,
      defaultValue: '18:00:00',
    },
    diasDisponibles: {
      type: DataTypes.STRING(100),
      defaultValue: 'lunes,martes,miercoles,jueves,viernes',
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'ivi_especialistas',
    timestamps: true,
  }
);

// IviEspecialista.addIndex(['nombre'], { name: 'idx_especialista_nombre' });
// IviEspecialista.addIndex(['activo'], { name: 'idx_especialista_activo' });
