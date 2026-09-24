import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';

export class IviPresupuesto extends Model<
  InferAttributes<IviPresupuesto>,
  InferCreationAttributes<IviPresupuesto>
> {
  declare id: CreationOptional<string>;

  declare tipoConsulta: string; // inicial, congelacion, etc

  // Desglose de precios
  declare precioBase: number; // ej: 150000

  // Opcionales (flexibilidad con JSON)
  declare opcionales: Record<string, { nombre: string; precio: number }>;

  declare precioTotal: number; // Calculado automáticamente

  // Descuentos (si aplica)
  declare descuentoPorcentaje: CreationOptional<number>;
  declare descuentoMonto: CreationOptional<number>;
  declare precioFinal: number;

  // Validez
  declare vigenciaDias: CreationOptional<number>;
  declare vigentaHasta: CreationOptional<Date>;

  // Metadata
  declare creadoPor?: string | null; // email del especialista que lo sugirió
  declare createdAt: CreationOptional<Date>;
}

IviPresupuesto.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tipoConsulta: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'inicial, congelacion, etc',
    },
    precioBase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'ej: 150000',
    },
    opcionales: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment:
        'Ejemplo: { "bateria_hormonal": { "nombre": "...", "precio": 80000 } }',
    },
    precioTotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    descuentoPorcentaje: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    descuentoMonto: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    precioFinal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    vigenciaDias: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
    },
    vigentaHasta: {
      type: DataTypes.DATE,
    },
    creadoPor: {
      type: DataTypes.STRING(255),
      comment: 'Email del especialista que lo sugirió',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'ivi_presupuestos',
    timestamps: false, // Solo createdAt
  }
);
