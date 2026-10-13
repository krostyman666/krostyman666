import { Router } from 'express';
import * as controlador from '../controllers/auth.controller';
import { validarCuerpo } from '../middleware/validar';
import { autenticar } from '../middleware/autenticar';
import { limiteIntentos } from '../middleware/limiteIntentos';
import { ingresoSchema, registroSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/registro', limiteIntentos, validarCuerpo(registroSchema), controlador.registrar);
router.post('/ingreso', limiteIntentos, validarCuerpo(ingresoSchema), controlador.ingresar);
router.get('/perfil', autenticar, controlador.perfil);

export default router;
