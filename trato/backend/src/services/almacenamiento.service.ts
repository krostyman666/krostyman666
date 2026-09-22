import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';
import { ErrorApi } from '../utils/ErrorApi';

/**
 * Guarda y sirve los archivos del expediente.
 *
 * Hay una sola implementación —disco local— y una interfaz, a propósito: en
 * producción el disco del contenedor es efímero y no se comparte entre
 * instancias, así que hay que pasar a almacenamiento de objetos (S3, cuyas
 * llaves ya están en `.env.example`). El resto del código habla con
 * `almacenamiento`, no con el disco, para que ese cambio sea un archivo y no una
 * cirugía.
 *
 * DOS COSAS QUE NO SON NEGOCIABLES:
 *
 * 1. **Los archivos nunca son públicos.** Son los papeles legales del vendedor
 *    —dominio, gravámenes, cédulas— y bajo la Ley 21.719 divulgarlos sin base de
 *    licitud es exactamente la multa que queremos evitar. No se sirven por URL
 *    estática: se leen por un endpoint que pasa por `exigirAccesoAlExpediente`.
 *
 * 2. **La clave la genera el servidor, no el cliente.** El nombre del archivo
 *    que sube el vendedor no toca la ruta de disco. Si la clave viniera del
 *    cliente, un "../../etc/algo" escribiría o leería fuera del expediente. Por
 *    eso `guardar` arma la clave y `resolverLocal` verifica que lo pedido quede
 *    dentro del directorio antes de abrirlo.
 */

export interface ArchivoGuardado {
  clave: string;
  tipo: string;
  bytes: number;
}

/** Extensión por tipo aceptado. La validación de tipo vive en el servicio de
 * documentos; acá sólo se usa para nombrar el archivo. */
const EXTENSION: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

function raizLocal(): string {
  return env.almacenamiento.dirLocal;
}

/**
 * Resuelve una clave a una ruta absoluta y confirma que cae dentro de la raíz.
 * Es la barrera contra el path traversal: sin esto, una clave con `..` saldría
 * del directorio del expediente.
 */
function resolverLocal(clave: string): string {
  const raiz = raizLocal();
  const destino = path.resolve(raiz, clave);
  const rel = path.relative(raiz, destino);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw ErrorApi.solicitudInvalida('Clave de archivo inválida', 'clave_invalida');
  }
  return destino;
}

/**
 * Guarda el archivo y devuelve la clave con que se lo vuelve a pedir. La clave
 * la arma el servidor: carpeta por propiedad, nombre por documento y timestamp,
 * para que reemplazar un documento no pise el archivo anterior hasta que se
 * borre a propósito.
 */
export async function guardar(
  propiedadId: string,
  documentoId: string,
  contenido: Buffer,
  tipo: string,
): Promise<ArchivoGuardado> {
  const ext = EXTENSION[tipo] ?? 'bin';
  const clave = `expediente/${propiedadId}/${documentoId}-${Date.now()}.${ext}`;

  if (env.almacenamiento.driver === 's3') {
    // Slot para S3: subir a `env.almacenamiento.s3Bucket` con la misma clave y
    // ContentType, sin ACL pública. La clave que se devuelve no cambia, así que
    // nada más del código se entera del proveedor.
    throw ErrorApi.solicitudInvalida(
      'El almacenamiento S3 todavía no está configurado',
      'almacenamiento_no_configurado',
    );
  }

  const destino = resolverLocal(clave);
  await fs.mkdir(path.dirname(destino), { recursive: true });
  await fs.writeFile(destino, contenido);

  return { clave, tipo, bytes: contenido.length };
}

export async function leer(clave: string): Promise<Buffer> {
  if (env.almacenamiento.driver === 's3') {
    throw ErrorApi.solicitudInvalida(
      'El almacenamiento S3 todavía no está configurado',
      'almacenamiento_no_configurado',
    );
  }

  try {
    return await fs.readFile(resolverLocal(clave));
  } catch {
    throw ErrorApi.noEncontrado('El archivo ya no está disponible');
  }
}

/** Borra el archivo anterior al reemplazarlo. Un fallo acá no puede tumbar la
 * operación: deja un huérfano, que es mejor que dejar al vendedor sin poder
 * subir el reemplazo. */
export async function eliminar(clave: string | null): Promise<void> {
  if (!clave) return;
  if (env.almacenamiento.driver === 's3') return;
  try {
    await fs.unlink(resolverLocal(clave));
  } catch {
    /* huérfano tolerado */
  }
}
