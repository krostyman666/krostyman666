/**
 * Tipos compartidos para el módulo IVI Chile
 */

export interface ChatMensaje {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatSessionData {
  sessionId: string;
  email: string;
  telefono?: string;
  nombre?: string;
  rut?: string;
  edad?: number;
  situacionMarital?: string;
  interesTratamiento?: string;
  conversacion: ChatMensaje[];
  leadScore: number;
  leadStatus: 'cold' | 'warm' | 'hot';
  convertidoAReserva: boolean;
}

export interface PresupuestoItem {
  id: string;
  nombre: string;
  precio: number;
}

export interface PresupuestoData {
  tipoConsulta: 'inicial' | 'seguimiento' | 'congelacion';
  precioBase: number;
  opcionales?: PresupuestoItem[];
  descuentoPorcentaje?: number;
  descuentoMonto?: number;
  precioFinal: number;
}

export interface PacienteData {
  nombre: string;
  email: string;
  telefono: string;
  rut: string;
  edad?: number;
}

export interface CitaData {
  tipoConsulta: 'inicial' | 'seguimiento' | 'congelacion';
  especialistaId: string;
  fecha: Date;
  hora: string;
  canal: 'presencial' | 'videollamada';
}

export interface ReservaData {
  id: string;
  reservaNumero: string;
  paciente: PacienteData;
  cita: CitaData;
  presupuesto: PresupuestoData;
  estado: 'reservada' | 'confirmada' | 'completada' | 'cancelada';
  estadoPago: 'pendiente' | 'procesando' | 'pagado' | 'fallido' | 'reembolsado';
  qrCode?: string;
}

export interface PagoData {
  reservaId: string;
  monto: number;
  medioPago: 'webpay' | 'transferencia' | 'tarjeta';
  estado: 'pendiente' | 'procesando' | 'pagado' | 'fallido';
  transaccionId?: string;
}

export interface WebpayRespuesta {
  versionNumber: string;
  transactionUid: string;
  orderId: string;
  amount: number;
  status: string;
  responseCode: number;
  authorizationCode?: string;
  cardNumber?: string;
  accountingDate?: string;
  transactionDate?: string;
}

export interface EspecialistaData {
  id: string;
  nombre: string;
  especialidad: string;
  email: string;
  telefono: string;
  horarioInicio: string;
  horarioFin: string;
  diasDisponibles: string[];
  activo: boolean;
  proximaDisponibilidad?: {
    fecha: Date;
    horas: string[];
  };
}

export interface FAQItem {
  id: string;
  preguntas: string[];
  respuesta: string;
  categoria: string;
  contextoNecesario?: string[];
  presupuestoItem?: string;
  linkExterno?: string;
}

export interface KnowledgeBase {
  faq: FAQItem[];
  presupuestos: Record<string, PresupuestoData>;
  especialistas?: EspecialistaData[];
}
