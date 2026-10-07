import { RequestHandler } from 'express';
import { obtenerUf } from '../services/uf.service';

/** Público: lo usa la calculadora de ahorro de la landing, sin sesión. */
export const obtener: RequestHandler = async (_req, res) => {
  const uf = await obtenerUf();
  res.json(uf);
};
