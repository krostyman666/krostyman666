import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/database';
import { Propiedad } from './Propiedad';
import { Usuario } from './Usuario';
import { DESTINOS, type Destino } from '../dominio/bot.catalogo';

/**
 * Cada pregunta que le hicieron al bot y qué se le respondió.
 *
 * Se guarda por tres motivos distintos, y conviene no perder ninguno de vista
 * al tocar esta tabla:
 *
 * 1. **Las derivaciones son una cola de trabajo, no una cortesía.** Cuando el
 *    bot dice "te responde un asesor", alguien tiene que responder. Sin esta
 *    fila esa promesa no existe en ninguna parte y el comprador queda esperando
 *    una llamada que nadie sabe que debe hacer. `atendidoEn` es lo que cierra
 *    el ciclo.
 * 2. **Las preguntas que no entendió son la hoja de ruta del bot.** La métrica
 *    que importa es qué proporción cae en `entendido: false`, y de ahí salen
 *    los temas que faltan. Sin el registro habría que adivinarlos.
 * 3. **Es evidencia de qué se le dijo a cada comprador.** En una compraventa
 *    importa qué se afirmó antes de ofertar.
 *
 * El texto de la pregunta lo escribe el comprador y puede contener cualquier
 * cosa, incluido su teléfono. Se borra al suprimir la cuenta, igual que
 * `Visita.mensaje`. Lo que queda —tema, si se entendió, a dónde derivó— no
 * identifica a nadie y es justamente lo que sirve para mejorar el bot.
 *
 * `usuarioId` es nulo a propósito: el bot contesta sin sesión, porque
 * obligar a registrarse para preguntar cuántos metros tiene una casa espanta
 * al comprador antes de que entre al embudo.
 */
export class MensajeBot extends Model<
  InferAttributes<MensajeBot>,
  InferCreationAttributes<MensajeBot>
> {
  declare id: CreationOptional<string>;
  declare propiedadId: ForeignKey<Propiedad['id']>;
  declare usuarioId: CreationOptional<string | null>;

  /** Agrupa la conversación de un visitante anónimo. Lo genera el navegador y
   * no identifica a nadie: sirve para leer el hilo completo, no a la persona. */
  declare sesion: string;

  declare pregunta: string | null;
  declare respuesta: string;

  /** Temas del catálogo que se reconocieron. Vacío cuando no entendió. */
  declare temas: CreationOptional<string[]>;
  /** Zonas reservadas que tocó la pregunta. Lo que el bot se negó a afirmar. */
  declare zonas: CreationOptional<string[]>;

  declare destino: CreationOptional<Destino | null>;
  declare entendido: CreationOptional<boolean>;

  declare atendidoEn: CreationOptional<Date | null>;
  declare atendidoPorId: CreationOptional<string | null>;
  declare notaInterna: CreationOptional<string | null>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

MensajeBot.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propiedadId: { type: DataTypes.UUID, allowNull: false },
    usuarioId: { type: DataTypes.UUID, allowNull: true },

    sesion: { type: DataTypes.STRING(64), allowNull: false },

    pregunta: { type: DataTypes.TEXT, allowNull: true },
    respuesta: { type: DataTypes.TEXT, allowNull: false },

    temas: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    zonas: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },

    destino: { type: DataTypes.ENUM(...DESTINOS), allowNull: true },
    entendido: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

    atendidoEn: { type: DataTypes.DATE, allowNull: true },
    atendidoPorId: { type: DataTypes.UUID, allowNull: true },
    notaInterna: { type: DataTypes.TEXT, allowNull: true },

    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'MensajeBot',
    tableName: 'mensajes_bot',
    indexes: [
      { fields: ['propiedad_id'] },
      { fields: ['usuario_id'] },
      { fields: ['sesion'] },
      // La cola de pendientes se lee por estas dos juntas.
      { fields: ['destino', 'atendido_en'] },
    ],
  },
);

Propiedad.hasMany(MensajeBot, { foreignKey: 'propiedadId', as: 'mensajesBot' });
MensajeBot.belongsTo(Propiedad, { foreignKey: 'propiedadId', as: 'propiedad' });
MensajeBot.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
MensajeBot.belongsTo(Usuario, { foreignKey: 'atendidoPorId', as: 'atendidoPor' });
