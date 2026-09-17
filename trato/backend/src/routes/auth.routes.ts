import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controlador from '../controllers/auth.controller';
import { validarCuerpo } from '../middleware/validar';
import { autenticar } from '../middleware/autenticar';
import { ingresoSchema, registroSchema } from '../schemas/auth.schema';

const limiteIntentos = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos. Espera unos minutos.',
    codigo: 'demasiados_intentos',
  },
});

const router = Router();

router.post('/registro', limiteIntentos, validarCuerpo(registroSchema), controlador.registrar);
router.post('/ingreso', limiteIntentos, validarCuerpo(ingresoSchema), controlador.ingresar);
router.get('/perfil', autenticar, controlador.perfil);

export default router;
