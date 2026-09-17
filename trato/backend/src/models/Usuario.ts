import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type NonAttribute,
} from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { esRutValido, limpiarRut } from '../utils/rut';

const COSTO_BCRYPT = 12;

export const ROLES = ['vendedor', 'comprador', 'asesor', 'admin'] as const;
export type Rol = (typeof ROLES)[number];

export class Usuario extends Model<
  InferAttributes<Usuario>,
  InferCreationAttributes<Usuario>
> {
  declare id: CreationOptional<string>;
  declare email: string;
  declare passwordHash: string;
  declare nombre: string;
  declare apellido: string;
  declare rut: string;
  declare telefono: string | null;
  declare rol: CreationOptional<Rol>;
  declare emailVerificado: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  async verificarPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  get nombreCompleto(): NonAttribute<string> {
    return `${this.nombre} ${this.apellido}`;
  }

  toJSON(): Record<string, unknown> {
    const { passwordHash, ...resto } = super.toJSON() as Record<string, unknown>;
    void passwordHash;
    return resto;
  }
}

Usuario.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      set(valor: string) {
        this.setDataValue('email', valor.trim().toLowerCase());
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    rut: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: true,
      set(valor: string) {
        this.setDataValue('rut', limpiarRut(valor));
      },
      validate: {
        rutChileno(valor: string) {
          if (!esRutValido(valor)) {
            throw new Error('El RUT no es válido');
          }
        },
      },
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    rol: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false,
      defaultValue: 'comprador',
    },
    emailVerificado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    indexes: [{ fields: ['email'] }, { fields: ['rut'] }],
  },
);

export async function hashearPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COSTO_BCRYPT);
}
