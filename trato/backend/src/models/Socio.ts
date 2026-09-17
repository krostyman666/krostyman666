import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';

export const TIPOS_SOCIO = ['notaria', 'conservador'] as const;
export type TipoSocio = (typeof TIPOS_SOCIO)[number];

/**
 * Notarías y Conservadores con los que operamos.
 *
 * Los Conservadores son territoriales: cada propiedad pertenece al Conservador
 * de su territorio y no se puede elegir otro. Las notarías sí se eligen, pero
 * en la práctica conviene una de la misma zona.
 */
export class Socio extends Model<InferAttributes<Socio>, InferCreationAttributes<Socio>> {
  declare id: CreationOptional<string>;
  declare tipo: TipoSocio;
  declare nombre: string;
  declare comuna: string;
  declare region: string;
  declare email: string | null;
  declare telefono: string | null;
  declare direccion: string | null;
  declare activo: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Socio.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tipo: { type: DataTypes.ENUM(...TIPOS_SOCIO), allowNull: false },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    comuna: { type: DataTypes.STRING(80), allowNull: false },
    region: { type: DataTypes.STRING(80), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    telefono: { type: DataTypes.STRING(20), allowNull: true },
    direccion: { type: DataTypes.STRING(200), allowNull: true },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Socio',
    tableName: 'socios',
    indexes: [{ fields: ['tipo'] }, { fields: ['comuna'] }, { fields: ['activo'] }],
  },
);
