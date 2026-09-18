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
import { Propiedad } from './Propiedad';
import { Usuario } from './Usuario';
import { NIVELES_INFORME, type NivelInforme } from '../dominio/informe.catalogo';

export const ESTADOS_INFORME = [
  'emitido', // nivel antecedentes: se arma y se entrega al instante
  'esperando_pago', // nivel títulos: pedido pero no pagado
  'en_preparacion', // pagado; se están pidiendo los certificados al Conservador
  'entregado',
  'anulado',
] as const;
export type EstadoInforme = (typeof ESTADOS_INFORME)[number];

/**
 * Un informe emitido para un comprador sobre una propiedad.
 *
 * `contenido` guarda el informe tal como se entregó, no una vista que se
 * recalcula. Es deliberado: los certificados del Conservador vencen a los 30
 * días en la práctica bancaria, así que un informe es una foto fechada. Si se
 * regenerara al abrirlo, el comprador vería datos distintos de los que usó para
 * ofertar y nadie podría reconstruir en qué se basó.
 *
 * La fila es además el registro de quién accedió a datos de quién y cuándo, que
 * es la evidencia que exige la Ley 21.719.
 */
export class Informe extends Model<
  InferAttributes<Informe>,
  InferCreationAttributes<Informe>
> {
  declare id: CreationOptional<string>;
  declare propiedadId: ForeignKey<Propiedad['id']>;
  declare compradorId: ForeignKey<Usuario['id']>;

  declare nivel: NivelInforme;
  declare estado: CreationOptional<EstadoInforme>;

  /** Lo que se le cobra al comprador. 0 en el nivel gratis. */
  declare precioClp: CreationOptional<number>;

  declare contenido: CreationOptional<Record<string, unknown>>;

  declare emitidoEn: CreationOptional<Date | null>;
  declare pagadoEn: CreationOptional<Date | null>;
  declare entregadoEn: CreationOptional<Date | null>;

  /**
   * La firma que convierte una carpeta de títulos en un estudio de títulos. La
   * pauta del Colegio de Abogados pide conclusión, detalle de los defectos,
   * fecha, firma y datos del abogado, que responde por lo que sostiene.
   */
  declare abogadoId: CreationOptional<string | null>;
  declare firmadoEn: CreationOptional<Date | null>;
  declare conclusion: CreationOptional<string | null>;
  declare defectos: CreationOptional<string[]>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  /** Sin firma de abogado es una carpeta de documentos, no un estudio de títulos. */
  get esEstudioDeTitulos(): NonAttribute<boolean> {
    return this.nivel === 'titulos' && this.firmadoEn !== null;
  }
}

Informe.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propiedadId: { type: DataTypes.UUID, allowNull: false },
    compradorId: { type: DataTypes.UUID, allowNull: false },

    nivel: { type: DataTypes.ENUM(...NIVELES_INFORME), allowNull: false },
    estado: {
      type: DataTypes.ENUM(...ESTADOS_INFORME),
      allowNull: false,
      defaultValue: 'emitido',
    },

    precioClp: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    contenido: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },

    emitidoEn: { type: DataTypes.DATE, allowNull: true },
    pagadoEn: { type: DataTypes.DATE, allowNull: true },
    entregadoEn: { type: DataTypes.DATE, allowNull: true },

    abogadoId: { type: DataTypes.UUID, allowNull: true },
    firmadoEn: { type: DataTypes.DATE, allowNull: true },
    conclusion: { type: DataTypes.TEXT, allowNull: true },
    defectos: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Informe',
    tableName: 'informes',
    indexes: [
      { fields: ['propiedad_id'] },
      { fields: ['comprador_id'] },
      { fields: ['estado'] },
    ],
  },
);

Propiedad.hasMany(Informe, { foreignKey: 'propiedadId', as: 'informes' });
Informe.belongsTo(Propiedad, { foreignKey: 'propiedadId', as: 'propiedad' });
Informe.belongsTo(Usuario, { foreignKey: 'compradorId', as: 'comprador' });
Informe.belongsTo(Usuario, { foreignKey: 'abogadoId', as: 'abogado' });
