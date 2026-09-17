import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/database';
import { Propiedad } from './Propiedad';

/**
 * Las ventanas semanales en que el vendedor deja mostrar la propiedad. No son
 * horas de visita: de aquí salen los cupos concretos (ver visitas.service).
 *
 * Se guardan como hora de pared chilena porque es lo que el vendedor declara
 * ("los sábados de 11 a 13"), y eso no se corre con el cambio de horario.
 */
export class DisponibilidadVisita extends Model<
  InferAttributes<DisponibilidadVisita>,
  InferCreationAttributes<DisponibilidadVisita>
> {
  declare id: CreationOptional<string>;
  declare propiedadId: ForeignKey<Propiedad['id']>;

  /** 0 = domingo, igual que `Date.getDay()`. */
  declare diaSemana: number;
  declare horaInicio: string;
  declare horaFin: string;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

DisponibilidadVisita.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propiedadId: { type: DataTypes.UUID, allowNull: false },
    diaSemana: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 6 },
    },
    horaInicio: { type: DataTypes.TIME, allowNull: false },
    horaFin: { type: DataTypes.TIME, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'DisponibilidadVisita',
    tableName: 'disponibilidad_visitas',
    indexes: [{ fields: ['propiedad_id'] }],
  },
);

Propiedad.hasMany(DisponibilidadVisita, {
  foreignKey: 'propiedadId',
  as: 'disponibilidad',
});
DisponibilidadVisita.belongsTo(Propiedad, { foreignKey: 'propiedadId', as: 'propiedad' });
