import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';

export type LeadStatus = 'cold' | 'warm' | 'hot';
export type ChannelType = 'web' | 'whatsapp';

export class ChatSession extends Model<
  InferAttributes<ChatSession>,
  InferCreationAttributes<ChatSession>
> {
  declare id: CreationOptional<string>;

  // Identificación del cliente
  declare email: string;
  declare telefono?: string | null;
  declare nombre?: string | null;
  declare rut?: string | null;

  // WhatsApp
  declare whatsappPhone?: string | null; // Número de WhatsApp del cliente
  declare channel: CreationOptional<ChannelType>; // web o whatsapp

  // Conversación (JSON array de mensajes)
  declare conversacion: Array<{ role: 'user' | 'assistant'; content: string }>;

  // Calificación del lead
  declare leadScore: number; // 0-100
  declare leadStatus: CreationOptional<LeadStatus>; // cold, warm, hot

  // Intención y datos demográficos
  declare interesTratamiento?: string | null; // congelacion, fiv, ia, etc
  declare edad?: number | null;
  declare situacionMarital?: string | null; // pareja_heterosexual, pareja_homosexual, soltera, etc

  // Metadata
  declare primeraInteraccion: CreationOptional<Date>;
  declare ultimaInteraccion: CreationOptional<Date>;
  declare duracionSesionMinutos?: number | null;

  // Seguimiento
  declare convertidoAReserva: CreationOptional<boolean>;
  declare reservaId?: string | null; // Foreign key cuando se convierte

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ChatSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    telefono: {
      type: DataTypes.STRING(20),
    },
    nombre: {
      type: DataTypes.STRING(255),
    },
    rut: {
      type: DataTypes.STRING(12),
      unique: true,
      allowNull: true,
    },
    whatsappPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    channel: {
      type: DataTypes.ENUM('web', 'whatsapp'),
      defaultValue: 'web',
    },
    conversacion: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of {role, content} messages',
    },
    leadScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    leadStatus: {
      type: DataTypes.ENUM('cold', 'warm', 'hot'),
      defaultValue: 'cold',
    },
    interesTratamiento: {
      type: DataTypes.STRING(100),
      comment: 'congelacion, fiv, ia, etc',
    },
    edad: {
      type: DataTypes.INTEGER,
    },
    situacionMarital: {
      type: DataTypes.STRING(50),
      comment: 'pareja_heterosexual, pareja_homosexual, soltera, etc',
    },
    primeraInteraccion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    ultimaInteraccion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    duracionSesionMinutos: {
      type: DataTypes.INTEGER,
    },
    convertidoAReserva: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reservaId: {
      type: DataTypes.UUID,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'chat_sessions',
    timestamps: true,
  }
);

// Indices (ver migraciones para crear en DB)
// ChatSession.addIndex(['email'], { name: 'idx_chat_email' });
// ChatSession.addIndex(['leadStatus'], { name: 'idx_chat_lead_status' });
// ChatSession.addIndex(['convertidoAReserva'], { name: 'idx_chat_convertido' });
