import Anthropic from '@anthropic-ai/sdk';
import { ChatSession } from '../models/ChatSession';
import type { ChatMensaje } from '../types/ivi';

export class ClaudeService {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY no configurada en .env');
    }
    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * Consultar Claude API para respuestas complejas
   */
  async consultarClaudeAPI(
    mensaje: string,
    historialChat: ChatMensaje[],
    session: ChatSession
  ): Promise<string> {
    try {
      // Construir contexto del paciente
      const contexto = this.construirContexto(session);

      // Preparar mensajes en formato Anthropic
      const messages = historialChat.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: `Eres IVI Assistant, un chatbot amable y profesional para IVI Chile, una clínica de fertilidad.

${contexto}

Tu objetivo es:
1. Responder preguntas sobre tratamientos de fertilidad de forma clara y comprensible
2. Ser empático con pacientes que pueden estar en situaciones sensibles
3. Sugerir consultas con especialistas cuando sea apropiado
4. Proporcionar información de precios cuando se pregunta
5. Nunca hacer promesas sobre resultados garantizados

Importante:
- Si el usuario tiene datos demográficos (edad, situación marital), úsalos para personalizar respuestas
- Menciona que los porcentajes de éxito varían según edad y situación
- Sé honesto sobre limitaciones y siempre sugiere consulta presencial
- Responde en español de forma natural y amigable`,
        messages,
      });

      // Extraer respuesta de texto
      const respuestaBlock = response.content.find(
        (block) => block.type === 'text'
      );
      if (!respuestaBlock || respuestaBlock.type !== 'text') {
        throw new Error('No se recibió respuesta de texto de Claude');
      }

      return respuestaBlock.text;
    } catch (error) {
      console.error('Error en Claude API:', error);
      throw error;
    }
  }

  /**
   * Construir contexto con datos del paciente
   */
  private construirContexto(session: ChatSession): string {
    let contexto = '';

    if (session.edad) {
      contexto += `\nEdad del paciente: ${session.edad} años`;
    }
    if (session.situacionMarital) {
      contexto += `\nSituación marital: ${session.situacionMarital}`;
    }
    if (session.interesTratamiento) {
      contexto += `\nTratamiento de interés: ${session.interesTratamiento}`;
    }

    return contexto || 'Sin datos demográficos específicos del paciente aún.';
  }

  /**
   * Streaming de respuestas (para implementación futura)
   */
  async consultarClaudeAPIStream(
    mensaje: string,
    historialChat: ChatMensaje[],
    session: ChatSession,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const contexto = this.construirContexto(session);
      const messages = historialChat.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      const stream = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: `Eres IVI Assistant, un chatbot amable y profesional para IVI Chile.
${contexto}`,
        messages,
        stream: true,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          onChunk(event.delta.text);
        }
      }
    } catch (error) {
      console.error('Error en Claude API Stream:', error);
      throw error;
    }
  }
}

export const claudeService = new ClaudeService();
