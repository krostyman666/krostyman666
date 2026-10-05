import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/database';
import { Usuario } from './Usuario';

/**
 * Cada corrida de la purga de datos vencidos, con lo que tocó.
 *
 * Es la evidencia de que la purga se ejecutó y qué hizo -- el mismo papel que
 * `SolicitudDatos` cumple cuando un titular ejerce un derecho, pero acá no hay
 * un titular: la dispara el equipo (rol admin), después de mirar la lista de
 * `datosVencidos()`. Por eso sigue siendo una decisión operativa y no un cron
 * silencioso -- lo que cambia es que ahora hay un botón que la ejecuta de
 * verdad, en vez de sólo informar.
 */
export class PurgaRegistro extends Model<
  InferAttributes<PurgaRegistro>,
  InferCreationAttributes<PurgaRegistro>
> {
  declare id: CreationOptional<string>;
  declare ejecutadaPorId: ForeignKey<Usuario['id']>;
  /** Qué actividad tocó, cuántas filas y qué se les hizo. */
  declare acciones: CreationOptional<Record<string, unknown>[]>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

PurgaRegistro.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ejecutadaPorId: { type: DataTypes.UUID, allowNull: false },
    acciones: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'PurgaRegistro',
    tableName: 'purgas_registro',
    indexes: [{ fields: ['ejecutada_por_id'] }],
  },
);

PurgaRegistro.belongsTo(Usuario, { foreignKey: 'ejecutadaPorId', as: 'ejecutadaPor' });
