import { Router } from 'express';
import * as controlador from '../controllers/informes.controller';
import { autenticar, exigirRol } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';
import {
  cambiarEstadoInformeSchema,
  firmarInformeSchema,
} from '../schemas/informes.schema';

const router = Router();

router.get('/catalogo', controlador.catalogo);
router.get('/mios', autenticar, controlador.mios);
router.get('/:informeId', autenticar, controlador.obtener);

router.patch(
  '/:informeId/firma',
  autenticar,
  exigirRol('abogado', 'admin'),
  validarCuerpo(firmarInformeSchema),
  controlador.firmar,
);
router.patch(
  '/:informeId/estado',
  autenticar,
  exigirRol('admin'),
  validarCuerpo(cambiarEstadoInformeSchema),
  controlador.cambiarEstado,
);

export default router;
