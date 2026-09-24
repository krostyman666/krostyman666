import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/database';
import { ChatSession } from './ChatSession';

export type SenderType = 'user' | 'bot' | 'admin';
export type ChannelType = 'web' | 'whatsapp';

export class Message extends Model<
  InferAttributes<Message>,
  InferCreationAttributes<Message>
> {
  declare id: CreationOptional<string>;
  declare sessionId: string;
  declare sender: SenderType;
  declare content: string;
  declare channel: CreationOptional<ChannelType>;
  declare timestamp: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: ChatSession,
        key: 'id',
      },
    },
    sender: {
      type: DataTypes.ENUM('user', 'bot', 'admin'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    channel: {
      type: DataTypes.ENUM('web', 'whatsapp'),
      defaultValue: 'web',
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'messages',
    timestamps: true,
  }
);

// Asociaciones
Message.belongsTo(ChatSession, { foreignKey: 'sessionId' });
ChatSession.hasMany(Message, { foreignKey: 'sessionId' });
