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

export const TIPOS_SOLICITUD = [
  'acceso',
  'rectificacion',
  'supresion',
  'oposicion',
  'portabilidad',
] as const;
export type TipoSolicitud = (typeof TIPOS_SOLICITUD)[number];

export const RESULTADOS_SOLICITUD = [
  'atendida',
  'atendida_parcial', // se suprimió lo que se podía; el resto se retiene por ley
  'rechazada', // hay una operación en curso
] as const;
export type ResultadoSolicitud = (typeof RESULTADOS_SOLICITUD)[number];

/**
 * Cada vez que un titular ejerce un derecho, queda la fila.
 *
 * Es la evidencia de haberlo atendido y en qué plazo, que es lo que se
 * fiscaliza: la Agencia no pide ver la política, pide ver los registros. Por lo
 * mismo estas filas sobreviven a la supresión del propio usuario —si se
 * borraran junto con él, se borraría la prueba de que se atendió su petición.
 */
export class SolicitudDatos extends Model<
  InferAttributes<SolicitudDatos>,
  InferCreationAttributes<SolicitudDatos>
> {
  declare id: CreationOptional<string>;
  declare usuarioId: ForeignKey<Usuario['id']>;

  declare tipo: TipoSolicitud;
  declare resultado: ResultadoSolicitud;
  /** Qué se hizo y qué quedó retenido, en palabras. */
  declare detalle: CreationOptional<string | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

SolicitudDatos.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    usuarioId: { type: DataTypes.UUID, allowNull: false },

    tipo: { type: DataTypes.ENUM(...TIPOS_SOLICITUD), allowNull: false },
    resultado: { type: DataTypes.ENUM(...RESULTADOS_SOLICITUD), allowNull: false },
    detalle: { type: DataTypes.TEXT, allowNull: true },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'SolicitudDatos',
    tableName: 'solicitudes_datos',
    indexes: [{ fields: ['usuario_id'] }, { fields: ['tipo'] }],
  },
);

SolicitudDatos.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'titular' });
