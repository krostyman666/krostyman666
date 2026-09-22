import { Router } from 'express';
import * as controlador from '../controllers/bot.controller';
import { autenticar, autenticarOpcional, exigirRol } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';
import { preguntarBotSchema, atenderMensajeSchema } from '../schemas/bot.schema';

const router = Router();

// Público: el comprador pregunta antes de registrarse. `autenticarOpcional`
// asocia el mensaje a su cuenta si tiene sesión, y lo deja anónimo si no.
router.get('/sugeridas', controlador.sugeridas);
router.get('/propiedad/:id', controlador.historial);
router.post(
  '/propiedad/:id',
  autenticarOpcional,
  validarCuerpo(preguntarBotSchema),
  controlador.preguntar,
);

// Interno: la cola de derivaciones y las preguntas que el bot no supo.
router.get('/pendientes', autenticar, exigirRol('asesor', 'admin'), controlador.pendientes);
router.get('/resumen', autenticar, exigirRol('asesor', 'admin'), controlador.resumen);
router.patch(
  '/mensajes/:mensajeId/atender',
  autenticar,
  exigirRol('asesor', 'admin'),
  validarCuerpo(atenderMensajeSchema),
  controlador.atender,
);

export default router;
