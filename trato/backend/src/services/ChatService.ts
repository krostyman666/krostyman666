import { ChatSession } from '../models/ChatSession';
import { ClaudeService } from './ClaudeService';
import { LeadScorerService } from './LeadScorerService';
import * as faqData from '../data/faq.json';
import type { ChatMensaje } from '../types/ivi';

export class ChatService {
  private claudeService: ClaudeService;
  private scorerService: LeadScorerService;

  constructor() {
    this.claudeService = new ClaudeService();
    this.scorerService = new LeadScorerService();
  }

  /**
   * Procesar un mensaje de chat:
   * 1. Buscar en KB local
   * 2. Si no encuentra, consultar Claude
   * 3. Guardar conversación
   * 4. Calcular lead score
   */
  async procesarMensaje(
    sessionId: string | null,
    email: string,
    mensaje: string,
    contexto?: {
      nombre?: string;
      telefono?: string;
      edad?: number;
      situacionMarital?: string;
    }
  ) {
    // 1. Obtener o crear sesión
    let session: ChatSession | null = null;

    if (sessionId) {
      session = await ChatSession.findByPk(sessionId);
    }

    if (!session) {
      session = await ChatSession.create({
        email,
        nombre: contexto?.nombre,
        telefono: contexto?.telefono,
        edad: contexto?.edad,
        situacionMarital: contexto?.situacionMarital,
        conversacion: [],
        leadScore: 0,
        leadStatus: 'cold',
      });
    }

    // 2. Agregar mensaje del usuario a conversación
    const conversacion = (session.conversacion || []) as ChatMensaje[];
    conversacion.push({
      role: 'user',
      content: mensaje,
      timestamp: new Date(),
    });

    // 3. Buscar respuesta en KB local
    let respuesta = this.buscarEnKB(mensaje);
    let tipoRespuesta = 'faq';

    // 4. Si no hay en KB, consultar Claude API
    if (!respuesta) {
      respuesta = await this.claudeService.consultarClaudeAPI(
        mensaje,
        conversacion,
        session
      );
      tipoRespuesta = 'claude';
    }

    // 5. Agregar respuesta a conversación
    conversacion.push({
      role: 'assistant',
      content: respuesta,
      timestamp: new Date(),
    });

    // 6. Calcular lead score
    const newScore = this.scorerService.calcularScore(session, conversacion);
    const newStatus = this.scorerService.determinarStatus(newScore);

    // 7. Actualizar sesión en DB
    await session.update({
      conversacion,
      leadScore: newScore,
      leadStatus: newStatus,
      ultimaInteraccion: new Date(),
      nombre: contexto?.nombre || session.nombre,
      edad: contexto?.edad || session.edad,
      situacionMarital: contexto?.situacionMarital || session.situacionMarital,
    });

    // 8. Sugerir acciones basadas en score
    const accionesSugeridas = this.generarAcciones(newScore, mensaje);

    return {
      sessionId: session.id,
      respuesta,
      tipoRespuesta,
      leadScore: newScore,
      leadStatus: newStatus,
      acciones_sugeridas: accionesSugeridas,
    };
  }

  /**
   * Buscar respuesta en Knowledge Base local
   */
  private buscarEnKB(mensaje: string): string | null {
    const mensajeLower = mensaje.toLowerCase();

    // Buscar en FAQ
    for (const item of faqData.faq) {
      for (const pregunta of item.preguntas) {
        // Simple matching: buscar palabras clave
        if (this.hacerCoincidencia(mensajeLower, pregunta.toLowerCase())) {
          return item.respuesta;
        }
      }
    }

    return null;
  }

  /**
   * Hacer matching simple de palabras clave
   */
  private hacerCoincidencia(texto: string, patron: string): boolean {
    const palabrasClave = patron.split(' ').filter((p) => p.length > 3);
    return palabrasClave.every((palabra) => texto.includes(palabra));
  }

  /**
   * Generar acciones sugeridas basadas en el contexto
   */
  private generarAcciones(
    leadScore: number,
    mensaje: string
  ): Array<{ tipo: string; texto: string; accion?: string }> {
    const acciones = [];

    // Si preguntó por presupuesto, sugerir calculadora
    if (
      mensaje.toLowerCase().includes('precio') ||
      mensaje.toLowerCase().includes('cuesta') ||
      mensaje.toLowerCase().includes('costo')
    ) {
      acciones.push({
        tipo: 'mostrar_presupuesto',
        texto: '💰 Ver presupuestos',
        accion: 'show_calculator',
      });
    }

    // Si es lead hot, sugerir agendamiento
    if (leadScore >= 70) {
      acciones.push({
        tipo: 'sugerir_agendar',
        texto: '📅 Agendar consulta',
        accion: 'go_to_reservas',
      });
    }

    // Si es lead warm, sugerir más info
    if (leadScore >= 40 && leadScore < 70) {
      acciones.push({
        tipo: 'solicitar_info',
        texto: '❓ ¿Tienes pareja?',
        campo: 'situacionMarital',
      });
    }

    // Siempre ofrecer contactar directo
    if (leadScore < 50) {
      acciones.push({
        tipo: 'contacto_directo',
        texto: '☎️ Hablar con especialista',
        accion: 'call_button',
      });
    }

    return acciones;
  }

  /**
   * Obtener sesión existente
   */
  async obtenerSesion(sessionId: string) {
    return await ChatSession.findByPk(sessionId);
  }

  /**
   * Obtener sesiones activas de un email
   */
  async obtenerSesionesPorEmail(email: string) {
    return await ChatSession.findAll({
      where: { email },
      order: [['ultimaInteraccion', 'DESC']],
      limit: 5,
    });
  }
}

export const chatService = new ChatService();
