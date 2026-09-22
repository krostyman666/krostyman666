import { api } from './api';

/** Tipos que el backend acepta para el expediente. Se refleja acá para filtrar
 * en el selector de archivos y avisar antes de subir algo que se va a rechazar. */
export const TIPOS_ACEPTADOS = ['application/pdf', 'image/jpeg', 'image/png'];
export const ACCEPT_ARCHIVOS = '.pdf,.jpg,.jpeg,.png';
export const LIMITE_MB = 15;

export function tipoAceptado(file: File): boolean {
  return TIPOS_ACEPTADOS.includes(file.type);
}

/**
 * Sube el archivo de un documento. Va como cuerpo crudo con el tipo en el header
 * y la fecha de emisión en el query, igual que lo espera el backend. La fecha es
 * un día (YYYY-MM-DD): el backend calcula la vigencia desde ahí.
 */
export async function subirArchivo(
  documentoId: string,
  file: File,
  fechaEmision: string,
): Promise<void> {
  await api.post(`/propiedades/documentos/${documentoId}/archivo`, file, {
    params: { fechaEmision },
    headers: { 'Content-Type': file.type },
  });
}

/**
 * Abre el archivo del documento en una pestaña nueva. Se baja como blob con el
 * token de sesión —el archivo no es público y el endpoint exige acceso al
 * expediente—, así que no sirve un enlace directo. El object URL se revoca al
 * rato para no acumular memoria.
 */
export async function abrirArchivo(documentoId: string): Promise<void> {
  const { data } = await api.get<Blob>(`/propiedades/documentos/${documentoId}/archivo`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
