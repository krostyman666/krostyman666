/**
 * Minuta de la escritura: borrador armado con lo que el sistema ya tiene.
 *
 * Cierra el hueco que `dominio/escritura.ts` dejaba abierto a propósito: ese
 * módulo orquesta QUE la escritura se otorgue (promesa firmada, expediente
 * listo, notaría aprueba), pero no redacta nada. Este sí arma un borrador --
 * con los datos que el sistema ya tiene, no los que inventa.
 *
 * `generarMinuta` no es un contrato listo para firmar, igual que las
 * plantillas de `dominio/promesa.ts`: es lo que el abogado revisa y completa
 * antes de llevarlo a la notaría. Donde falta un dato que el sistema no
 * sistematiza (deslindes, la forma exacta del pago del saldo, declaraciones
 * específicas del banco) va un marcador entre corchetes, nunca un valor
 * inventado -- mismo criterio que "fuente por conectar" en el informe.
 *
 * El cálculo del impuesto de timbres y estampillas (DL 3.475) vive en
 * `@trato/shared` (`calcularTimbres`), no acá: es aritmética fija por ley que
 * corre igual en el backend y en el frontend, así que está en el único lugar
 * del que ambos importan.
 */

export interface ParteMinuta {
  nombre: string;
  apellido: string;
  rut: string | null;
}

export interface PropiedadMinuta {
  calle: string;
  numero: string;
  depto: string | null;
  comuna: string;
  region: string;
  rolAvaluo: string | null;
  fojas: string | null;
  numeroInscripcion: string | null;
  anoInscripcion: number | null;
}

export interface PromesaMinuta {
  precio: number;
  moneda: 'uf' | 'clp';
  pie: number | null;
}

export interface DocumentoMinuta {
  codigo: string;
  conforme: boolean;
  fechaEmision: Date | null;
}

export interface SeccionMinuta {
  titulo: string;
  texto: string;
}

export interface Minuta {
  secciones: SeccionMinuta[];
  /** Lo que falta completar o verificar antes de llevar esto a la notaría. */
  advertencias: string[];
  /** Si corresponde mostrar el cálculo de timbres y estampillas. */
  hayCredito: boolean;
}

function formatearPrecio(monto: number, moneda: 'uf' | 'clp'): string {
  const n = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(monto);
  return moneda === 'uf' ? `UF ${n}` : `$${n}`;
}

function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeZone: 'America/Santiago' }).format(fecha);
}

function nombreCompareciente(p: ParteMinuta): string {
  const rut = p.rut ?? '[RUT PENDIENTE]';
  return `${p.nombre} ${p.apellido}, cédula nacional de identidad N° ${rut}`;
}

/** Declaraciones que dependen de un certificado del expediente, con su texto si está conforme. */
const DECLARACIONES_EXPEDIENTE: {
  codigo: string;
  siConforme: (fecha: string) => string;
  siNo: string;
}[] = [
  {
    codigo: 'dominio_vigente',
    siConforme: (fecha) =>
      `Según certificado de dominio vigente de fecha ${fecha}, el inmueble se encuentra inscrito a nombre del vendedor.`,
    siNo: '[PENDIENTE: falta el certificado de dominio vigente, aprobado por la notaría, para confirmar la inscripción del vendedor.]',
  },
  {
    codigo: 'hipotecas_gravamenes',
    siConforme: (fecha) =>
      `Según certificado de hipotecas, gravámenes y prohibiciones de fecha ${fecha}, el inmueble no reconoce hipotecas, gravámenes ni prohibiciones vigentes que no se hayan declarado en la promesa.`,
    siNo: '[PENDIENTE: falta el certificado de hipotecas, gravámenes y prohibiciones, aprobado por la notaría.]',
  },
  {
    codigo: 'deuda_contribuciones',
    siConforme: (fecha) =>
      `Según certificado de deuda de contribuciones de fecha ${fecha}, las contribuciones del inmueble se encuentran al día.`,
    siNo: '[PENDIENTE: falta el certificado de deuda de contribuciones, aprobado por la notaría.]',
  },
  {
    codigo: 'no_expropiacion_municipal',
    siConforme: (fecha) =>
      `Según certificado municipal de no expropiación de fecha ${fecha}, el inmueble no está afecto a expropiación municipal.`,
    siNo: '[PENDIENTE: falta el certificado municipal de no expropiación.]',
  },
];

