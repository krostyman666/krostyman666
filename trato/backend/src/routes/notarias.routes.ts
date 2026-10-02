import { Router } from 'express';
import Joi from 'joi';
import * as controlador from '../controllers/notarias.controller';
import { autenticar, exigirRol } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';
import { VALIDACIONES } from '../models/Documento';

const validarSchema = Joi.object({
  validacion: Joi.string().valid(...VALIDACIONES).required(),
  observacionNotaria: Joi.string().max(2000).allow('', null),
  // Sólo se usa al aprobar `inscripcion_dominio`: la nueva partida que reemplaza
  // a la del vendedor. El servicio exige que venga en ese caso puntual.
  nuevaInscripcion: Joi.object({
    fojas: Joi.string().max(20).required(),
    numeroInscripcion: Joi.string().max(20).required(),
    anoInscripcion: Joi.number().integer().min(1800).max(new Date().getFullYear()).required(),
  }),
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
