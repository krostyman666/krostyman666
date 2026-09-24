import { Router, Request, Response } from 'express';
import { chatService } from '../services/ChatService';
import { ChatSession } from '../models/ChatSession';

const router = Router();

/**
 * POST /api/v1/chat/mensaje
 * Procesar un mensaje de chat
 */
router.post('/mensaje', async (req: Request, res: Response) => {
  try {
    const { sessionId, email, mensaje, contexto } = req.body;

    // Validación básica
    if (!email || !mensaje) {
      return res.status(400).json({
        error: 'Email y mensaje son requeridos',
      });
    }

    // Procesar mensaje
    const resultado = await chatService.procesarMensaje(
      sessionId || null,
      email,
      mensaje,
      contexto
    );

    return res.json(resultado);
  } catch (error) {
    console.error('Error en POST /mensaje:', error);
    return res.status(500).json({
      error: 'Error procesando mensaje',
    });
  }
});

/**
 * GET /api/v1/chat/sesion/:sessionId
 * Obtener sesión de chat existente
 */
router.get('/sesion/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await chatService.obtenerSesion(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Sesión no encontrada',
      });
    }

    return res.json({
      id: session.id,
      email: session.email,
      nombre: session.nombre,
      edad: session.edad,
      conversacion: session.conversacion,
      leadScore: session.leadScore,
      leadStatus: session.leadStatus,
      convertidoAReserva: session.convertidoAReserva,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    console.error('Error en GET /sesion/:sessionId:', error);
    return res.status(500).json({
      error: 'Error obteniendo sesión',
    });
  }
});

/**
 * GET /api/v1/chat/cliente/:email
 * Obtener historial de sesiones de un cliente
 */
router.get('/cliente/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const sesiones = await chatService.obtenerSesionesPorEmail(email);

    return res.json({
      email,
      totalSesiones: sesiones.length,
      sesiones: sesiones.map((s) => ({
        id: s.id,
        leadScore: s.leadScore,
        leadStatus: s.leadStatus,
        convertidoAReserva: s.convertidoAReserva,
        ultimaInteraccion: s.ultimaInteraccion,
      })),
    });
  } catch (error) {
    console.error('Error en GET /cliente/:email:', error);
    return res.status(500).json({
      error: 'Error obteniendo historial',
    });
  }
});

/**
 * GET /api/v1/chat/leads/hot
 * Obtener leads "hot" (ready to convert)
 */
router.get('/leads/hot', async (req: Request, res: Response) => {
  try {
    const leadsHot = await ChatSession.findAll({
      where: {
        leadStatus: 'hot',
      },
      order: [['leadScore', 'DESC']],
      limit: 20,
    });

    return res.json({
      total: leadsHot.length,
      leads: leadsHot.map((lead) => ({
        id: lead.id,
        email: lead.email,
        nombre: lead.nombre,
        telefono: lead.telefono,
        edad: lead.edad,
        leadScore: lead.leadScore,
        interesTratamiento: lead.interesTratamiento,
        ultimaInteraccion: lead.ultimaInteraccion,
        convertidoAReserva: lead.convertidoAReserva,
      })),
    });
  } catch (error) {
    console.error('Error en GET /leads/hot:', error);
    return res.status(500).json({
      error: 'Error obteniendo leads',
    });
  }
});

/**
 * GET /api/v1/chat/stats
 * Estadísticas del chatbot
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalSesiones = await ChatSession.count();
    const leadHot = await ChatSession.count({
      where: { leadStatus: 'hot' },
    });
    const leadWarm = await ChatSession.count({
      where: { leadStatus: 'warm' },
    });
    const leadCold = await ChatSession.count({
      where: { leadStatus: 'cold' },
    });
    const convertidos = await ChatSession.count({
      where: { convertidoAReserva: true },
    });

    const tasaConversion = totalSesiones > 0 ? (convertidos / totalSesiones) * 100 : 0;

    return res.json({
      totalSesiones,
      distribucion: {
        hot: leadHot,
        warm: leadWarm,
        cold: leadCold,
      },
      convertidosAReserva: convertidos,
      tasaConversion: tasaConversion.toFixed(2) + '%',
    });
  } catch (error) {
    console.error('Error en GET /stats:', error);
    return res.status(500).json({
      error: 'Error obteniendo estadísticas',
    });
  }
});

export default router;
