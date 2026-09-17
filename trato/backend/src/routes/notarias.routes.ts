import { Router } from 'express';
import Joi from 'joi';
import * as controlador from '../controllers/notarias.controller';
import { autenticar, exigirRol } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';
import { VALIDACIONES } from '../models/Documento';

const validarSchema = Joi.object({
  validacion: Joi.string().valid(...VALIDACIONES).required(),
  observacionNotaria: Joi.string().max(2000).allow('', null),
});

const router = Router();

router.get('/', controlador.listarSocios);

router.get('/bandeja', autenticar, exigirRol('notaria'), controlador.bandeja);
router.patch(
  '/documentos/:documentoId/validacion',
  autenticar,
  exigirRol('notaria'),
  validarCuerpo(validarSchema),
  controlador.validarDocumento,
);

export default router;
