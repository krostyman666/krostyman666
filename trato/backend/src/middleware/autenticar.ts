import type { RequestHandler } from 'express';
import { verificarToken } from '../utils/jwt';
import { ErrorApi } from '../utils/ErrorApi';
import type { Rol } from '../models/Usuario';

export const autenticar: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(ErrorApi.noAutorizado('Falta el token de sesión'));
    return;
  }

  try {
    req.auth = verificarToken(header.slice(7));
    next();
  } catch (error) {
    next(error);
  }
};

export function exigirRol(...roles: Rol[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth || !roles.includes(req.auth.rol)) {
      next(ErrorApi.prohibido());
      return;
    }
    next();
  };
}
