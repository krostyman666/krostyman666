import { Router, raw } from 'express';
import Joi from 'joi';
import * as controlador from '../controllers/propiedades.controller';
import * as notarias from '../controllers/notarias.controller';
import * as visitas from '../controllers/visitas.controller';
import * as informes from '../controllers/informes.controller';
import { autenticar, autenticarOpcional } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';
import {
  actualizarDocumentoSchema,
  actualizarPropiedadSchema,
  cambiarEstadoSchema,
  crearPropiedadSchema,
} from '../schemas/propiedades.schema';
import { disponibilidadSchema, solicitarVisitaSchema } from '../schemas/visitas.schema';

const asignarNotariaSchema = Joi.object({
  notariaId: Joi.string().uuid().required(),
});

const router = Router();

router.get('/catalogo-documentos', controlador.catalogo);
router.get('/', controlador.buscar);
router.get('/mias', autenticar, controlador.mias);
router.post('/', autenticar, validarCuerpo(crearPropiedadSchema), controlador.crear);

router.get('/:id', autenticarOpcional, controlador.obtener);
router.patch('/:id', autenticar, validarCuerpo(actualizarPropiedadSchema), controlador.actualizar);
router.patch(
  '/:id/estado',
  autenticar,
  validarCuerpo(cambiarEstadoSchema),
  controlador.cambiarEstado,
);

router.get('/:id/informe', autenticar, controlador.informe);
router.get('/:id/listo-para-escriturar', autenticar, notarias.listoParaEscriturar);

// Visitas. Los cupos son públicos (el comprador los mira antes de registrarse);
// tomar uno o cambiar la disponibilidad, no.
router.get('/:id/cupos', visitas.cupos);
router.get('/:id/disponibilidad', visitas.disponibilidad);
router.put(
  '/:id/disponibilidad',
  autenticar,
  validarCuerpo(disponibilidadSchema),
  visitas.declararDisponibilidad,
);
router.post(
  '/:id/visitas',
  autenticar,
  validarCuerpo(solicitarVisitaSchema),
  visitas.solicitar,
);
router.get('/:id/visitas', autenticar, visitas.dePropiedad);

// Informe del inmueble. El comprador pide; el vendedor autoriza qué se divulga.
router.post('/:id/informes/antecedentes', autenticar, informes.emitirAntecedentes);
router.post('/:id/informes/titulos', autenticar, informes.pedirTitulos);

router.get('/:id/consentimiento', autenticar, informes.verConsentimiento);
router.put('/:id/consentimiento', autenticar, informes.otorgarConsentimiento);
router.delete('/:id/consentimiento', autenticar, informes.revocarConsentimiento);
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

// El archivo va como cuerpo crudo. `type: () => true` deja que cualquier
// Content-Type llegue como Buffer, para que el rechazo por tipo lo dé el
// servicio con un mensaje claro en vez de un 415 mudo. El límite es apenas
// mayor que el del dominio (15 MB) para que el mensaje amable gane al 413.
router.post(
  '/documentos/:documentoId/archivo',
  autenticar,
  raw({ type: () => true, limit: '16mb' }),
  controlador.subirArchivoDocumento,
);
router.get(
  '/documentos/:documentoId/archivo',
  autenticar,
  controlador.descargarArchivoDocumento,
);

export default router;
