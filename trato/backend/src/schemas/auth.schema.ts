import Joi from 'joi';
import { esRutValido } from '../utils/rut';

const rut = Joi.string()
  .required()
  .custom((valor: string, helpers) =>
    esRutValido(valor) ? valor : helpers.error('any.invalid'),
  )
  .messages({ 'any.invalid': 'El RUT no es válido' });

const password = Joi.string().min(8).max(128).required().messages({
  'string.min': 'La clave debe tener al menos 8 caracteres',
});

export const registroSchema = Joi.object({
  email: Joi.string().email().required(),
  password,
  nombre: Joi.string().trim().min(2).max(100).required(),
  apellido: Joi.string().trim().min(2).max(100).required(),
  rut,
  telefono: Joi.string().trim().max(20).optional().allow(''),
  rol: Joi.string().valid('vendedor', 'comprador').default('comprador'),
});

export const ingresoSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
