import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/database';
import { Promesa } from './Promesa';
import { Usuario } from './Usuario';
import { PROVEEDORES_FIRMA, ROLES_FIRMA, type ProveedorFirma, type RolFirma } from '../dominio/firma';

/**
 * La firma de una de las partes sobre la promesa.
 *
 * Es la evidencia de que esta persona consintió este documento exacto, en este
 * momento, desde esta IP. Guarda el texto íntegro firmado y su hash a propósito:
 * lo que se fiscaliza es qué se firmó, no un booleano de "firmó sí/no". Si el
 * texto de la promesa cambiara después, el hash guardado no calzaría y la
 * manipulación quedaría probada.
 *
 * Una fila por parte (índice único). La promesa pasa a "firmada" cuando existen
 * las dos y ambas apuntan al mismo hash: no se puede cerrar con las partes
 * firmando documentos distintos.
 */
export class FirmaPromesa extends Model<
  InferAttributes<FirmaPromesa>,
  InferCreationAttributes<FirmaPromesa>
> {
  declare id: CreationOptional<string>;
  declare promesaId: ForeignKey<Promesa['id']>;
  declare firmantePorId: ForeignKey<Usuario['id']>;
  declare rol: RolFirma;

  /** El documento exacto que firmó, congelado. */
  declare texto: string;
  /** SHA-256 del texto. Las dos firmas de una promesa comparten hash. */
  declare textoHash: string;

  declare proveedor: CreationOptional<ProveedorFirma>;
  /** Referencia del proveedor externo (p. ej. el envelope de DocuSign). */
  declare proveedorRef: CreationOptional<string | null>;

  declare ip: CreationOptional<string | null>;
  declare firmadoEn: CreationOptional<Date>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

FirmaPromesa.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    promesaId: { type: DataTypes.UUID, allowNull: false },
    firmantePorId: { type: DataTypes.UUID, allowNull: false },
    rol: { type: DataTypes.ENUM(...ROLES_FIRMA), allowNull: false },

    texto: { type: DataTypes.TEXT, allowNull: false },
    textoHash: { type: DataTypes.STRING(64), allowNull: false },

    proveedor: {
      type: DataTypes.ENUM(...PROVEEDORES_FIRMA),
      allowNull: false,
      defaultValue: 'simple',
    },
    proveedorRef: { type: DataTypes.STRING(200), allowNull: true },

    ip: { type: DataTypes.STRING(64), allowNull: true },
    firmadoEn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'FirmaPromesa',
    tableName: 'firmas_promesa',
    indexes: [
      { fields: ['promesa_id'] },
      { unique: true, fields: ['promesa_id', 'firmante_por_id'] },
    ],
  },
);

Promesa.hasMany(FirmaPromesa, { foreignKey: 'promesaId', as: 'firmas' });
FirmaPromesa.belongsTo(Promesa, { foreignKey: 'promesaId', as: 'promesa' });
FirmaPromesa.belongsTo(Usuario, { foreignKey: 'firmantePorId', as: 'firmante' });
