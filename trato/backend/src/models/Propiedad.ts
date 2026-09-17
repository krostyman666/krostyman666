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

export const TIPOS_PROPIEDAD = [
  'casa',
  'departamento',
  'oficina',
  'terreno',
  'bodega',
  'estacionamiento',
  'parcela',
] as const;
export type TipoPropiedad = (typeof TIPOS_PROPIEDAD)[number];

export const ESTADOS_PROPIEDAD = [
  'borrador',
  'en_revision',
  'publicada',
  'reservada',
  'vendida',
  'retirada',
] as const;
export type EstadoPropiedad = (typeof ESTADOS_PROPIEDAD)[number];

export const REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
] as const;
export type Region = (typeof REGIONES)[number];

export const MONEDAS = ['clp', 'uf'] as const;
export type Moneda = (typeof MONEDAS)[number];

export class Propiedad extends Model<
  InferAttributes<Propiedad>,
  InferCreationAttributes<Propiedad>
> {
  declare id: CreationOptional<string>;
  declare vendedorId: ForeignKey<Usuario['id']>;

  declare titulo: string;
  declare descripcion: string | null;
  declare tipo: TipoPropiedad;
  declare estado: CreationOptional<EstadoPropiedad>;

  declare precio: number;
  declare moneda: CreationOptional<Moneda>;

  declare calle: string;
  declare numero: string;
  declare depto: string | null;
  declare comuna: string;
  declare region: Region;
  declare latitud: number | null;
  declare longitud: number | null;

  /** Rol de avalúo del SII (formato "12345-67"). Llave para avalúo y contribuciones. */
  declare rolAvaluo: string | null;

  declare superficieTotal: number | null;
  declare superficieConstruida: number | null;
  declare dormitorios: number | null;
  declare banos: number | null;
  declare estacionamientos: CreationOptional<number>;
  declare bodegas: CreationOptional<number>;
  declare anoConstruccion: number | null;

  declare tieneHipoteca: CreationOptional<boolean>;
  declare fotos: CreationOptional<string[]>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Propiedad.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    vendedorId: { type: DataTypes.UUID, allowNull: false },

    titulo: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true } },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
    tipo: { type: DataTypes.ENUM(...TIPOS_PROPIEDAD), allowNull: false },
    estado: {
      type: DataTypes.ENUM(...ESTADOS_PROPIEDAD),
      allowNull: false,
      defaultValue: 'borrador',
    },

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

    calle: { type: DataTypes.STRING(150), allowNull: false },
    numero: { type: DataTypes.STRING(20), allowNull: false },
    depto: { type: DataTypes.STRING(20), allowNull: true },
    comuna: { type: DataTypes.STRING(80), allowNull: false },
    region: { type: DataTypes.ENUM(...REGIONES), allowNull: false },
    latitud: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    longitud: { type: DataTypes.DECIMAL(10, 7), allowNull: true },

    rolAvaluo: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: { is: /^\d{1,5}-\d{1,5}$/i },
    },

    superficieTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    superficieConstruida: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    dormitorios: { type: DataTypes.INTEGER, allowNull: true },
    banos: { type: DataTypes.INTEGER, allowNull: true },
    estacionamientos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    bodegas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    anoConstruccion: { type: DataTypes.INTEGER, allowNull: true },

    tieneHipoteca: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    fotos: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Propiedad',
    tableName: 'propiedades',
    indexes: [
      { fields: ['estado'] },
      { fields: ['comuna'] },
      { fields: ['tipo'] },
      { fields: ['vendedor_id'] },
    ],
  },
);

Usuario.hasMany(Propiedad, { foreignKey: 'vendedorId', as: 'propiedades' });
Propiedad.belongsTo(Usuario, { foreignKey: 'vendedorId', as: 'vendedor' });
