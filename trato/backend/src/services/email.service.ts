import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';

/**
 * Correo saliente genérico, sobre SMTP. Sin `SMTP_HOST` configurado, no se
 * intenta enviar -- se dice que no hay proveedor, no se simula un envío que
 * nunca llegó. Mismo principio que `sii.proveedor: 'ninguno'`.
 */

export interface ResultadoEnvio {
  enviado: boolean;
  motivo?: string;
}

let transportador: Transporter | null = null;

function obtenerTransportador(): Transporter | null {
  if (!env.email.smtpHost) return null;
  if (!transportador) {
    transportador = nodemailer.createTransport({
      host: env.email.smtpHost,
      port: env.email.smtpPort,
      secure: env.email.smtpPort === 465,
      auth: env.email.smtpUser ? { user: env.email.smtpUser, pass: env.email.smtpPassword } : undefined,
    });
  }
  return transportador;
}

export async function enviarCorreo(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<ResultadoEnvio> {
  const transporte = obtenerTransportador();
  if (!transporte) {
    return { enviado: false, motivo: 'smtp_no_configurado' };
  }

  try {
    await transporte.sendMail({
      from: env.email.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    return { enviado: true };
  } catch (error) {
    return { enviado: false, motivo: error instanceof Error ? error.message : 'error_desconocido' };
  }
}
