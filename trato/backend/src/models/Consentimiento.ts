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
import { Usuario } from './Usuario';
import { Propiedad } from './Propiedad';

export const TIPOS_CONSENTIMIENTO = [
  /** El vendedor autoriza mostrar antecedentes suyos y del inmueble al comprador. */
  'divulgacion_antecedentes',
] as const;
export type TipoConsentimiento = (typeof TIPOS_CONSENTIMIENTO)[number];

/**
 * La autorización del titular para tratar sus datos, guardada como evidencia.
 *
 * Existe porque la Ley 21.719 dejó de aceptar que un dato esté en una fuente de
 * acceso público como base suficiente para tratarlo: la inscripción en el
 * Conservador es pública, pero eso no habilita por sí solo a republicarla en un
 * informe que vendemos. La base de licitud acá es el consentimiento del
 * vendedor, otorgado al publicar.
 *
 * Se guarda `textoVersion` y no sólo un booleano porque lo que se fiscaliza es
 * qué autorizó exactamente y cuándo. Un `true` sin la redacción que la persona
 * leyó no prueba nada. Por lo mismo las filas no se borran ni se editan: revocar
 * llena `revocadoEn` y deja el historial intacto.
 */
export class Consentimiento extends Model<
  InferAttributes<Consentimiento>,
  InferCreationAttributes<Consentimiento>
> {
  declare id: CreationOptional<string>;
  /** El titular de los datos, que es quien autoriza. */
  declare usuarioId: ForeignKey<Usuario['id']>;
  declare propiedadId: ForeignKey<Propiedad['id']>;

  declare tipo: TipoConsentimiento;
  /** Identificador de la redacción aceptada, p. ej. "divulgacion-2026-09". */
  declare textoVersion: string;

  declare otorgadoEn: CreationOptional<Date>;
  declare revocadoEn: CreationOptional<Date | null>;

  declare ip: CreationOptional<string | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  get vigente(): NonAttribute<boolean> {
    return this.revocadoEn === null;
  }
}

Consentimiento.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    usuarioId: { type: DataTypes.UUID, allowNull: false },
    propiedadId: { type: DataTypes.UUID, allowNull: false },

    tipo: { type: DataTypes.ENUM(...TIPOS_CONSENTIMIENTO), allowNull: false },
    textoVersion: { type: DataTypes.STRING(60), allowNull: false },

    otorgadoEn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    revocadoEn: { type: DataTypes.DATE, allowNull: true },

    ip: { type: DataTypes.STRING(64), allowNull: true },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Consentimiento',
    tableName: 'consentimientos',
    indexes: [{ fields: ['propiedad_id', 'tipo'] }, { fields: ['usuario_id'] }],
  },
);

Propiedad.hasMany(Consentimiento, { foreignKey: 'propiedadId', as: 'consentimientos' });
Consentimiento.belongsTo(Propiedad, { foreignKey: 'propiedadId', as: 'propiedad' });
Consentimiento.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'titular' });
