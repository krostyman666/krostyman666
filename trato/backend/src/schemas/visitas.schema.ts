import Joi from 'joi';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export const solicitarVisitaSchema = Joi.object({
  inicio: Joi.string().isoDate().required(),
  mensaje: Joi.string().trim().max(1000).allow('', null),
});

export const disponibilidadSchema = Joi.object({
  bloques: Joi.array()
    .items(
      Joi.object({
        diaSemana: Joi.number().integer().min(0).max(6).required(),
        horaInicio: Joi.string().pattern(HORA).required(),
        horaFin: Joi.string().pattern(HORA).required(),
      }),
    )
    .max(21)
    .required()
    .messages({ 'string.pattern.base': 'Las horas van como 09:00' }),
});

export const asignarAsesorSchema = Joi.object({
  asesorId: Joi.string().uuid().required(),
});

export const cancelarVisitaSchema = Joi.object({
  motivo: Joi.string().trim().max(500).allow('', null),
});

export const resultadoVisitaSchema = Joi.object({
  estado: Joi.string().valid('realizada', 'no_asistio').required(),
  motivo: Joi.string().trim().max(500).allow('', null),
});
