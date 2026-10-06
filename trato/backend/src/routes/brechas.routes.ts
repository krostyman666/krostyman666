import { Router } from 'express';
import Joi from 'joi';
import * as controlador from '../controllers/brechas.controller';
import { autenticar, exigirRol } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';
import { REGISTRO_TRATAMIENTO } from '../dominio/datos-personales';

const CODIGOS_CATEGORIA = REGISTRO_TRATAMIENTO.map((a) => a.codigo);

const declararSchema = Joi.object({
  titulo: Joi.string().trim().min(5).max(150).required(),
  descripcion: Joi.string().trim().min(10).max(5000).required(),
  categoriasAfectadas: Joi.array()
    .items(Joi.string().valid(...CODIGOS_CATEGORIA))
    .min(1)
    .required(),
  cantidadAfectadaEstimada: Joi.number().integer().min(0).allow(null),
  detectadoEn: Joi.date().iso().max('now'),
});

const cerrarSchema = Joi.object({
  medidasAdoptadas: Joi.string().trim().min(10).max(5000).required(),
});

const router = Router();

// Toda la gestión de incidentes es admin-only: declarar una vulneración de
// seguridad no es una acción que deba quedar al alcance de cualquier rol.
router.use(autenticar, exigirRol('admin'));

router.get('/', controlador.listar);
router.post('/', validarCuerpo(declararSchema), controlador.declarar);
router.patch('/:id/notificar-agencia', controlador.notificarAgencia);
router.patch('/:id/notificar-titulares', controlador.notificarTitulares);
router.patch('/:id/cerrar', validarCuerpo(cerrarSchema), controlador.cerrar);

export default router;
