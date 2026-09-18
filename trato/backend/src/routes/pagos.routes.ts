import { Router } from 'express';
import Joi from 'joi';
import * as controlador from '../controllers/pagos.controller';
import { autenticar, exigirRol } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';
import { MEDIOS_PAGO } from '../dominio/pagos';

const iniciarSchema = Joi.object({
  medio: Joi.string()
    .valid(...MEDIOS_PAGO)
    .required(),
});

const notaSchema = Joi.object({
  nota: Joi.string().trim().max(500).allow('', null),
});

const anularSchema = Joi.object({
  motivo: Joi.string().trim().min(5).max(500).required(),
});

const router = Router();

router.get('/por-conciliar', autenticar, exigirRol('admin'), controlador.porConciliar);

router.get('/informe/:informeId', autenticar, controlador.medios);
router.post(
  '/informe/:informeId',
  autenticar,
  validarCuerpo(iniciarSchema),
  controlador.iniciar,
);

router.patch(
  '/:pagoId/reportar',
  autenticar,
  validarCuerpo(notaSchema),
  controlador.reportar,
);
router.patch(
  '/:pagoId/conciliar',
  autenticar,
  exigirRol('admin'),
  validarCuerpo(notaSchema),
  controlador.conciliar,
);
router.patch(
  '/:pagoId/anular',
  autenticar,
  exigirRol('admin'),
  validarCuerpo(anularSchema),
  controlador.anular,
);

export default router;
