/**
 * Modelo de rentabilidad por operación cerrada.
 *
 * Existe porque el negocio cobra 1% donde el corredor cobra 2 a 5, y paga
 * sueldos fijos donde el corredor paga comisión. Esa apuesta sólo funciona si
 * el costo de atender una propiedad es bajo y predecible, y la única forma de
 * saberlo es calcularlo con los números reales del equipo.
 *
 * LA TRAMPA QUE ESTE MODELO EVITA: dividir los costos entre las operaciones que
 * cierran. Una publicación que no vende igual consumió visitas y sueldo. Por eso
 * todo se calcula por VENTA CERRADA y no por publicación: con 25% de cierre,
 * cada venta paga las visitas de cuatro publicaciones.
 *
 * DE DÓNDE SALEN LOS NÚMEROS
 *
 * Los sueldos y el costo empresa están investigados y llevan fuente en
 * `SUPUESTOS_POR_DEFECTO`. Los del embudo —visitas por publicación, tasa de
 * cierre, informes vendidos— NO tienen fuente pública en Chile y son supuestos
 * puestos a mano. Están marcados en `SIN_FUENTE`. Son los que más mueven el
 * resultado, así que hay que reemplazarlos con datos propios apenas existan;
 * hasta entonces este modelo dice "si pasa esto, gano esto", no "gano esto".
 */

export interface Supuestos {
  // --- Ingresos ---
  /** Comisión de Trato sobre el precio de venta, sin IVA. */
  tasaComision: number;
  /** La UF del día. Placeholder, igual que en el frontend. */
  ufEnPesos: number;
  /** Lo que se cobra por el informe de títulos. */
  precioInformeTitulos: number;

  // --- Equipo ---
  sueldoBrutoAsesor: number;
  sueldoBrutoAbogado: number;
  /**
   * Cuánto le cuesta a la empresa un sueldo bruto de $1. Incluye cotizaciones
   * de cargo del empleador y las provisiones de gratificación y feriado.
   */
  factorCostoEmpresa: number;

  // --- Productividad ---
  visitasPorAsesorAlMes: number;
  estudiosPorAbogadoAlMes: number;

  // --- Embudo (sin fuente pública) ---
  /** Visitas que consume una publicación antes de venderse o retirarse. */
  visitasPorPublicacion: number;
  /** Fracción de publicaciones que termina en venta. */
  tasaDeCierre: number;
  /** Informes de títulos vendidos por publicación. */
  informesPorPublicacion: number;

  // --- Insumos ---
  /** Carpeta de títulos del Conservador. */
  costoCarpetaCbr: number;
}

/** Los supuestos que no tienen fuente pública y hay que reemplazar con datos propios. */
export const SIN_FUENTE = [
  'visitasPorPublicacion',
  'tasaDeCierre',
  'informesPorPublicacion',
  'visitasPorAsesorAlMes',
  'estudiosPorAbogadoAlMes',
  'ufEnPesos',
] as const;

export const FUENTES_SUPUESTOS: Record<string, string> = {
  sueldoBrutoAsesor:
    'Mediana de asesor inmobiliario en Chile, ~$896.000 (Computrabajo/Indeed, 2026).',
  sueldoBrutoAbogado:
    'Promedio de abogado en Chile, ~$1.390.000. El rango va de $900.000 a $7.000.000 según experiencia.',
  factorCostoEmpresa:
    'Cotizaciones de cargo del empleador ~7 a 9% desde agosto 2026 (previsional 3,5% Ley 21.735, cesantía 2,4%, mutual 0,9-3,4%, SANNA 0,03%) más provisiones de gratificación y feriado. El costo empresa total queda entre 20% y 35% sobre el bruto.',
  costoCarpetaCbr: 'Carpeta de estudio de títulos 10 años, Conservador de Santiago: $13.500.',
  tasaComision: 'Definición del producto: 1% + IVA.',
  precioInformeTitulos: 'Placeholder comercial, sin decidir.',
};

/**
 * El aporte previsional del empleador sube por gradualidad hasta 8,5% en agosto
 * de 2033. Un modelo de sueldos fijos tiene que mirar esa curva: hoy son 3,5%.
 */
export const ALZA_PREVISIONAL_PENDIENTE = {
  hoy: 0.035,
  desde: 'agosto 2026',
  destino: 0.085,
  cuando: 'agosto 2033',
};

export const SUPUESTOS_POR_DEFECTO: Supuestos = {
  tasaComision: 0.01,
  ufEnPesos: 39_000,
  precioInformeTitulos: 49_000,

  sueldoBrutoAsesor: 900_000,
  sueldoBrutoAbogado: 1_390_000,
  factorCostoEmpresa: 1.25,

  visitasPorAsesorAlMes: 80,
  estudiosPorAbogadoAlMes: 30,

  visitasPorPublicacion: 8,
  tasaDeCierre: 0.25,
  informesPorPublicacion: 1.5,

  costoCarpetaCbr: 13_500,
};

