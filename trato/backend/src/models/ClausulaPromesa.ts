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
import { Promesa } from './Promesa';
import { Usuario } from './Usuario';

/**
 * Una cláusula de la promesa, con el rastro de quién la propuso y si la otra
 * parte la aceptó.
 *
 * Quien propone el texto se entiende de acuerdo con él, así que basta la
 * aceptación de la contraparte para que la cláusula quede cerrada. Cambiar el
 * texto anula esa aceptación: si no, se podría acordar algo y reescribirlo
 * después, que es exactamente lo que este modelo existe para impedir.
 */
export class ClausulaPromesa extends Model<
  InferAttributes<ClausulaPromesa>,
  InferCreationAttributes<ClausulaPromesa>
> {
  declare id: CreationOptional<string>;
  declare promesaId: ForeignKey<Promesa['id']>;

  /** Código del catálogo (ver dominio/promesa.ts). */
  declare codigo: string;
  declare texto: string;
  declare orden: CreationOptional<number>;

  declare propuestaPorId: ForeignKey<Usuario['id']>;
  declare aceptadaPorId: CreationOptional<string | null>;
  declare aceptadaEn: CreationOptional<Date | null>;

  /** Por qué la contraparte pidió cambiarla. Se muestra junto al texto nuevo. */
  declare comentario: CreationOptional<string | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  /** Cerrada: las dos partes están con el mismo texto. */
  get acordada(): NonAttribute<boolean> {
    return this.aceptadaPorId !== null;
  }
}

ClausulaPromesa.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    promesaId: { type: DataTypes.UUID, allowNull: false },

    codigo: { type: DataTypes.STRING(60), allowNull: false },
    texto: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
    orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    propuestaPorId: { type: DataTypes.UUID, allowNull: false },
    aceptadaPorId: { type: DataTypes.UUID, allowNull: true },
    aceptadaEn: { type: DataTypes.DATE, allowNull: true },

    comentario: { type: DataTypes.TEXT, allowNull: true },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'ClausulaPromesa',
    tableName: 'clausulas_promesa',
    indexes: [
      { fields: ['promesa_id'] },
      { unique: true, fields: ['promesa_id', 'codigo'] },
    ],
  },
);

// Si cambia el texto, lo que la otra parte aceptó ya no es lo que dice la
// cláusula. Va como hook del modelo y no del servicio para que no dependa de
// por dónde entre el cambio, igual que en Documento.
ClausulaPromesa.addHook('beforeUpdate', (instancia) => {
  const clausula = instancia as ClausulaPromesa;
  if (clausula.changed('texto') && !clausula.changed('aceptadaPorId')) {
    clausula.set('aceptadaPorId', null);
    clausula.set('aceptadaEn', null);
  }
});

Promesa.hasMany(ClausulaPromesa, { foreignKey: 'promesaId', as: 'clausulas' });
ClausulaPromesa.belongsTo(Promesa, { foreignKey: 'promesaId', as: 'promesa' });
ClausulaPromesa.belongsTo(Usuario, { foreignKey: 'propuestaPorId', as: 'propuestaPor' });
