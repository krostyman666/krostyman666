import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Usuario, hashearPassword, type Rol } from '../models/Usuario';
import { firmarToken } from '../utils/jwt';
import { ErrorApi } from '../utils/ErrorApi';
import { limpiarRut } from '../utils/rut';

// Comparacion contra un hash descartable cuando el email no existe, para que
// responder "no existe" tarde lo mismo que responder "clave incorrecta".
const HASH_SENUELO = '$2a$12$0000000000000000000000000000000000000000000000000000';

export interface DatosRegistro {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rut: string;
  telefono?: string;
  rol?: Rol;
}

export interface SesionCreada {
  token: string;
  usuario: Record<string, unknown>;
}

export async function registrar(datos: DatosRegistro): Promise<SesionCreada> {
  const email = datos.email.trim().toLowerCase();
  const rut = limpiarRut(datos.rut);

  const existente = await Usuario.findOne({
    where: { [Op.or]: [{ email }, { rut }] },
  });

  if (existente) {
    const campo = existente.email === email ? 'email' : 'RUT';
    throw ErrorApi.conflicto(`Ya existe una cuenta con ese ${campo}`, 'cuenta_duplicada');
  }

  const usuario = await Usuario.create({
    email,
    rut,
    passwordHash: await hashearPassword(datos.password),
    nombre: datos.nombre.trim(),
    apellido: datos.apellido.trim(),
    telefono: datos.telefono?.trim() ?? null,
    rol: datos.rol ?? 'comprador',
  });

  return {
    token: firmarToken({ sub: usuario.id, rol: usuario.rol }),
    usuario: usuario.toJSON(),
  };
}

export async function ingresar(email: string, password: string): Promise<SesionCreada> {
  const usuario = await Usuario.findOne({
    where: { email: email.trim().toLowerCase() },
  });

  if (!usuario) {
    await bcrypt.compare(password, HASH_SENUELO);
    throw ErrorApi.noAutorizado();
  }

  if (!(await usuario.verificarPassword(password))) {
    throw ErrorApi.noAutorizado();
  }

  return {
    token: firmarToken({ sub: usuario.id, rol: usuario.rol }),
    usuario: usuario.toJSON(),
  };
}

export async function obtenerPerfil(id: string): Promise<Usuario> {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) {
    throw ErrorApi.noEncontrado('Usuario no encontrado');
  }
  return usuario;
}
