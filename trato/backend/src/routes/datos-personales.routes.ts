import { Router } from 'express';
import Joi from 'joi';
import * as controlador from '../controllers/datos-personales.controller';
import { autenticar, exigirRol } from '../middleware/autenticar';
import { validarCuerpo } from '../middleware/validar';

// El RUT no está: identifica a las partes en la escritura, así que corregirlo
// pasa por revisión y no por este formulario.
const rectificarSchema = Joi.object({
  nombre: Joi.string().trim().min(2).max(100),
  apellido: Joi.string().trim().min(2).max(100),
  telefono: Joi.string().trim().max(20).allow('', null),
  email: Joi.string().email(),
})
  .min(1)
  .messages({
    // El middleware descarta las claves desconocidas, así que quien intenta
    // cambiar el RUT llega acá con el cuerpo vacío. Sin este mensaje recibe un
    // "value must have at least 1 key" que no le dice nada.
    'object.min':
      'Sólo puedes corregir nombre, apellido, teléfono y correo. El RUT identifica a las partes en la escritura, así que su cambio pasa por revisión: escríbenos.',
  });

const router = Router();

// El registro de tratamiento es público: el titular tiene que poder leerlo
// antes de crearse una cuenta.
router.get('/registro', controlador.registro);

router.get('/exportar', autenticar, controlador.exportar);
router.patch('/', autenticar, validarCuerpo(rectificarSchema), controlador.rectificar);
router.get('/supresion', autenticar, controlador.evaluarSupresion);
router.delete('/', autenticar, controlador.suprimir);

router.get('/vencidos', autenticar, exigirRol('admin'), controlador.vencidos);

export default router;
