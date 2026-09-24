import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';

export class IviIntegracion extends Model<
  InferAttributes<IviIntegracion>,
  InferCreationAttributes<IviIntegracion>
> {
  declare id: CreationOptional<string>;

  // Outlook (Calendario médico)
  declare outlookToken?: string | null;
  declare outlookTenantId?: string | null;
  declare outlookCalendarId?: string | null;

  // Webpay (Transbank)
  declare webpayCommerceCode?: string | null;
  declare webpayApiKey?: string | null;
  declare webpayAmbiente: CreationOptional<'sandbox' | 'produccion'>;

  // SendGrid (Email)
  declare sendgridApiKey?: string | null;
  declare sendgridFromEmail: CreationOptional<string>;

  // Twilio (SMS)
  declare twilioAccountSid?: string | null;
  declare twilioAuthToken?: string | null;
  declare twilioPhoneNumber?: string | null;

  // Claude API
  declare claudeApiKey?: string | null;
  declare claudeModel: CreationOptional<string>;

  // Metadata
  declare actualizadoPor?: string | null;
  declare actualizadoEn: CreationOptional<Date>;
}

IviIntegracion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    outlookToken: {
      type: DataTypes.TEXT,
      comment: 'Token de autenticación de Outlook',
    },
    outlookTenantId: {
      type: DataTypes.STRING(255),
    },
    outlookCalendarId: {
      type: DataTypes.STRING(255),
    },
    webpayCommerceCode: {
      type: DataTypes.STRING(50),
    },
    webpayApiKey: {
      type: DataTypes.TEXT,
    },
    webpayAmbiente: {
      type: DataTypes.ENUM('sandbox', 'produccion'),
      defaultValue: 'sandbox',
    },
    sendgridApiKey: {
      type: DataTypes.TEXT,
    },
    sendgridFromEmail: {
      type: DataTypes.STRING(255),
      defaultValue: 'noreply@ivinet.cl',
    },
    twilioAccountSid: {
      type: DataTypes.TEXT,
    },
    twilioAuthToken: {
      type: DataTypes.TEXT,
    },
    twilioPhoneNumber: {
      type: DataTypes.STRING(20),
    },
    claudeApiKey: {
      type: DataTypes.TEXT,
    },
    claudeModel: {
      type: DataTypes.STRING(50),
      defaultValue: 'claude-3-5-sonnet-20241022',
    },
    actualizadoPor: {
      type: DataTypes.STRING(255),
      comment: 'Email del admin',
    },
    actualizadoEn: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'ivi_integraciones',
    timestamps: false,
  }
);
