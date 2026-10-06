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
 * Una vulneración de seguridad declarada por el equipo (Ley 21.719, art. 14
 * sexies -- ver `dominio/brechas.ts`). Nace cuando alguien del equipo la
 * declara, no cuando ocurre: `detectadoEn` es el momento en que se toma
 * conocimiento, que es desde donde corre el plazo de 72 horas hacia la
 * Agencia, no desde el incidente mismo.
 *
 * Las dos notificaciones quedan como fecha, no como booleano, por la misma
 * razón que `PurgaRegistro` o `SolicitudDatos`: lo que se fiscaliza es
 * evidencia fechada de que se cumplió, no una casilla marcada.
 */
export class IncidenteSeguridad extends Model<
  InferAttributes<IncidenteSeguridad>,
  InferCreationAttributes<IncidenteSeguridad>
> {
  declare id: CreationOptional<string>;
  declare declaradoPorId: ForeignKey<Usuario['id']>;

  declare titulo: string;
  declare descripcion: string;
  /** Códigos de `REGISTRO_TRATAMIENTO` (dominio/datos-personales.ts) que tocó. */
  declare categoriasAfectadas: string[];
  declare cantidadAfectadaEstimada: number | null;

  declare detectadoEn: Date;
  declare notificadaAgenciaEn: CreationOptional<Date | null>;
  declare notificadaTitularesEn: CreationOptional<Date | null>;
  declare medidasAdoptadas: CreationOptional<string | null>;
  declare cerradoEn: CreationOptional<Date | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

IncidenteSeguridad.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    declaradoPorId: { type: DataTypes.UUID, allowNull: false },

    titulo: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true } },
    descripcion: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
    categoriasAfectadas: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    cantidadAfectadaEstimada: { type: DataTypes.INTEGER, allowNull: true },

    detectadoEn: { type: DataTypes.DATE, allowNull: false },
    notificadaAgenciaEn: { type: DataTypes.DATE, allowNull: true },
    notificadaTitularesEn: { type: DataTypes.DATE, allowNull: true },
    medidasAdoptadas: { type: DataTypes.TEXT, allowNull: true },
    cerradoEn: { type: DataTypes.DATE, allowNull: true },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'IncidenteSeguridad',
    tableName: 'incidentes_seguridad',
    indexes: [{ fields: ['declarado_por_id'] }, { fields: ['detectado_en'] }],
  },
);

IncidenteSeguridad.belongsTo(Usuario, { foreignKey: 'declaradoPorId', as: 'declaradoPor' });