export interface DesgloseOperacion {
  precioVentaClp: number;
  /** Publicaciones que hay que atender para lograr una venta. */
  publicacionesPorVenta: number;

  ingresoComision: number;
  ingresoInformes: number;
  ingresoTotal: number;

  costoPorVisita: number;
  costoPorEstudio: number;

  costoVisitas: number;
  costoEstudios: number;
  costoInsumos: number;
  costoTotal: number;

  margen: number;
  margenPorcentaje: number;

  /** Precio de venta bajo el cual la operación pierde plata. */
  precioDeEquilibrioClp: number;
}

function costoPorVisita(s: Supuestos): number {
  return (s.sueldoBrutoAsesor * s.factorCostoEmpresa) / s.visitasPorAsesorAlMes;
}

function costoPorEstudio(s: Supuestos): number {
  return (s.sueldoBrutoAbogado * s.factorCostoEmpresa) / s.estudiosPorAbogadoAlMes;
}

/**
 * El margen de una venta cerrada.
 *
 * El IVA de la comisión no entra: se recauda y se entera al fisco, no es
 * ingreso. Los aranceles de notaría y Conservador tampoco: los pagan las
 * partes, no la plataforma.
 */
export function margenDeOperacion(
  precioVentaClp: number,
  supuestos: Supuestos = SUPUESTOS_POR_DEFECTO,
): DesgloseOperacion {
  const s = supuestos;
  const publicacionesPorVenta = s.tasaDeCierre > 0 ? 1 / s.tasaDeCierre : 0;

  const porVisita = costoPorVisita(s);
  const porEstudio = costoPorEstudio(s);

  const informesVendidos = publicacionesPorVenta * s.informesPorPublicacion;

  const ingresoComision = precioVentaClp * s.tasaComision;
  const ingresoInformes = informesVendidos * s.precioInformeTitulos;

  const costoVisitas = publicacionesPorVenta * s.visitasPorPublicacion * porVisita;
  const costoEstudios = informesVendidos * porEstudio;
  const costoInsumos = informesVendidos * s.costoCarpetaCbr;

  const ingresoTotal = ingresoComision + ingresoInformes;
  const costoTotal = costoVisitas + costoEstudios + costoInsumos;
  const margen = ingresoTotal - costoTotal;

  // Precio bajo el cual no conviene tomar la operación: el que deja la comisión
  // justo cubriendo lo que los informes no alcanzan a pagar.
  const faltante = costoTotal - ingresoInformes;
  const precioDeEquilibrioClp = s.tasaComision > 0 ? Math.max(0, faltante / s.tasaComision) : 0;

  return {
    precioVentaClp,
    publicacionesPorVenta,
    ingresoComision,
    ingresoInformes,
    ingresoTotal,
    costoPorVisita: porVisita,
    costoPorEstudio: porEstudio,
    costoVisitas,
    costoEstudios,
    costoInsumos,
    costoTotal,
    margen,
    margenPorcentaje: ingresoTotal > 0 ? margen / ingresoTotal : 0,
    precioDeEquilibrioClp,
  };
}

/**
 * Lo que habría que cobrar por el informe para que no lo subsidie la comisión.
 * El estudio lo hace un abogado en sueldo, así que su costo es real aunque no
 * se facture aparte.
 */
export function precioInformeQueCubreCosto(
  supuestos: Supuestos = SUPUESTOS_POR_DEFECTO,
  margenObjetivo = 0.3,
): { costo: number; sugerido: number } {
  const costo = costoPorEstudio(supuestos) + supuestos.costoCarpetaCbr;
  return { costo, sugerido: Math.ceil((costo / (1 - margenObjetivo)) / 1000) * 1000 };
}

/**
 * Cuántas ventas al mes aguanta un equipo de este tamaño. Sirve para saber
 * cuándo hay que contratar al siguiente asesor o al siguiente abogado.
 */
export function capacidadMensual(
  asesores: number,
  abogados: number,
  supuestos: Supuestos = SUPUESTOS_POR_DEFECTO,
): { ventasPorVisitas: number; ventasPorEstudios: number; cuelloDeBotella: string } {
  const s = supuestos;
  const publicacionesPorVenta = s.tasaDeCierre > 0 ? 1 / s.tasaDeCierre : 0;

  const visitasDisponibles = asesores * s.visitasPorAsesorAlMes;
  const visitasPorVenta = publicacionesPorVenta * s.visitasPorPublicacion;
  const ventasPorVisitas = visitasPorVenta > 0 ? visitasDisponibles / visitasPorVenta : 0;

  const estudiosDisponibles = abogados * s.estudiosPorAbogadoAlMes;
  const estudiosPorVenta = publicacionesPorVenta * s.informesPorPublicacion;
  const ventasPorEstudios = estudiosPorVenta > 0 ? estudiosDisponibles / estudiosPorVenta : 0;

  return {
    ventasPorVisitas,
    ventasPorEstudios,
    cuelloDeBotella: ventasPorVisitas <= ventasPorEstudios ? 'asesores' : 'abogados',
  };
}
