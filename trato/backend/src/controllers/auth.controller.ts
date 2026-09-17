import type { RequestHandler } from 'express';
import * as authService from '../services/auth.service';
import { ErrorApi } from '../utils/ErrorApi';

export const registrar: RequestHandler = async (req, res, next) => {
  try {
    const sesion = await authService.registrar(req.body);
    res.status(201).json(sesion);
  } catch (error) {
    next(error);
  }
};

export const ingresar: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const sesion = await authService.ingresar(email, password);
    res.json(sesion);
  } catch (error) {
    next(error);
  }
};

export const perfil: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) {
      throw ErrorApi.noAutorizado();
    }
    const usuario = await authService.obtenerPerfil(req.auth.sub);
    res.json({ usuario: usuario.toJSON() });
  } catch (error) {
    next(error);
  }
};
