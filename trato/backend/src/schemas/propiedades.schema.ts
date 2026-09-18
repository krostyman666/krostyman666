import Joi from 'joi';
import { MONEDAS, REGIONES, TIPOS_PROPIEDAD, ESTADOS_PROPIEDAD } from '../models/Propiedad';
import { ESTADOS_DOCUMENTO } from '../models/Documento';

export const crearPropiedadSchema = Joi.object({
  titulo: Joi.string().trim().min(5).max(150).required(),
  descripcion: Joi.string().trim().max(5000).allow('', null),
  tipo: Joi.string().valid(...TIPOS_PROPIEDAD).required(),

  precio: Joi.number().positive().required(),
  moneda: Joi.string().valid(...MONEDAS).default('uf'),

  calle: Joi.string().trim().min(2).max(150).required(),
  numero: Joi.string().trim().max(20).required(),
  depto: Joi.string().trim().max(20).allow('', null),
  comuna: Joi.string().trim().min(2).max(80).required(),
  region: Joi.string().valid(...REGIONES).required(),
  latitud: Joi.number().min(-90).max(90).allow(null),
  longitud: Joi.number().min(-180).max(180).allow(null),

  rolAvaluo: Joi.string().trim().pattern(/^\d{1,5}-\d{1,5}$/).allow('', null).messages({
    'string.pattern.base': 'El rol de avalúo va en formato 12345-67',
  }),

  superficieTotal: Joi.number().positive().allow(null),
  superficieConstruida: Joi.number().positive().allow(null),
  dormitorios: Joi.number().integer().min(0).max(50).allow(null),
  banos: Joi.number().integer().min(0).max(50).allow(null),
  estacionamientos: Joi.number().integer().min(0).max(50).default(0),
  bodegas: Joi.number().integer().min(0).max(50).default(0),
  anoConstruccion: Joi.number().integer().min(1800).max(new Date().getFullYear() + 2).allow(null),

  tieneHipoteca: Joi.boolean().default(false),
  fotos: Joi.array().items(Joi.string().uri()).max(30).default([]),

  visitantesPorCupo: Joi.number().integer().min(1).max(10).default(1).messages({
    'number.max': 'Más de 10 personas en un cupo no es una visita, es un evento',
  }),
});

/**
 * El PATCH sólo toca lo que viene en el cuerpo.
 *
 * `fork(..., optional)` por sí solo no basta: Joi conserva los `.default()` y
 * los aplica a las claves ausentes, así que un PATCH de `{ precio }` llegaba al
 * update con `fotos: []`, `estacionamientos: 0`, `bodegas: 0`,
 * `tieneHipoteca: false`, `moneda: 'uf'` y `visitantesPorCupo: 1`. Editar el
 * precio borraba las fotos de la publicación. `noDefaults` es lo que lo corta.
 */
export const actualizarPropiedadSchema = crearPropiedadSchema
  .fork(Object.keys(crearPropiedadSchema.describe().keys), (s) => s.optional())
  .prefs({ noDefaults: true });

export const cambiarEstadoSchema = Joi.object({
  estado: Joi.string().valid(...ESTADOS_PROPIEDAD).required(),
});

export const actualizarDocumentoSchema = Joi.object({
  estado: Joi.string().valid(...ESTADOS_DOCUMENTO),
  archivoUrl: Joi.string().uri().max(500).allow(null, ''),
  fechaEmision: Joi.date().max('now').allow(null),
  observaciones: Joi.string().max(2000).allow(null, ''),
  costoClp: Joi.number().integer().min(0).allow(null),
}).min(1);
