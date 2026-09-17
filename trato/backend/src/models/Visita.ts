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
import { Usuario } from './Usuario';

export const ESTADOS_VISITA = [
  'solicitada', // el comprador pidió el cupo; falta asignar asesor
  'confirmada', // hay asesor asignado y el comprador está avisado
  'realizada',
  'cancelada',
  'no_asistio', // el comprador no llegó; el asesor sí viajó
] as const;
export type EstadoVisita = (typeof ESTADOS_VISITA)[number];

/** Una visita ocupada sigue bloqueando el cupo; una cerrada ya no. */
export const ESTADOS_VISITA_ACTIVOS: EstadoVisita[] = ['solicitada', 'confirmada'];

export class Visita extends Model<
  InferAttributes<Visita>,
  InferCreationAttributes<Visita>
> {
  declare id: CreationOptional<string>;
  declare propiedadId: ForeignKey<Propiedad['id']>;
  declare compradorId: ForeignKey<Usuario['id']>;

  /** Se asigna al armar la ruta del día, no al reservar. */
  declare asesorId: CreationOptional<string | null>;

  declare inicio: Date;
  declare fin: Date;
  declare estado: CreationOptional<EstadoVisita>;

  declare mensaje: CreationOptional<string | null>;
  declare motivoCierre: CreationOptional<string | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Visita.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propiedadId: { type: DataTypes.UUID, allowNull: false },
    compradorId: { type: DataTypes.UUID, allowNull: false },
    asesorId: { type: DataTypes.UUID, allowNull: true },

    inicio: { type: DataTypes.DATE, allowNull: false },
    fin: { type: DataTypes.DATE, allowNull: false },
    estado: {
      type: DataTypes.ENUM(...ESTADOS_VISITA),
      allowNull: false,
      defaultValue: 'solicitada',
    },

    mensaje: { type: DataTypes.TEXT, allowNull: true },
    motivoCierre: { type: DataTypes.TEXT, allowNull: true },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Visita',
    tableName: 'visitas',
    indexes: [
      { fields: ['propiedad_id'] },
      { fields: ['comprador_id'] },
      { fields: ['asesor_id'] },
      { fields: ['inicio'] },
    ],
  },
);

Propiedad.hasMany(Visita, { foreignKey: 'propiedadId', as: 'visitas' });
Visita.belongsTo(Propiedad, { foreignKey: 'propiedadId', as: 'propiedad' });

Visita.belongsTo(Usuario, { foreignKey: 'compradorId', as: 'comprador' });
Visita.belongsTo(Usuario, { foreignKey: 'asesorId', as: 'asesor' });
