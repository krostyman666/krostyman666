import { IncidenteSeguridad } from '../models/IncidenteSeguridad';
import { Usuario } from '../models/Usuario';
import {
  motivoParaNoCerrar,
  plazoAgenciaVencido,
  requiereNotificarTitulares,
  venceEl,
} from '../dominio/brechas';
import { ErrorApi } from '../utils/ErrorApi';

export interface NuevoIncidente {
  titulo: string;
  descripcion: string;
  categoriasAfectadas: string[];
  cantidadAfectadaEstimada?: number | null;
  detectadoEn?: string | Date;
}

function conEstado(incidente: IncidenteSeguridad) {
  const json = incidente.toJSON() as ReturnType<IncidenteSeguridad['toJSON']> & {
    declaradoPor?: { nombre: string; apellido: string };
  };
  return {
    ...json,
    venceAgenciaEn: venceEl(incidente.detectadoEn),
    plazoAgenciaVencido: plazoAgenciaVencido(incidente.detectadoEn, incidente.notificadaAgenciaEn),
    requiereNotificarTitulares: requiereNotificarTitulares(incidente.categoriasAfectadas),
    motivoParaNoCerrar: motivoParaNoCerrar({
      categoriasAfectadas: incidente.categoriasAfectadas,
      notificadaAgenciaEn: incidente.notificadaAgenciaEn,
      notificadaTitularesEn: incidente.notificadaTitularesEn,
    }),
  };
}

export async function declarar(declaradoPorId: string, datos: NuevoIncidente) {
  const incidente = await IncidenteSeguridad.create({
    declaradoPorId,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    categoriasAfectadas: datos.categoriasAfectadas,
    cantidadAfectadaEstimada: datos.cantidadAfectadaEstimada ?? null,
    detectadoEn: datos.detectadoEn ? new Date(datos.detectadoEn) : new Date(),
  });
  return conEstado(incidente);
}

export async function listar() {
  const incidentes = await IncidenteSeguridad.findAll({
    include: [{ model: Usuario, as: 'declaradoPor', attributes: ['id', 'nombre', 'apellido'] }],
    order: [['detectadoEn', 'DESC']],
  });
  return incidentes.map(conEstado);
}

async function cargar(id: string): Promise<IncidenteSeguridad> {
  const incidente = await IncidenteSeguridad.findByPk(id);
  if (!incidente) throw ErrorApi.noEncontrado('Incidente no encontrado');
  return incidente;
}

export async function notificarAgencia(id: string) {
  const incidente = await cargar(id);
  if (incidente.notificadaAgenciaEn) {
    throw ErrorApi.conflicto('Ya se registró la notificación a la Agencia.', 'ya_notificado');
  }
  await incidente.update({ notificadaAgenciaEn: new Date() });
  return conEstado(incidente);
}

export async function notificarTitulares(id: string) {
  const incidente = await cargar(id);
  if (incidente.notificadaTitularesEn) {
    throw ErrorApi.conflicto('Ya se registró la notificación a los titulares.', 'ya_notificado');
  }
  await incidente.update({ notificadaTitularesEn: new Date() });
  return conEstado(incidente);
}

export async function cerrar(id: string, medidasAdoptadas: string) {
  const incidente = await cargar(id);
  if (incidente.cerradoEn) {
    throw ErrorApi.conflicto('El incidente ya está cerrado.', 'ya_cerrado');
  }
  const motivo = motivoParaNoCerrar({
    categoriasAfectadas: incidente.categoriasAfectadas,
    notificadaAgenciaEn: incidente.notificadaAgenciaEn,
    notificadaTitularesEn: incidente.notificadaTitularesEn,
  });
  if (motivo) throw ErrorApi.conflicto(motivo, 'notificaciones_pendientes');

  await incidente.update({ medidasAdoptadas, cerradoEn: new Date() });
  return conEstado(incidente);
}
