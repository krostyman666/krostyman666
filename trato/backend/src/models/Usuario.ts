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

// 'abogado' existe porque un estudio de títulos sólo es tal si lo firma un
// abogado titulado, que responde por su conclusión. Sin ese rol no hay forma de
// distinguir una firma válida de cualquier usuario apretando el botón.
export const ROLES = [
  'vendedor',
  'comprador',
  'asesor',
  'notaria',
  'abogado',
  'admin',
] as const;
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
  /**
   * Queda en null cuando el titular ejerce su derecho de supresión. No es
   * opcional al registrarse: el esquema de registro lo exige.
   */
  declare rut: string | null;
  declare telefono: string | null;
  declare rol: CreationOptional<Rol>;
  /** Fecha en que se anonimizó por petición del titular. */
  declare anonimizadoEn: CreationOptional<Date | null>;
  /** Solo para usuarios con rol notaria: a qué oficina pertenecen. */
  declare socioId: CreationOptional<string | null>;
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
      // Nulo sólo por supresión del titular. En Postgres el índice único
      // admite varios nulos, así que no choca entre cuentas anonimizadas.
      allowNull: true,
      unique: true,
      set(valor: string | null) {
        this.setDataValue('rut', valor === null ? null : limpiarRut(valor));
      },
      validate: {
        rutChileno(valor: string | null) {
          if (valor !== null && !esRutValido(valor)) {
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
    socioId: { type: DataTypes.UUID, allowNull: true },
    anonimizadoEn: { type: DataTypes.DATE, allowNull: true },
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
