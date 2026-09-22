import { ChatSession } from '../models/ChatSession';
import type { ChatMensaje, LeadStatus } from '../types/ivi';

export class LeadScorerService {
  /**
   * Calcular lead score de 0 a 100
   * Basado en:
   * - Datos completados (+25)
   * - Intención clara (+50)
   * - Engagement (+25)
   */
  calcularScore(session: ChatSession, conversacion: ChatMensaje[]): number {
    let score = 0;

    // 1. Datos completados (+25 puntos)
    if (session.email) score += 5;
    if (session.nombre) score += 5;
    if (session.edad) score += 5;
    if (session.telefono) score += 5;
    if (session.situacionMarital) score += 5;

    // 2. Intención clara (+50 puntos)
    const palabrasIntencionales = [
      'congelacion',
      'embarazo',
      'tratamiento',
      'agendar',
      'cita',
      'consulta',
      'fiv',
      'inseminacion',
      'fertilidad',
      'especialista',
    ];

    const textoConversacion = conversacion
      .map((msg) => msg.content.toLowerCase())
      .join(' ');

    const coincidencias = palabrasIntencionales.filter((palabra) =>
      textoConversacion.includes(palabra)
    ).length;

    if (coincidencias >= 3) {
      score += 50; // Alta intención
    } else if (coincidencias >= 1) {
      score += 25; // Intención media
    }

    // 3. Engagement (+25 puntos)
    const numMensajesUsuario = conversacion.filter(
      (msg) => msg.role === 'user'
    ).length;

    if (numMensajesUsuario >= 5) {
      score += 25; // Alta participación
    } else if (numMensajesUsuario >= 3) {
      score += 15; // Participación media
    } else if (numMensajesUsuario >= 1) {
      score += 5; // Participación baja
    }

    // Bonificación: si preguntó por presupuestos o fechas
    if (textoConversacion.includes('precio') || textoConversacion.includes('cuando')) {
      score += 10;
    }

    // Bonificación: mencionó datos personales
    if (session.rut) {
      score += 5;
    }

    // Limitar a máximo 100
    return Math.min(score, 100);
  }

  /**
   * Determinar status del lead basado en score
   */
  determinarStatus(score: number): LeadStatus {
    if (score >= 70) {
      return 'hot'; // Alto interés, listo para agendar
    } else if (score >= 40) {
      return 'warm'; // Interés medio, necesita más info
    } else {
      return 'cold'; // Bajo interés, explorando
    }
  }

  /**
   * Generar análisis del lead para mostrar a equipo
   */
  analizarLead(session: ChatSession): {
    score: number;
    status: LeadStatus;
    analisis: string;
    recomendaciones: string[];
  } {
    const score = session.leadScore;
    const status = session.leadStatus;

    let analisis = '';
    const recomendaciones: string[] = [];

    // Análisis según score
    if (status === 'hot') {
      analisis = `Lead muy interesado (${score}/100). Mostró intención clara y participación activa.`;
      recomendaciones.push('Contactar inmediatamente para agendar');
      recomendaciones.push('Ofrecer consulta con especialista sugerido');
    } else if (status === 'warm') {
      analisis = `Lead con interés moderado (${score}/100). Necesita más información.`;
      recomendaciones.push('Enviar información educativa por email');
      recomendaciones.push('Follow-up en 24 horas');
      recomendaciones.push('Ofrecer consulta gratuita de 15 min');
    } else {
      analisis = `Lead en exploración (${score}/100). Aún no muestra intención clara.`;
      recomendaciones.push('Enviar contenido educativo general');
      recomendaciones.push('Mantener en nurture sequence');
      recomendaciones.push('Revisar en 7 días');
    }

    // Análisis de datos
    if (!session.edad) {
      recomendaciones.push('Preguntar edad para análisis personalizado');
    }
    if (!session.telefono) {
      recomendaciones.push('Obtener teléfono para contacto directo');
    }

    return {
      score,
      status,
      analisis,
      recomendaciones,
    };
  }
}

export const leadScorerService = new LeadScorerService();
