import { Router } from 'express';
import Joi from 'joi';
import * as controlador from '../controllers/promesas.controller';
import { autenticar, exigirRol } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';

const abrirSchema = Joi.object({
  precio: Joi.number().positive().required(),
  pie: Joi.number().positive().allow(null),
  fechaEscritura: Joi.string().isoDate().allow(null, ''),
});

const proponerSchema = Joi.object({
  texto: Joi.string().trim().min(20).max(5000).required().messages({
    'string.min': 'Una cláusula de menos de 20 caracteres no dice nada',
  }),
  comentario: Joi.string().trim().max(1000).allow('', null),
});

const desistirSchema = Joi.object({
  motivo: Joi.string().trim().min(5).max(1000).required(),
});

const router = Router();

router.get('/catalogo', controlador.catalogo);
router.get('/mias', autenticar, controlador.mias);

router.post(
  '/propiedad/:propiedadId',
  autenticar,
  validarCuerpo(abrirSchema),
  controlador.abrir,
);

router.patch('/clausulas/:clausulaId/aceptar', autenticar, controlador.aceptar);
router.delete('/clausulas/:clausulaId', autenticar, controlador.quitar);

router.get('/:promesaId', autenticar, controlador.obtener);
router.put(
  '/:promesaId/clausulas/:codigo',
  autenticar,
  validarCuerpo(proponerSchema),
  controlador.proponer,
);
router.patch('/:promesaId/acordar', autenticar, controlador.acordar);
router.patch('/:promesaId/reabrir', autenticar, controlador.reabrir);
router.patch(
  '/:promesaId/desistir',
  autenticar,
  validarCuerpo(desistirSchema),
  controlador.desistir,
);
router.patch(
  '/:promesaId/revision',
  autenticar,
  exigirRol('abogado', 'admin'),
  controlador.revisar,
);

export default router;
