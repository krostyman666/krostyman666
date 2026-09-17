import { Router } from 'express';
import Joi from 'joi';
import * as controlador from '../controllers/propiedades.controller';
import * as notarias from '../controllers/notarias.controller';
import { autenticar } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';
import {
  actualizarDocumentoSchema,
  actualizarPropiedadSchema,
  cambiarEstadoSchema,
  crearPropiedadSchema,
} from '../schemas/propiedades.schema';

const asignarNotariaSchema = Joi.object({
  notariaId: Joi.string().uuid().required(),
});

const router = Router();

router.get('/catalogo-documentos', controlador.catalogo);
router.get('/', controlador.buscar);
router.get('/mias', autenticar, controlador.mias);
router.post('/', autenticar, validarCuerpo(crearPropiedadSchema), controlador.crear);

router.get('/:id', controlador.obtener);
router.patch('/:id', autenticar, validarCuerpo(actualizarPropiedadSchema), controlador.actualizar);
router.patch(
  '/:id/estado',
  autenticar,
  validarCuerpo(cambiarEstadoSchema),
  controlador.cambiarEstado,
);

router.get('/:id/informe', controlador.informe);
router.get('/:id/listo-para-escriturar', notarias.listoParaEscriturar);
router.patch(
  '/:id/notaria',
  autenticar,
  validarCuerpo(asignarNotariaSchema),
  notarias.asignarNotaria,
);
router.patch(
  '/documentos/:documentoId',
  autenticar,
  validarCuerpo(actualizarDocumentoSchema),
  controlador.actualizarDocumento,
);

export default router;
