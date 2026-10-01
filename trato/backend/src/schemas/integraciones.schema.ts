import Joi from 'joi';

export const avaluoFiscalSchema = Joi.object({
  avaluoTotal: Joi.number().integer().min(0).required(),
  avaluoExento: Joi.number().integer().min(0).required(),
  avaluoAfecto: Joi.number().integer().min(0).required(),
  vigencia: Joi.string().trim().min(1).max(20).required(),
});

const cuotaSchema = Joi.object({
  periodo: Joi.string().trim().min(1).max(20).required(),
  monto: Joi.number().integer().min(0).required(),
  vencimiento: Joi.date().iso().allow(null),
  estado: Joi.string().valid('pagada', 'pendiente', 'atrasada').required(),
});

export const contribucionesSchema = Joi.object({
  cuotas: Joi.array().items(cuotaSchema).max(40).required(),
  totalAdeudadoClp: Joi.number().integer().min(0).required(),
  alDia: Joi.boolean().required(),
});
