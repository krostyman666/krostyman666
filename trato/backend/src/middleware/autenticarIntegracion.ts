import type { RequestHandler } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';
import { ErrorApi } from '../utils/ErrorApi';

/**
 * Autentica flujos externos (n8n) contra una llave fija, no un JWT de usuario.
 * Quien llama es un sistema, no una persona de la operación, así que no hay rol
 * de `Usuario` que le calce. Comparación a tiempo constante: igual razón que el
 * login no revela por timing qué correos existen.
 */
export const autenticarIntegracion: RequestHandler = (req, _res, next) => {
  const llave = req.headers['x-integracion-key'];

  if (!env.integracion.apiKey) {
    next(ErrorApi.prohibido('La integración no está configurada'));
    return;
  }

  if (typeof llave !== 'string' || !calzaConstante(llave, env.integracion.apiKey)) {
    next(ErrorApi.noAutorizado('Llave de integración inválida'));
    return;
  }

  next();
};

function calzaConstante(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
