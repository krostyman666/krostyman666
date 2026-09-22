/**
 * Qué archivos se aceptan en el expediente y cómo se verifican.
 *
 * La regla que importa: el tipo NO se cree por lo que dice el cliente. El
 * `Content-Type` de la petición y la extensión del nombre los controla quien
 * sube, así que un ejecutable renombrado a `.pdf` pasaría cualquier chequeo que
 * confíe en ellos. Por eso se mira el contenido —los primeros bytes, la firma
 * del formato— y recién ahí se decide. Un expediente que acepta lo que le digan
 * es una vía de subida de malware con la cara de un certificado.
 */

export interface TipoArchivo {
  mime: string;
  etiqueta: string;
  /** Firma en los primeros bytes. El archivo tiene que empezar con esto. */
  firma: number[];
}

export const TIPOS_ACEPTADOS: TipoArchivo[] = [
  // %PDF
  { mime: 'application/pdf', etiqueta: 'PDF', firma: [0x25, 0x50, 0x44, 0x46] },
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', etiqueta: 'JPG', firma: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  {
    mime: 'image/png',
    etiqueta: 'PNG',
    firma: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
];

/** Los papeles legales pesan poco; un PDF escaneado bien comprimido rara vez
 * pasa de unos pocos MB. 15 MB deja margen sin abrir la puerta a subidas que
 * llenen el disco. */
export const LIMITE_BYTES = 15 * 1024 * 1024;

export const MIMES_ACEPTADOS = TIPOS_ACEPTADOS.map((t) => t.mime);
export const ETIQUETAS_ACEPTADAS = TIPOS_ACEPTADOS.map((t) => t.etiqueta).join(', ');

function empiezaCon(buffer: Buffer, firma: number[]): boolean {
  if (buffer.length < firma.length) return false;
  return firma.every((byte, i) => buffer[i] === byte);
}

/**
 * Devuelve el tipo real del archivo según su contenido, o null si no es ninguno
 * de los aceptados. Sirve además para detectar la incoherencia entre lo que el
 * cliente declara y lo que el archivo es.
 */
export function tipoRealDe(buffer: Buffer): TipoArchivo | null {
  return TIPOS_ACEPTADOS.find((t) => empiezaCon(buffer, t.firma)) ?? null;
}
