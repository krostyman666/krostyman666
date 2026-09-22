import Joi from 'joi';

/**
 * La `sesion` la genera el navegador para agrupar el hilo de un visitante
 * anónimo. No identifica a nadie, así que sólo se valida el formato para que no
 * sea un vector de basura: un identificador corto y acotado.
 */
export const preguntarBotSchema = Joi.object({
  pregunta: Joi.string().trim().min(2).max(500).required().messages({
    'string.min': 'Escribe tu pregunta',
    'string.empty': 'Escribe tu pregunta',
  }),
  sesion: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9_-]{8,64}$/)
    .required()
    .messages({ 'string.pattern.base': 'Sesión inválida' }),
});

export const atenderMensajeSchema = Joi.object({
  nota: Joi.string().trim().min(3).max(2000).required().messages({
    'string.min': 'Deja una nota de cómo se atendió',
    'string.empty': 'Deja una nota de cómo se atendió',
  }),
});
