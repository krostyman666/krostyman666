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
import { POR_CODIGO } from '../dominio/documentos.catalogo';

export const ESTADOS_DOCUMENTO = [
  'requerido', // sabemos que hace falta, nadie lo ha pedido
  'solicitado', // se pidió al emisor
  'en_tramite', // el emisor lo está procesando
  'recibido', // lo tenemos
  'rechazado', // el emisor lo rechazó o salió con observaciones
  'no_aplica',
] as const;
export type EstadoDocumento = (typeof ESTADOS_DOCUMENTO)[number];

/**
 * Tener el papel no basta: la notaría debe revisarlo antes de la escritura.
 * "observado" significa que llegó pero con algo que corregir, y es distinto de
 * "rechazado" (que lo rechazó el emisor, no la notaría).
 */
export const VALIDACIONES = ['sin_revisar', 'en_revision', 'aprobado', 'observado'] as const;
export type Validacion = (typeof VALIDACIONES)[number];

export class Documento extends Model<
  InferAttributes<Documento>,
  InferCreationAttributes<Documento>
> {
  declare id: CreationOptional<string>;
  declare propiedadId: ForeignKey<Propiedad['id']>;

  /** Código del catálogo (ver dominio/documentos.catalogo.ts). */
  declare codigo: string;
  declare estado: CreationOptional<EstadoDocumento>;

  declare archivoUrl: string | null;
  declare fechaEmision: Date | null;
  declare observaciones: string | null;
  declare costoClp: number | null;

  declare validacion: CreationOptional<Validacion>;
  declare validadoPorId: CreationOptional<string | null>;
  declare validadoEn: CreationOptional<Date | null>;
  declare observacionNotaria: CreationOptional<string | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  /** Un certificado vencido hay que volver a pedirlo antes de firmar. */
  get vencido(): NonAttribute<boolean> {
    const def = POR_CODIGO.get(this.codigo);
    if (!def?.vigenciaDias || !this.fechaEmision || this.estado !== 'recibido') return false;
    const dias = (Date.now() - new Date(this.fechaEmision).getTime()) / 86_400_000;
    return dias > def.vigenciaDias;
  }

  get diasParaVencer(): NonAttribute<number | null> {
    const def = POR_CODIGO.get(this.codigo);
    if (!def?.vigenciaDias || !this.fechaEmision || this.estado !== 'recibido') return null;
    const dias = (Date.now() - new Date(this.fechaEmision).getTime()) / 86_400_000;
    return Math.ceil(def.vigenciaDias - dias);
  }

  /** Listo de verdad: lo tenemos, está vigente y la notaría lo aprobó. */
  get conforme(): NonAttribute<boolean> {
    return this.estado === 'recibido' && !this.vencido && this.validacion === 'aprobado';
  }

  toJSON(): Record<string, unknown> {
    const def = POR_CODIGO.get(this.codigo);
    const base = super.toJSON() as Record<string, unknown>;
    // `archivoUrl` es la clave interna de almacenamiento, no una URL que el
    // cliente deba ver ni pueda usar. Se reemplaza por un booleano; el archivo
    // se baja por el endpoint autenticado, nunca por esta clave.
    delete base.archivoUrl;
    return {
      ...base,
      tieneArchivo: this.archivoUrl !== null,
      nombre: def?.nombre ?? this.codigo,
      emisor: def?.emisor ?? null,
      responsable: def?.responsable ?? null,
      etapa: def?.etapa ?? null,
      comoSeObtiene: def?.comoSeObtiene ?? null,
      vencido: this.vencido,
      diasParaVencer: this.diasParaVencer,
      conforme: this.conforme,
    };
  }
}

Documento.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propiedadId: { type: DataTypes.UUID, allowNull: false },
    codigo: { type: DataTypes.STRING(60), allowNull: false },
    estado: {
      type: DataTypes.ENUM(...ESTADOS_DOCUMENTO),
      allowNull: false,
      defaultValue: 'requerido',
    },
    archivoUrl: { type: DataTypes.STRING(500), allowNull: true },
    fechaEmision: { type: DataTypes.DATE, allowNull: true },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
    costoClp: { type: DataTypes.INTEGER, allowNull: true },
    validacion: {
      type: DataTypes.ENUM(...VALIDACIONES),
      allowNull: false,
      defaultValue: 'sin_revisar',
    },
    validadoPorId: { type: DataTypes.UUID, allowNull: true },
    validadoEn: { type: DataTypes.DATE, allowNull: true },
    observacionNotaria: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'Documento',
    tableName: 'documentos',
    indexes: [
      { fields: ['propiedad_id'] },
      { fields: ['estado'] },
      { unique: true, fields: ['propiedad_id', 'codigo'] },
    ],
  },
);

// Si cambia el archivo o la fecha de emisión, es otro papel: lo que la notaría
// aprobó antes ya no es lo que está en el expediente, así que vuelve a revisión.
Documento.addHook('beforeUpdate', (documento) => {
  const doc = documento as Documento;
  const reemplazado = doc.changed('archivoUrl') || doc.changed('fechaEmision');
  if (reemplazado && !doc.changed('validacion')) {
    doc.set('validacion', 'sin_revisar');
    doc.set('validadoPorId', null);
    doc.set('validadoEn', null);
    doc.set('observacionNotaria', null);
  }
});

Propiedad.hasMany(Documento, { foreignKey: 'propiedadId', as: 'documentos' });
Documento.belongsTo(Propiedad, { foreignKey: 'propiedadId', as: 'propiedad' });
