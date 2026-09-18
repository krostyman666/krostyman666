import { Router } from 'express';
import Joi from 'joi';
import * as controlador from '../controllers/economia.controller';
import { autenticar, exigirRol } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';

const positivo = Joi.number().positive();
const fraccion = Joi.number().min(0).max(1);

const modeloSchema = Joi.object({
  precioVentaUf: positivo,
  asesores: Joi.number().integer().min(1).max(200),
  abogados: Joi.number().integer().min(1).max(200),
  supuestos: Joi.object({
    tasaComision: fraccion,
    ufEnPesos: positivo,
    precioInformeTitulos: Joi.number().min(0),
    sueldoBrutoAsesor: positivo,
    sueldoBrutoAbogado: positivo,
    factorCostoEmpresa: Joi.number().min(1).max(3),
    visitasPorAsesorAlMes: positivo,
    estudiosPorAbogadoAlMes: positivo,
    visitasPorPublicacion: positivo,
    tasaDeCierre: fraccion.invalid(0),
    informesPorPublicacion: Joi.number().min(0),
    costoCarpetaCbr: Joi.number().min(0),
  }),
});

const router = Router();

// Es el modelo de costos del negocio: no va público.
router.post(
  '/modelo',
  autenticar,
  exigirRol('admin'),
  validarCuerpo(modeloSchema),
  controlador.modelo,
);

export default router;
