import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ErrorApi } from './ErrorApi';
import type { Rol } from '../models/Usuario';

export interface PayloadToken {
  sub: string;
  rol: Rol;
}

export function firmarToken(payload: PayloadToken): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpira,
    issuer: 'trato',
  } as jwt.SignOptions);
}

export function verificarToken(token: string): PayloadToken {
  try {
    return jwt.verify(token, env.jwtSecret, { issuer: 'trato' }) as PayloadToken;
  } catch {
    throw ErrorApi.noAutorizado('Sesión inválida o expirada');
  }
}
