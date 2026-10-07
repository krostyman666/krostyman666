import { Router } from 'express';
import { autenticarIntegracion } from '../middleware/autenticarIntegracion';
import { validarCuerpo } from '../middleware/validar';
import { avaluoFiscalSchema, contribucionesSchema } from '../schemas/integraciones.schema';
import * as controlador from '../controllers/integraciones.controller';

const router = Router();

router.use(autenticarIntegracion);

router.get('/propiedades-pendientes', controlador.propiedadesPendientes);
router.patch(
  '/propiedades/:id/avaluo-fiscal',
  validarCuerpo(avaluoFiscalSchema),
  controlador.guardarAvaluoFiscal,
);
router.patch(
  '/propiedades/:id/contribuciones',
  validarCuerpo(contribucionesSchema),
  controlador.guardarContribuciones,
);
router.post('/avisos-vencimiento', controlador.avisosVencimiento);

export default router;
