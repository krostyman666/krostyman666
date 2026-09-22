import crypto from 'crypto';
import type { ClausulaPromesa } from '../models/ClausulaPromesa';
import type { Usuario } from '../models/Usuario';
import { CLAUSULA_POR_CODIGO } from './promesa';
import { formatearRut } from '../utils/rut';

/**
 * La firma de la promesa.
 *
 * QUÉ SE PUEDE FIRMAR ELECTRÓNICAMENTE Y QUÉ NO. La promesa es un contrato
 * entre las partes, no una escritura pública, así que la ley chilena admite
 * firmarla electrónicamente (Ley 19.799). La compraventa definitiva NO: va por
 * escritura pública ante notario y no hay firma electrónica que la reemplace.
 * Esa línea no se cruza desde acá.
 *
 * SIMPLE VS AVANZADA. La Ley 19.799 distingue la firma electrónica simple de la
 * avanzada (FEA). Ambas son válidas; la avanzada, emitida por un prestador
 * acreditado, se presume del firmante y tiene el peso de una firma manuscrita.
 * Sin un proveedor de FEA contratado, la plataforma firma con firma electrónica
 * simple, que vale para una promesa pero tiene menor valor probatorio: si se
 * discute la autoría, hay que probarla. DocuSign por sí solo tampoco entrega FEA
 * reconocida en Chile; para eso hay que sumar un prestador local. El proveedor
 * entra por `env.firma.proveedor` sin rehacer este flujo.
 *
 * QUÉ HACE FUERTE A LA FIRMA SIMPLE. Lo que sostiene el valor probatorio de una
 * firma simple es la evidencia alrededor: quién firmó, cuándo, desde qué IP, y
 * —sobre todo— QUÉ firmó exactamente. Por eso cada firma guarda el texto íntegro
 * del contrato y su hash SHA-256. Si una cláusula cambiara después, el hash no
 * calzaría y la manipulación quedaría a la vista. Como la promesa se bloquea al
 * firmarse, ese hash es también lo que impide firmar dos documentos distintos:
 * la segunda parte tiene que firmar el mismo hash que la primera.
 */

export const PROVEEDORES_FIRMA = ['simple', 'docusign'] as const;
export type ProveedorFirma = (typeof PROVEEDORES_FIRMA)[number];

export const ROLES_FIRMA = ['comprador', 'vendedor'] as const;
export type RolFirma = (typeof ROLES_FIRMA)[number];

/** Ordinales para numerar las cláusulas del contrato, como en una escritura. */
const ORDINALES = [
  'PRIMERO',
  'SEGUNDO',
  'TERCERO',
  'CUARTO',
  'QUINTO',
  'SEXTO',
  'SÉPTIMO',
  'OCTAVO',
  'NOVENO',
  'DÉCIMO',
  'UNDÉCIMO',
  'DUODÉCIMO',
  'DECIMOTERCERO',
  'DECIMOCUARTO',
];

function nombreCompleto(u: Usuario): string {
  return `${u.nombre} ${u.apellido}`.trim();
}

const FECHA_LARGA = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Arma el texto íntegro de la promesa: encabezado con las partes, cláusulas
 * numeradas en su orden, y el cierre. Es lo que se firma y lo que se hashea, así
 * que tiene que ser determinista: de los mismos datos, el mismo texto y el mismo
 * hash, byte por byte.
 */
export function renderizarPromesa(
  clausulas: ClausulaPromesa[],
  comprador: Usuario,
  vendedor: Usuario,
): string {
  const ordenadas = [...clausulas].sort((a, b) => a.orden - b.orden);

  const cuerpo = ordenadas.map((c, i) => {
    const titulo = CLAUSULA_POR_CODIGO.get(c.codigo)?.titulo ?? c.codigo;
    const ordinal = ORDINALES[i] ?? `CLÁUSULA ${i + 1}`;
    return `${ordinal}: ${titulo}.\n${c.texto.trim()}`;
  });

  // El RUT va con puntos y guión: es un contrato, no un campo de base de datos.
  const rutV = vendedor.rut ? formatearRut(vendedor.rut) : '(RUT pendiente)';
  const rutC = comprador.rut ? formatearRut(comprador.rut) : '(RUT pendiente)';

  return [
    'PROMESA DE COMPRAVENTA',
    '',
    `En Santiago de Chile, a ${FECHA_LARGA.format(new Date())}, comparecen:`,
    '',
    `Por una parte, ${nombreCompleto(vendedor)}, cédula nacional de identidad ${rutV}, ` +
      'en adelante "el promitente vendedor";',
    '',
    `y por la otra, ${nombreCompleto(comprador)}, cédula nacional de identidad ${rutC}, ` +
      'en adelante "el promitente comprador";',
    '',
    'quienes han convenido en la siguiente promesa de compraventa:',
    '',
    cuerpo.join('\n\n'),
    '',
    'Las partes firman electrónicamente la presente promesa, dejando constancia ' +
      'de la fecha y hora de cada firma.',
  ].join('\n');
}

/** SHA-256 en hexadecimal del texto exacto. Es la huella del documento firmado. */
export function hashDe(texto: string): string {
  return crypto.createHash('sha256').update(texto, 'utf8').digest('hex');
}
