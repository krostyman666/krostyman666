import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import { ChatSession, Message } from '../models';
import { chatService } from '../services/ChatService';

const router = Router();

// Credenciales Twilio (cargar de .env)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+1 415 523 8886';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '';

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * POST /api/v1/whatsapp/webhook
 * Recibir mensajes de WhatsApp desde Twilio
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { From, Body } = req.body;
    const customerPhone = From.replace('whatsapp:', '');

    console.log(`📱 WhatsApp message from ${customerPhone}: ${Body}`);

    // Crear o actualizar sesión de chat
    let session = await ChatSession.findOne({
      where: { whatsappPhone: customerPhone },
    });

    if (!session) {
      session = await ChatSession.create({
        whatsappPhone: customerPhone,
        email: `whatsapp-${customerPhone}@ivi.local`,
        telefono: customerPhone,
        leadStatus: 'warm',
      } as any);
      await session.update({ channel: 'whatsapp' });
    }

    // Guardar mensaje del usuario
    await Message.create({
      sessionId: session.id,
      sender: 'user',
      content: Body,
    });

    // Generar respuesta automática del bot
    const botResponse = await generateBotResponse(Body, session.id);

    // Enviar respuesta de vuelta a WhatsApp
    await twilioClient.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: From,
      body: botResponse,
    });

    // Guardar respuesta del bot
    await Message.create({
      sessionId: session.id,
      sender: 'bot',
      content: botResponse,
    });

    // Notificar al admin si es pregunta sin respuesta automática
    if (
      botResponse.includes('no tengo una respuesta específica') &&
      ADMIN_PHONE
    ) {
      await sendAdminNotification(customerPhone, Body, session.id);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error en webhook WhatsApp:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/v1/whatsapp/reply
 * Responder manualmente un mensaje desde el dashboard
 */
router.post('/reply', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      res.status(400).json({
        error: 'sessionId y message son requeridos',
      });
      return;
    }

    const session = await ChatSession.findByPk(sessionId);

    if (!session || !session.whatsappPhone) {
      res.status(404).json({ error: 'Sesión no encontrada' });
      return;
    }

    // Enviar respuesta a WhatsApp
    await twilioClient.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${session.whatsappPhone}`,
      body: message,
    });

    // Guardar en BD
    await Message.create({
      sessionId: session.id,
      sender: 'admin',
      content: message,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error enviando respuesta:', error);
    res.status(500).json({ error: 'Error al enviar' });
  }
});

/**
 * GET /api/v1/whatsapp/sessions/pending
 * Obtener sesiones con preguntas sin respuesta
 */
router.get('/sessions/pending', async (_req: Request, res: Response) => {
  try {
    const sessions = await ChatSession.findAll({
      where: { channel: 'whatsapp' },
      include: [
        {
          model: Message,
          limit: 1,
          order: [['timestamp', 'DESC']],
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    res.json(sessions);
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    res.status(500).json({ error: 'Error fetching sessions' });
  }
});

/**
 * GET /api/v1/whatsapp/messages/:sessionId
 * Obtener historial de mensajes de una sesión
 */
router.get('/messages/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const messages = await Message.findAll({
      where: { sessionId },
      order: [['timestamp', 'ASC']],
    });

    res.json(messages);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

/**
 * GET /api/v1/whatsapp/sessions/:sessionId
 * Obtener detalles de una sesión
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findByPk(sessionId, {
      include: [Message],
    });

    if (!session) {
      res.status(404).json({ error: 'Sesión no encontrada' });
      return;
    }

    res.json(session);
  } catch (error) {
    console.error('❌ Error fetching session:', error);
    res.status(500).json({ error: 'Error fetching session' });
  }
});

/**
 * Función auxiliar: Generar respuesta del bot
 */
async function generateBotResponse(userMessage: string, sessionId: string): Promise<string> {
  try {
    // Intenta usar el chatService existente
    const resultado = await chatService.procesarMensaje(
      sessionId,
      `whatsapp-${sessionId}@ivi.local`,
      userMessage,
      {}
    );

    if (resultado && resultado.respuesta) {
      return resultado.respuesta;
    }
  } catch (error) {
    console.error('Error usando chatService:', error);
  }

  // Fallback a respuesta básica si chatService no funciona
  return `Buena pregunta. 😊

Lamentablemente no tengo una respuesta específica para eso en mi base de datos.

¿Podrías escribir un poco más? O si prefieres, te conectamos con nuestro equipo médico especializado. Responden dentro de 1 hora.

¿Te gustaría que alguien se comunique contigo?`;
}

/**
 * Función auxiliar: Notificar al admin
 */
async function sendAdminNotification(
  customerPhone: string,
  message: string,
  sessionId: string
) {
  try {
    if (!ADMIN_PHONE) return;

    await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: ADMIN_PHONE,
      body: `🔴 NUEVA PREGUNTA SIN RESPUESTA AUTOMÁTICA

De: ${customerPhone}
Pregunta: "${message}"

Session ID: ${sessionId}
Responde en: /api/v1/whatsapp/sessions/${sessionId}`,
    });

    console.log(`✉️ Admin notificado sobre pregunta sin respuesta`);
  } catch (error) {
    console.error('Error notificando admin:', error);
  }
}

export default router;
