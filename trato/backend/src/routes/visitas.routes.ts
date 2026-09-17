import { Router } from 'express';
import * as controlador from '../controllers/visitas.controller';
import { autenticar, exigirRol } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';
import {
  asignarAsesorSchema,
  cancelarVisitaSchema,
  resultadoVisitaSchema,
} from '../schemas/visitas.schema';

const router = Router();

router.get('/mias', autenticar, controlador.mias);
router.get('/agenda', autenticar, exigirRol('asesor', 'admin'), controlador.agenda);
router.get('/por-asignar', autenticar, exigirRol('asesor', 'admin'), controlador.porAsignar);

router.patch(
  '/:visitaId/asesor',
  autenticar,
  exigirRol('admin', 'asesor'),
  validarCuerpo(asignarAsesorSchema),
  controlador.asignar,
);
router.patch(
  '/:visitaId/cancelar',
  autenticar,
  validarCuerpo(cancelarVisitaSchema),
  controlador.cancelar,
);
router.patch(
  '/:visitaId/resultado',
  autenticar,
  exigirRol('asesor', 'admin'),
  validarCuerpo(resultadoVisitaSchema),
  controlador.resultado,
);

export default router;
