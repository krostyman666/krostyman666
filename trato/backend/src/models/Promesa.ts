import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/database';
import { Propiedad, MONEDAS, type Moneda } from './Propiedad';
import { Usuario } from './Usuario';
import { ESTADOS_PROMESA, type EstadoPromesa } from '../dominio/promesa';

/**
 * La promesa de compraventa entre un comprador y un vendedor.
 *
 * Nace "negociando" y sólo pasa a "acordada" cuando ambas partes aceptaron
 * todas las cláusulas y se cumplen los cuatro requisitos del artículo 1554. Ese
 * orden importa: una promesa a la que le falta uno de esos requisitos es nula
 * de nulidad absoluta, así que no puede llegar a firma por descuido.
 */
export class Promesa extends Model<
  InferAttributes<Promesa>,
  InferCreationAttributes<Promesa>
> {
  declare id: CreationOptional<string>;
  declare propiedadId: ForeignKey<Propiedad['id']>;
  declare compradorId: ForeignKey<Usuario['id']>;
  declare vendedorId: ForeignKey<Usuario['id']>;

  declare precio: number;
  declare moneda: CreationOptional<Moneda>;
  /** Lo que se paga al firmar la promesa. El resto va a la escritura. */
  declare pie: CreationOptional<number | null>;

  /** Fecha límite para otorgar la escritura. Es el plazo del 1554 Nº3. */
  declare fechaEscritura: CreationOptional<Date | null>;

  declare estado: CreationOptional<EstadoPromesa>;

  declare acordadaEn: CreationOptional<Date | null>;
  declare firmadaEn: CreationOptional<Date | null>;
  declare cerradaEn: CreationOptional<Date | null>;
  declare motivoCierre: CreationOptional<string | null>;

  /** La promesa acordada la revisa un abogado antes de la firma. */
  declare revisadaPorId: CreationOptional<string | null>;
  declare revisadaEn: CreationOptional<Date | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Promesa.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propiedadId: { type: DataTypes.UUID, allowNull: false },
    compradorId: { type: DataTypes.UUID, allowNull: false },
    vendedorId: { type: DataTypes.UUID, allowNull: false },

    precio: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 1 },
      get(): number {
        const valor = this.getDataValue('precio');
        return valor === null ? 0 : Number(valor);
      },
    },
    moneda: { type: DataTypes.ENUM(...MONEDAS), allowNull: false, defaultValue: 'uf' },
    pie: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      get(): number | null {
        const valor = this.getDataValue('pie');
        return valor === null ? null : Number(valor);
      },
    },

    fechaEscritura: { type: DataTypes.DATEONLY, allowNull: true },

    estado: {
      type: DataTypes.ENUM(...ESTADOS_PROMESA),
      allowNull: false,
      defaultValue: 'negociando',
    },

    acordadaEn: { type: DataTypes.DATE, allowNull: true },
    firmadaEn: { type: DataTypes.DATE, allowNull: true },
    cerradaEn: { type: DataTypes.DATE, allowNull: true },
    motivoCierre: { type: DataTypes.TEXT, allowNull: true },

    revisadaPorId: { type: DataTypes.UUID, allowNull: true },
    revisadaEn: { type: DataTypes.DATE, allowNull: true },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Promesa',
    tableName: 'promesas',
    indexes: [
      { fields: ['propiedad_id'] },
      { fields: ['comprador_id'] },
      { fields: ['vendedor_id'] },
      { fields: ['estado'] },
    ],
  },
);

Propiedad.hasMany(Promesa, { foreignKey: 'propiedadId', as: 'promesas' });
Promesa.belongsTo(Propiedad, { foreignKey: 'propiedadId', as: 'propiedad' });
Promesa.belongsTo(Usuario, { foreignKey: 'compradorId', as: 'comprador' });
Promesa.belongsTo(Usuario, { foreignKey: 'vendedorId', as: 'vendedor' });
Promesa.belongsTo(Usuario, { foreignKey: 'revisadaPorId', as: 'revisadaPor' });
