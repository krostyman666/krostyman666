/**
 * Medios de cobro del informe.
 *
 * POR QUÉ NO STRIPE, pese a que hay llaves reservadas en `.env.example`: Stripe
 * sólo admite registro de empresas en 46 países y Chile no está entre ellos
 * —en Sudamérica sólo Brasil—, así que una sociedad chilena no puede
 * onboardearse directo. Además cobra 3,6% + $30, la comisión más alta del
 * mercado local.
 *
 * EL DESTINO ES FLOW. Es agregador: una sola integración da Webpay (tarjetas),
 * transferencia y Servipag, sin pasar nosotros por la certificación de
 * Transbank. Y deja la transferencia a 0,99% + IVA, que en un cobro de $100.000
 * es la diferencia entre pagar $1.200 y pagar $4.200 de comisión.
 *
 * MIENTRAS NO HAYA CREDENCIALES se cobra por transferencia con conciliación
 * manual, que es como opera la mitad del comercio chico en Chile. El flujo
 * queda completo y el proveedor entra después sin rehacerlo.
 *
 * ADVERTENCIA: las comisiones son de tarifas publicadas y se negocian por rubro
 * y volumen. Cotizarlas antes de fijar el precio del informe.
 */

export const MEDIOS_PAGO = ['transferencia', 'webpay'] as const;
export type MedioPago = (typeof MEDIOS_PAGO)[number];

export const PROVEEDORES_PAGO = [
  'manual', // transferencia que alguien concilia a mano
  'flow',
] as const;
export type ProveedorPago = (typeof PROVEEDORES_PAGO)[number];

export interface DefinicionMedio {
  medio: MedioPago;
  nombre: string;
  /** Comisión sobre el monto, sin IVA. */
  comision: number;
  /** Cargo fijo por transacción, en pesos. */
  fijo: number;
  /** Cuánto tarda en confirmarse, en palabras. */
  confirmacion: string;
  /** Con qué proveedor está implementado hoy. */
  proveedor: ProveedorPago;
  nota: string;
}

export const MEDIOS: DefinicionMedio[] = [
  {
    medio: 'transferencia',
    nombre: 'Transferencia bancaria',
    comision: 0.0099,
    fijo: 0,
    confirmacion: 'Un día hábil: alguien la revisa contra la cartola.',
    proveedor: 'manual',
    nota: 'Hoy se concilia a mano. Con Flow conectado la confirmación es inmediata y la comisión queda en 0,99% + IVA.',
  },
  {
    medio: 'webpay',
    nombre: 'Tarjeta de crédito o débito',
    comision: 0.0295,
    fijo: 0,
    confirmacion: 'Inmediata.',
    proveedor: 'flow',
    nota: 'Requiere credenciales de Flow. Crédito 2,95% + IVA, débito 1,29%: acá se usa el peor caso.',
  },
];

export const MEDIO_POR_CODIGO = new Map(MEDIOS.map((m) => [m.medio, m]));

/** El IVA de la comisión de la pasarela también es costo: no se recupera. */
const IVA = 0.19;

/** Lo que cuesta cobrar ese monto por ese medio, comisión más IVA. */
export function costoDeCobrar(monto: number, medio: MedioPago): number {
  const def = MEDIO_POR_CODIGO.get(medio);
  if (!def) return 0;
  return (monto * def.comision + def.fijo) * (1 + IVA);
}

/** El medio más barato para ese monto. Con montos así siempre es transferencia. */
export function medioMasBarato(monto: number): MedioPago {
  return [...MEDIOS].sort(
    (a, b) => costoDeCobrar(monto, a.medio) - costoDeCobrar(monto, b.medio),
  )[0].medio;
}

export const ESTADOS_PAGO = ['pendiente', 'pagado', 'anulado', 'reembolsado'] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];
