/**
 * El cierre de la compraventa: escritura pública e inscripción.
 *
 * La compraventa de inmuebles es solemne (Código Civil, art. 1801 inciso 2°):
 * sólo vale si consta en escritura pública, y ninguna firma electrónica la
 * reemplaza -- esa línea ya está trazada en dominio/firma.ts y no se cruza acá
 * tampoco. Por eso este módulo no firma nada: dice cuándo falta la promesa
 * firmada o algún certificado del expediente, y deja que lo que ya ocurrió
 * fuera de la plataforma -- la firma ante notario, la inscripción en el
 * Conservador -- se registre cuando alguien sube y la notaría aprueba esos dos
 * documentos del catálogo (`escritura_compraventa`, `inscripcion_dominio`).
 *
 * DOS ACTOS, NO UNO. La escritura traslada el acuerdo a instrumento público;
 * el dominio recién se transfiere con la inscripción (Código Civil, arts.
 * 686-687: la inscripción es la tradición de los inmuebles). Entre medio
 * puede pasar tiempo -- el Conservador tiene hasta 20 días hábiles, más si
 * observa algo -- así que son dos eventos separados con su propio momento, no
 * uno solo con dos nombres. `Promesa.estado` pasa a "cumplida" con la
 * escritura (la promesa prometía justamente eso: escriturar); `Propiedad.estado`
 * pasa a "vendida" recién con la inscripción, porque antes de eso el dominio
 * sigue siendo del vendedor aunque ya haya firmado.
 */

export function motivoParaEscriturar(params: {
  hayPromesaFirmada: boolean;
  expedienteListo: boolean;
}): string | null {
  if (!params.hayPromesaFirmada) {
    return 'No hay una promesa firmada por ambas partes para esta propiedad: no se puede escriturar sin ella.';
  }
  if (!params.expedienteListo) {
    return 'El expediente todavía no está listo para escriturar: faltan certificados por aprobar.';
  }
  return null;
}

export function motivoParaInscribir(escrituraConforme: boolean): string | null {
  if (!escrituraConforme) {
    return 'No se puede inscribir sin que la escritura de compraventa ya esté aprobada.';
  }
  return null;
}