export function generarMinuta(datos: {
  vendedor: ParteMinuta;
  comprador: ParteMinuta;
  propiedad: PropiedadMinuta;
  promesa: PromesaMinuta;
  documentos: DocumentoMinuta[];
  hayCredito: boolean;
}): Minuta {
  const advertencias: string[] = [];
  const { vendedor, comprador, propiedad, promesa, documentos, hayCredito } = datos;

  const direccion = `${propiedad.calle} ${propiedad.numero}${propiedad.depto ? `, depto. ${propiedad.depto}` : ''}, comuna de ${propiedad.comuna}, ${propiedad.region}`;

  const secciones: SeccionMinuta[] = [];

  secciones.push({
    titulo: 'Comparecientes',
    texto: `En Santiago de Chile, a [FECHA], comparecen don/doña ${nombreCompareciente(vendedor)}, en adelante "el vendedor"; y don/doña ${nombreCompareciente(comprador)}, en adelante "el comprador"; quienes exponen que han convenido el siguiente contrato de compraventa.`,
  });

  if (!vendedor.rut || !comprador.rut) {
    advertencias.push('Falta el RUT de una de las partes: no se puede escriturar sin él.');
  }

  let antecedentes = `El vendedor es dueño del inmueble ubicado en ${direccion}`;
  if (propiedad.fojas && propiedad.numeroInscripcion && propiedad.anoInscripcion) {
    antecedentes += `, inscrito a fojas ${propiedad.fojas} número ${propiedad.numeroInscripcion} del Registro de Propiedad del Conservador de Bienes Raíces respectivo, correspondiente al año ${propiedad.anoInscripcion}.`;
  } else {
    antecedentes += '. [PENDIENTE: falta la foja, número y año de la inscripción vigente del vendedor.]';
    advertencias.push('Falta la inscripción vigente del vendedor (foja, número, año) en la ficha de la propiedad.');
  }
  if (propiedad.rolAvaluo) {
    antecedentes += ` El rol de avalúo del inmueble es ${propiedad.rolAvaluo}.`;
  }
  secciones.push({ titulo: 'Individualización del inmueble y antecedentes de dominio', texto: antecedentes });

  const pie = promesa.pie ?? 0;
  const saldo = promesa.precio - pie;
  let formaPago = `El precio de la compraventa es de ${formatearPrecio(promesa.precio, promesa.moneda)}`;
  if (pie > 0) {
    formaPago += `, de los cuales ${formatearPrecio(pie, promesa.moneda)} fueron pagados a título de pie al momento de suscribir la promesa, quedando un saldo de ${formatearPrecio(saldo, promesa.moneda)} `;
  } else {
    formaPago += ', el que será ';
  }
  formaPago += hayCredito
    ? 'pagadero con un crédito hipotecario cuya aprobación consta en el expediente de la operación, mediante instrumento que el banco acompañará al momento de la firma. [PENDIENTE: forma exacta del pago -- vale vista, mutuo hipotecario del banco -- a completar por el abogado con los antecedentes del banco.]'
    : 'pagadero al contado, en la forma que las partes acuerden al momento de la firma. [PENDIENTE: forma exacta del pago -- vale vista, transferencia -- a completar por el abogado.]';
  secciones.push({ titulo: 'Precio y forma de pago', texto: formaPago });
  advertencias.push('La forma exacta de pago del saldo no está sistematizada: complétala antes de firmar.');

  const declaraciones = DECLARACIONES_EXPEDIENTE.map((d) => {
    const doc = documentos.find((x) => x.codigo === d.codigo);
    if (doc?.conforme && doc.fechaEmision) {
      return d.siConforme(formatearFecha(doc.fechaEmision));
    }
    advertencias.push(`Falta o no está conforme el certificado "${d.codigo}" para sostener la declaración correspondiente.`);
    return d.siNo;
  });
  secciones.push({ titulo: 'Declaraciones sobre el estado del inmueble', texto: declaraciones.join(' ') });

  secciones.push({
    titulo: 'Entrega',
    texto: 'El vendedor hace entrega material y jurídica del inmueble al comprador en el mismo acto de inscribirse esta escritura en el Registro de Propiedad del Conservador de Bienes Raíces respectivo, momento en el que se transfiere el dominio.',
  });

  secciones.push({
    titulo: 'Gastos e impuestos',
    texto: 'Los gastos notariales y de inscripción de esta escritura serán de cargo del comprador, según costumbre, salvo que las partes acuerden otra cosa. [PENDIENTE: confirmar reparto de gastos si la promesa dice algo distinto.]',
  });

  if (hayCredito) {
    secciones.push({
      titulo: 'Impuesto de timbres y estampillas',
      texto: 'Esta operación incluye un crédito hipotecario, por lo que corresponde el impuesto de timbres y estampillas (Decreto Ley N° 3.475) sobre el monto del crédito, de cargo del comprador. Ver el cálculo aparte una vez que el banco informe el monto final aprobado y el plazo.',
    });
  }

  return { secciones, advertencias, hayCredito };
}
