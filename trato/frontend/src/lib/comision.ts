export const IVA = 0.19;

export const TASA_CORREDOR_HABITUAL = 0.02;
export const TASA_TRATO = 0.01;

// La UF cambia a diario. Este valor es solo el fallback inicial del formulario:
// reemplazar por el feed del Banco Central (mindicador.cl / SBIF) antes de produccion.
export const UF_FALLBACK_CLP = 39000;

export type Moneda = 'clp' | 'uf';

export interface DesgloseComision {
  valorPropiedad: number;
  corredorNeto: number;
  corredorIva: number;
  corredorTotal: number;
  tratoNeto: number;
  tratoIva: number;
  tratoTotal: number;
  ahorro: number;
  ahorroPorcentaje: number;
}

export function calcularComision(
  valorPropiedad: number,
  tasaCorredor: number = TASA_CORREDOR_HABITUAL,
  tasaTrato: number = TASA_TRATO,
): DesgloseComision {
  const valor = Number.isFinite(valorPropiedad) && valorPropiedad > 0 ? valorPropiedad : 0;

  const corredorNeto = valor * tasaCorredor;
  const corredorIva = corredorNeto * IVA;
  const corredorTotal = corredorNeto + corredorIva;

  const tratoNeto = valor * tasaTrato;
  const tratoIva = tratoNeto * IVA;
  const tratoTotal = tratoNeto + tratoIva;

  const ahorro = corredorTotal - tratoTotal;

  return {
    valorPropiedad: valor,
    corredorNeto,
    corredorIva,
    corredorTotal,
    tratoNeto,
    tratoIva,
    tratoTotal,
    ahorro,
    ahorroPorcentaje: corredorTotal > 0 ? ahorro / corredorTotal : 0,
  };
}

const formateadorCLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatearCLP(monto: number): string {
  return formateadorCLP.format(Math.round(monto));
}

export function formatearUF(monto: number): string {
  return `UF ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(Math.round(monto))}`;
}

export function aPesos(monto: number, moneda: Moneda, ufEnPesos: number): number {
  return moneda === 'uf' ? monto * ufEnPesos : monto;
}
