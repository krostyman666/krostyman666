export class ErrorApi extends Error {
  readonly status: number;
  readonly codigo: string;

  constructor(status: number, mensaje: string, codigo = 'error') {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    Error.captureStackTrace(this, this.constructor);
  }

  static solicitudInvalida(mensaje: string, codigo = 'solicitud_invalida'): ErrorApi {
    return new ErrorApi(400, mensaje, codigo);
  }

  static noAutorizado(mensaje = 'Credenciales inválidas'): ErrorApi {
    return new ErrorApi(401, mensaje, 'no_autorizado');
  }

  static prohibido(mensaje = 'No tienes permiso para esta acción'): ErrorApi {
    return new ErrorApi(403, mensaje, 'prohibido');
  }

  static noEncontrado(mensaje = 'Recurso no encontrado'): ErrorApi {
    return new ErrorApi(404, mensaje, 'no_encontrado');
  }

  static conflicto(mensaje: string, codigo = 'conflicto'): ErrorApi {
    return new ErrorApi(409, mensaje, codigo);
  }
}
