import axios, { AxiosError } from 'axios';
import { ChatSession } from '../models';

export interface WebhookPayload {
  sessionId: string;
  phone: string;
  message: string;
  channel: 'whatsapp' | 'web';
  timestamp: Date;
  nombre?: string;
  email?: string;
  interesTratamiento?: string;
  edad?: number;
}

export class N8nService {
  private webhookUrl: string;
  private enabled: boolean;

  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || '';
    this.enabled = !!this.webhookUrl;
  }

  /**
   * Enviar evento a n8n cuando llega un mensaje
   */
  async sendMessageEvent(
    sessionId: string,
    phone: string,
    message: string,
    channel: 'whatsapp' | 'web'
  ): Promise<void> {
    if (!this.enabled) {
      console.log('⚠️ n8n webhook URL no configurado. Skipping...');
      return;
    }

    try {
      const session = await ChatSession.findByPk(sessionId);

      const payload: WebhookPayload = {
        sessionId,
        phone,
        message,
        channel,
        timestamp: new Date(),
        nombre: session?.nombre || undefined,
        email: session?.email || undefined,
        interesTratamiento: session?.interesTratamiento || undefined,
        edad: session?.edad || undefined,
      };

      await axios.post(this.webhookUrl, payload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'IVI-Chatbot/1.0',
        },
      });

      console.log(`✅ Evento enviado a n8n: ${sessionId}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.warn(
        `⚠️ Error enviando a n8n: ${axiosError.message}`,
        axiosError.response?.status
      );
      // No fallar si n8n no responde — usuario ve respuesta del bot igual
    }
  }

  /**
   * Enviar evento personalizado a n8n
   */
  async sendCustomEvent(eventType: string, data: any): Promise<void> {
    if (!this.enabled) return;

    try {
      await axios.post(
        this.webhookUrl,
        {
          eventType,
          data,
          timestamp: new Date(),
        },
        {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      console.log(`✅ Evento customizado enviado a n8n: ${eventType}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.warn(`⚠️ Error en evento customizado: ${axiosError.message}`);
    }
  }

  /**
   * Cuando un lead se convierte a reserva (alta prioridad)
   */
  async notifyLeadConverted(
    sessionId: string,
    phone: string,
    email: string,
    nombre: string
  ): Promise<void> {
    await this.sendCustomEvent('LEAD_CONVERTED', {
      sessionId,
      phone,
      email,
      nombre,
      convertedAt: new Date(),
    });
  }

  /**
   * Cuando se requiere escalar a soporte humano
   */
  async notifyEscalation(
    sessionId: string,
    phone: string,
    reason: string
  ): Promise<void> {
    await this.sendCustomEvent('ESCALATION_REQUIRED', {
      sessionId,
      phone,
      reason,
      escalatedAt: new Date(),
    });
  }

  /**
   * Validar que webhook URL está accesible
   */
  async validateWebhook(): Promise<boolean> {
    if (!this.enabled) {
      console.warn('n8n webhook no configurado');
      return false;
    }

    try {
      const response = await axios.post(
        this.webhookUrl,
        {
          eventType: 'TEST',
          message: 'Health check from IVI backend',
          timestamp: new Date(),
        },
        { timeout: 3000 }
      );

      console.log(`✅ n8n webhook accesible: ${response.status}`);
      return true;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`❌ n8n webhook no accesible: ${axiosError.message}`);
      return false;
    }
  }
}

export const n8nService = new N8nService();
