import Joi from 'joi';

/**
 * La conclusión es obligatoria y con largo mínimo: un estudio de títulos cuya
 * conclusión diga "ok" no le sirve al comprador ni cumple la pauta del Colegio
 * de Abogados, que pide detallar los defectos.
 */
export const firmarInformeSchema = Joi.object({
  conclusion: Joi.string().trim().min(40).max(5000).required().messages({
    'string.min': 'La conclusión tiene que explicar en qué estado están los títulos',
  }),
  defectos: Joi.array().items(Joi.string().trim().min(5).max(1000)).max(50).default([]),
});

export const cambiarEstadoInformeSchema = Joi.object({
  estado: Joi.string().valid('en_preparacion', 'anulado').required(),
});
