# 🔧 IVI Chile - Especificación Técnica Completa

**Versión**: 1.0  
**Fecha**: 18 de septiembre de 2026  
**Audience**: Equipo IT (Backend + Frontend + DevOps)

---

## 1. Arquitectura General

### 1.1 Componentes

```
┌─────────────────────────────────────────────────────────┐
│                     ivinet.cl (Actual)                  │
│                  (Hosting + Frontend)                   │
└─────────────────────────────────────────────────────────┘
           │                      │
           ├──────────────────────┴──────────────────────┐
           │                                              │
     ┌─────▼──────┐                            ┌─────────▼────────┐
     │ Chatbot     │                            │ Reservas.ivinet  │
     │ Widget      │                            │ .cl (Subdominio) │
     │ (iframe)    │                            │ o /reservas      │
     └─────┬──────┘                            └─────────┬────────┘
           │                                              │
           └──────────────────────┬──────────────────────┘
                                  │
                    ┌─────────────▼──────────────────┐
                    │      Backend Compartido        │
                    │    (Express + PostgreSQL)      │
                    │                                │
                    ├─ API /api/v1/chat            │
                    ├─ API /api/v1/ivi/reservas   │
                    ├─ API /api/v1/ivi/especialistas
                    ├─ Webhooks /webhooks/pago    │
                    └─ WebSocket para notificaciones
                                  │
                    ┌─────────────▼──────────────────┐
                    │      PostgreSQL DB             │
                    │                                │
                    ├─ Tabla: chat_sessions        │
                    ├─ Tabla: ivi_reservas         │
                    ├─ Tabla: ivi_especialistas    │
                    ├─ Tabla: ivi_presupuestos     │
                    ├─ Tabla: ivi_pagos            │
                    └─ Tabla: ivi_integraciones    │
                                  │
                    ┌─────────────▼──────────────────┐
                    │  Servicios Externos            │
                    │                                │
                    ├─ Claude API (Chat IA)        │
                    ├─ Webpay (Pagos)              │
                    ├─ Outlook API (Agenda médica) │
                    ├─ SendGrid (Email)            │
                    └─ Twilio (SMS)                │
```

---

## 2. Base de Datos - Schema PostgreSQL

### 2.1 Tabla: `chat_sessions`

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación del cliente
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  nombre VARCHAR(255),
  rut VARCHAR(12) UNIQUE,
  
  -- Conversación
  conversacion JSONB DEFAULT '[]',
  -- Ejemplo:
  -- [
  --   { "role": "user", "content": "¿Hacen congelación?" },
  --   { "role": "assistant", "content": "Sí, ofrecemos..." }
  -- ]
  
  -- Calificación del lead
  lead_score INT DEFAULT 0, -- 0-100
  lead_status VARCHAR(50) DEFAULT 'cold', -- cold, warm, hot
  interes_tratamiento VARCHAR(100), -- congelacion, fiv, ia, etc
  edad INT,
  situacion_marital VARCHAR(50), -- pareja_heterosexual, pareja_homosexual, soltera, etc
  
  -- Metadata
  primera_interaccion TIMESTAMP DEFAULT NOW(),
  ultima_interaccion TIMESTAMP DEFAULT NOW(),
  duracion_sesion_minutos INT,
  
  -- Seguimiento
  convertido_a_reserva BOOLEAN DEFAULT FALSE,
  reserva_id UUID REFERENCES ivi_reservas(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_email ON chat_sessions(email);
CREATE INDEX idx_chat_lead_status ON chat_sessions(lead_status);
CREATE INDEX idx_chat_convertido ON chat_sessions(convertido_a_reserva);
```

### 2.2 Tabla: `ivi_especialistas`

```sql
CREATE TABLE ivi_especialistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  nombre VARCHAR(255) NOT NULL,
  especialidad VARCHAR(100), -- Médico Reproductor, Psicólogo, etc
  email VARCHAR(255),
  telefono VARCHAR(20),
  
  -- Disponibilidad
  calendario_outlook_id VARCHAR(255), -- Integración con Outlook
  horario_inicio TIME DEFAULT '09:00',
  horario_fin TIME DEFAULT '18:00',
  dias_disponibles VARCHAR(50) DEFAULT 'lunes,martes,miercoles,jueves,viernes',
  
  -- Metadata
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 Tabla: `ivi_reservas`

```sql
CREATE TABLE ivi_reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_numero VARCHAR(50) UNIQUE, -- RES-20260918-001
  
  -- Cliente
  email VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  rut VARCHAR(12) NOT NULL,
  edad INT,
  
  -- Cita
  tipo_consulta VARCHAR(50) NOT NULL, -- inicial, seguimiento, congelacion
  especialista_id UUID NOT NULL REFERENCES ivi_especialistas(id),
  fecha_cita DATE NOT NULL,
  hora_cita TIME NOT NULL,
  canal VARCHAR(50) DEFAULT 'presencial', -- presencial, videollamada
  
  -- Presupuesto
  presupuesto_id UUID REFERENCES ivi_presupuestos(id),
  monto_total DECIMAL(10, 2) NOT NULL,
  
  -- Pago
  pago_id UUID REFERENCES ivi_pagos(id),
  estado_pago VARCHAR(50) DEFAULT 'pendiente', 
  -- pendiente, procesando, pagado, fallido, reembolsado
  
  -- Confirmación
  qr_code TEXT,
  confirmado_por_paciente BOOLEAN DEFAULT FALSE,
  confirmado_en TIMESTAMP,
  
  -- Estados
  estado VARCHAR(50) DEFAULT 'reservada', 
  -- reservada, confirmada, completada, cancelada
  
  -- Notas
  notas_paciente TEXT,
  notas_interno TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_especialista FOREIGN KEY (especialista_id) 
    REFERENCES ivi_especialistas(id)
);

CREATE INDEX idx_reserva_email ON ivi_reservas(email);
CREATE INDEX idx_reserva_fecha ON ivi_reservas(fecha_cita);
CREATE INDEX idx_reserva_estado_pago ON ivi_reservas(estado_pago);
```

### 2.4 Tabla: `ivi_presupuestos`

```sql
CREATE TABLE ivi_presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  tipo_consulta VARCHAR(50) NOT NULL, -- inicial, congelacion, etc
  
  -- Desglose de precios
  precio_base DECIMAL(10, 2) NOT NULL, -- ej: 150000
  
  -- Opcionales (JSONB permite flexibilidad)
  opcionales JSONB DEFAULT '{}',
  -- Ejemplo:
  -- {
  --   "bateria_hormonal": { "nombre": "Batería Hormonal", "precio": 80000 },
  --   "ecografia": { "nombre": "Ecografía", "precio": 120000 }
  -- }
  
  precio_total DECIMAL(10, 2) GENERATED ALWAYS AS (
    precio_base + COALESCE(
      (SELECT SUM(CAST(value->>'precio' AS DECIMAL)) 
       FROM jsonb_each(opcionales)),
      0
    )
  ) STORED,
  
  -- Descuentos (si aplica)
  descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
  descuento_monto DECIMAL(10, 2) DEFAULT 0,
  precio_final DECIMAL(10, 2),
  
  -- Validez
  vigencia_dias INT DEFAULT 30,
  vigente_hasta TIMESTAMP,
  
  -- Metadata
  creado_por VARCHAR(255), -- email del especialista que lo sugirió
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.5 Tabla: `ivi_pagos`

```sql
CREATE TABLE ivi_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  reserva_id UUID NOT NULL REFERENCES ivi_reservas(id),
  
  -- Detalles del pago
  monto DECIMAL(10, 2) NOT NULL,
  medio_pago VARCHAR(50) NOT NULL, -- webpay, transferencia, tarjeta
  
  -- Webpay (Transbank)
  webpay_orden_compra VARCHAR(255) UNIQUE,
  webpay_token VARCHAR(255),
  webpay_respuesta JSONB, -- Respuesta completa de Transbank
  
  -- Estados
  estado VARCHAR(50) DEFAULT 'pendiente',
  -- pendiente, procesando, autorizado, pagado, fallido, anulado
  
  -- Intentos
  numero_intentos INT DEFAULT 0,
  ultimo_intento TIMESTAMP,
  
  -- Respuestas de error
  codigo_error VARCHAR(50),
  mensaje_error TEXT,
  
  -- Transaccionalidad
  transaccion_id VARCHAR(255), -- ID único de Transbank
  fecha_transaccion TIMESTAMP,
  
  -- Webhook
  webhook_recibido BOOLEAN DEFAULT FALSE,
  webhook_en TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pago_estado ON ivi_pagos(estado);
CREATE INDEX idx_pago_reserva ON ivi_pagos(reserva_id);
```

### 2.6 Tabla: `ivi_integraciones`

```sql
CREATE TABLE ivi_integraciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Outlook
  outlook_token TEXT,
  outlook_tenant_id VARCHAR(255),
  outlook_calendar_id VARCHAR(255),
  
  -- Webpay
  webpay_commerce_code VARCHAR(50),
  webpay_api_key TEXT,
  webpay_ambiente VARCHAR(20) DEFAULT 'sandbox', -- sandbox, produccion
  
  -- SendGrid (Email)
  sendgrid_api_key TEXT,
  sendgrid_from_email VARCHAR(255) DEFAULT 'noreply@ivinet.cl',
  
  -- Twilio (SMS)
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number VARCHAR(20),
  
  -- Claude API
  claude_api_key TEXT,
  claude_model VARCHAR(50) DEFAULT 'claude-3-5-sonnet-20241022',
  
  -- Metadata
  actualizado_por VARCHAR(255), -- email del admin
  actualizado_en TIMESTAMP DEFAULT NOW()
);
```

---

## 3. APIs REST

### 3.1 Chat API

#### POST /api/v1/chat/mensaje

```bash
curl -X POST https://ivinet.cl/api/v1/chat/mensaje \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "uuid-o-null",
    "email": "cliente@example.com",
    "mensaje": "¿Hacen congelación de óvulos?",
    "contexto": {
      "edad": 35,
      "situacion_marital": "pareja_heterosexual"
    }
  }'
```

**Response**:
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "respuesta": "Sí, ofrecemos congelación de óvulos mediante vitrificación...",
  "tipo_respuesta": "faq",
  "acciones_sugeridas": [
    {
      "tipo": "solicitar_info",
      "texto": "¿Cuál es tu edad?",
      "campo": "edad"
    },
    {
      "tipo": "mostrar_presupuesto",
      "item": "congelacion_ovulos"
    },
    {
      "tipo": "sugerir_especialista",
      "especialista_id": "uuid"
    }
  ],
  "lead_score": 72,
  "lead_status": "warm"
}
```

#### WebSocket: /ws/chat/{session_id}

Para respuestas en streaming (tipo ChatGPT):

```javascript
const ws = new WebSocket('wss://ivinet.cl/ws/chat/550e8400-e29b-41d4-a716-446655440000');

ws.onmessage = (event) => {
  console.log('Chunk:', event.data);
  // "Sí, ofrecemos..."
  // "congelación de óvulos..."
  // "mediante vitrificación..."
};
```

---

### 3.2 Reservas API

#### POST /api/v1/ivi/reservas

Crear una reserva:

```bash
curl -X POST https://ivinet.cl/api/v1/ivi/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "paciente": {
      "email": "cliente@example.com",
      "telefono": "+56912345678",
      "nombre": "María García",
      "rut": "18123456-7",
      "edad": 35
    },
    "cita": {
      "tipo_consulta": "inicial",
      "especialista_id": "550e8400-e29b-41d4-a716-446655440001",
      "fecha": "2026-09-25",
      "hora": "14:30",
      "canal": "presencial"
    },
    "presupuesto": {
      "tipo_consulta": "inicial",
      "opcionales": ["bateria_hormonal", "ecografia"]
    }
  }'
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "reserva_numero": "RES-20260918-001",
  "estado": "pendiente_pago",
  "monto_total": 350000,
  "desglose": {
    "consulta": 150000,
    "bateria_hormonal": 80000,
    "ecografia": 120000
  },
  "pago": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "estado": "pendiente",
    "enlace_pago": "https://webpay.transbank.cl/...",
    "qr": "data:image/png;base64,iVBORw0KGgo..."
  },
  "cita": {
    "fecha": "2026-09-25",
    "hora": "14:30",
    "especialista": "Dra. María López"
  }
}
```

#### GET /api/v1/ivi/reservas/{reserva_id}

Obtener estado de una reserva:

```bash
curl -X GET https://ivinet.cl/api/v1/ivi/reservas/550e8400-e29b-41d4-a716-446655440002
```

**Response**: (como POST anterior, pero con `estado: "confirmada"` si pagó)

---

### 3.3 Especialistas API

#### GET /api/v1/ivi/especialistas

Listar especialistas:

```bash
curl -X GET "https://ivinet.cl/api/v1/ivi/especialistas?especialidad=Médico%20Reproductor"
```

**Response**:
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "nombre": "Dra. María López",
      "especialidad": "Médico Reproductor",
      "disponibilidad_proxima": {
        "fecha": "2026-09-25",
        "horas": ["09:00", "10:30", "14:30", "16:00"]
      }
    }
  ]
}
```

---

### 3.4 Webhooks (Entrada)

#### POST /webhooks/pago-confirmado

Transbank notifica cuando pago se confirma:

```json
{
  "versionNumber": "1.0",
  "transactionUid": "16273828320938453",
  "orderId": "2740-202609-18",
  "tokenWs": "...",
  "amount": 350000,
  "status": "AUTHORIZED",
  "responseCode": 0
}
```

**Acciones internas**:
1. Validar firma de Transbank
2. Actualizar `ivi_pagos` → estado = "pagado"
3. Actualizar `ivi_reservas` → estado = "confirmada"
4. Crear evento en calendario Outlook del especialista
5. Enviar email confirmación al cliente
6. Enviar SMS recordatorio
7. Actualizar `chat_sessions` → `convertido_a_reserva = TRUE`

---

## 4. Chatbot - Especificación

### 4.1 Flujo de Decisión

```
┌─ Pregunta del cliente
│
├─ ¿Está en KB local?
│  ├─ SÍ → Responder con template
│  └─ NO ↓
│
├─ ¿Es solicitud de presupuesto?
│  ├─ SÍ → Mostrar calculadora automática
│  └─ NO ↓
│
├─ ¿Es consulta sobre disponibilidad?
│  ├─ SÍ → Consultar agenda (Outlook API)
│  └─ NO ↓
│
├─ ¿Cliente tiene datos básicos?
│  ├─ NO → Pedir edad, situación marital
│  └─ SÍ ↓
│
├─ Consultar Claude API (streaming)
│  └─ Respuesta personalizada basada en perfil
│
└─ Calcular lead_score y lead_status
   └─ Guardar en chat_sessions
```

### 4.2 Knowledge Base (Estructura JSON)

```json
{
  "faq": [
    {
      "id": "congelacion-ovulos",
      "preguntas": [
        "¿Hacen congelación de óvulos?",
        "¿Se pueden congelar óvulos?",
        "¿Vitrificación?"
      ],
      "respuesta": "Sí, ofrecemos congelación de óvulos mediante vitrificación con tasa de supervivencia del 95%.",
      "contexto_necesario": ["edad"],
      "presupuesto_item": "congelacion_ovulos",
      "categoria": "servicios"
    },
    {
      "id": "cobertura-fonasa",
      "preguntas": [
        "¿Cubre Fonasa?",
        "¿Tengo cobertura Fonasa?"
      ],
      "respuesta": "Sí, Fonasa cubre hasta 3 ciclos FIV si cumplen criterios de edad (<43), diagnóstico de infertilidad y otros requisitos.",
      "categoria": "financiamiento",
      "link_externo": "https://www.fonasa.cl/..."
    }
  ],
  "presupuestos": [
    {
      "id": "congelacion_ovulos",
      "nombre": "Congelación de Óvulos",
      "precio_base": 850000,
      "opcionales": {
        "almacenamiento_anual": { "precio": 15000 },
        "descongelamiento_futura": { "precio": 150000 }
      }
    }
  ]
}
```

### 4.3 Scoring de Leads

```javascript
function calcularLeadScore(session) {
  let score = 0;
  
  // Datos completados (+25 puntos)
  if (session.email) score += 5;
  if (session.nombre) score += 5;
  if (session.edad) score += 5;
  if (session.telefono) score += 5;
  if (session.situacion_marital) score += 5;
  
  // Intención clara (+50 puntos)
  const palabras_calientes = ['congelacion', 'embarazo', 'tratamiento', 'agendar'];
  if (conversacion.includes(...palabras_calientes)) score += 30;
  
  // Engagement (+25 puntos)
  if (session.duracion_sesion_minutos > 5) score += 15;
  if (session.conversacion.length > 8) score += 10;
  
  return Math.min(score, 100);
}

function determinarLeadStatus(score) {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}
```

---

## 5. Integración Webpay (Transbank)

### 5.1 Flujo de Pago

```
1. Backend genera orden de compra
   POST https://webpay.transbank.cl/api/oneclick/v1.0/transactions

2. Respuesta: URL de pago + token

3. Cliente va a página Webpay

4. Ingresa datos tarjeta

5. Transbank confirma pago

6. Webhook a nuestro /webhooks/pago-confirmado

7. Actualizar DB + notificar cliente
```

### 5.2 Código Backend (Express)

```typescript
// src/routes/payments.ts
import express from 'express';
import Webpay from 'transbank-sdk';

const router = express.Router();
const webpay = new Webpay.WebpayPlus({
  commerceCode: process.env.WEBPAY_COMMERCE_CODE,
  apiKey: process.env.WEBPAY_API_KEY,
  environment: 'sandbox' // o 'produccion'
});

router.post('/pago/:reserva_id', async (req, res) => {
  const { reserva_id } = req.params;
  
  // Obtener reserva y monto
  const reserva = await ivi_reservas.findByPk(reserva_id);
  
  // Crear transacción en Webpay
  const transaction = await webpay.transaction.create({
    buyOrder: reserva.reserva_numero,
    sessionId: uuidv4(),
    amount: Math.round(reserva.monto_total),
    returnUrl: `${process.env.BACKEND_URL}/webhooks/pago-confirmado/${reserva_id}`
  });
  
  res.json({
    url: transaction.url,
    token: transaction.token
  });
});

router.post('/webhooks/pago-confirmado/:reserva_id', async (req, res) => {
  const { reserva_id } = req.params;
  const { tokenWs } = req.body;
  
  try {
    // Obtener resultado del pago
    const result = await webpay.transaction.getStatus(tokenWs);
    
    if (result.status === 'AUTHORIZED') {
      // Pago exitoso
      const reserva = await ivi_reservas.findByPk(reserva_id);
      
      // Actualizar estado
      await ivi_pagos.update(
        { estado: 'pagado', transaccion_id: result.transactionUid },
        { where: { reserva_id } }
      );
      
      await reserva.update({ estado: 'confirmada' });
      
      // Crear evento en Outlook
      await crearEventoOutlook(reserva);
      
      // Enviar email + SMS
      await enviarConfirmacion(reserva);
      
      // Actualizar chat_session si existe
      await chat_sessions.update(
        { convertido_a_reserva: true, reserva_id },
        { where: { email: reserva.email } }
      );
      
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Pago rechazado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 6. Integración Outlook (Calendario Médico)

### 6.1 Crear Evento

```typescript
// src/services/outlook.ts
import { Client } from '@microsoft/microsoft-graph-client';

export async function crearEventoOutlook(reserva: ivi_reservas) {
  const client = Client.init({
    authProvider: async (done) => {
      // Usar token guardado en DB
      const integracion = await ivi_integraciones.findOne();
      done(null, integracion.outlook_token);
    }
  });
  
  const event = {
    subject: `Consulta ${reserva.tipo_consulta} - ${reserva.nombre}`,
    start: {
      dateTime: new Date(`${reserva.fecha_cita}T${reserva.hora_cita}`).toISOString(),
      timeZone: 'America/Santiago'
    },
    end: {
      dateTime: new Date(
        new Date(`${reserva.fecha_cita}T${reserva.hora_cita}`).getTime() + 60 * 60000
      ).toISOString(),
      timeZone: 'America/Santiago'
    },
    isReminderOn: true,
    reminderMinutesBeforeStart: 15,
    categories: ['IVI Reserva Online'],
    body: {
      contentType: 'HTML',
      content: `
        <p><strong>Paciente:</strong> ${reserva.nombre}</p>
        <p><strong>Email:</strong> ${reserva.email}</p>
        <p><strong>Teléfono:</strong> ${reserva.telefono}</p>
        <p><strong>RUT:</strong> ${reserva.rut}</p>
        <p><strong>Tipo:</strong> ${reserva.tipo_consulta}</p>
        <p><strong>Monto:</strong> $${reserva.monto_total}</p>
        <p><strong>Reserva:</strong> ${reserva.reserva_numero}</p>
      `
    }
  };
  
  return await client
    .api(`/me/calendars/${integracion.outlook_calendar_id}/events`)
    .post(event);
}
```

---

## 7. Frontend - Componentes React

### 7.1 Chatbot Widget

```typescript
// frontend/src/components/ChatbotWidget.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: 'assistant',
      content: '¡Hola! Soy IVI Assistant. ¿En qué puedo ayudarte hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/v1/chat/mensaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          email: localStorage.getItem('email') || 'anonimo@ivinet.cl',
          mensaje: userMessage
        })
      });

      const data = await response.json();
      
      if (!sessionId) setSessionId(data.session_id);

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.respuesta }
      ]);

      // Mostrar acciones sugeridas
      if (data.acciones_sugeridas?.length > 0) {
        const acciones = data.acciones_sugeridas
          .map((a: any) => a.texto)
          .join(' | ');
        setMessages(prev => [
          ...prev,
          { role: 'system', content: `Sugerencias: ${acciones}` }
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-lg">
        <h3 className="font-semibold">IVI Assistant</h3>
        <button onClick={() => setOpen(false)}>
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-400 text-sm">Escribiendo...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Escribe tu pregunta..."
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          onClick={handleSendMessage}
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
```

### 7.2 Formulario de Reservas

```typescript
// frontend/src/app/reservas/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReservasPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rut: '',
    edad: '',
    tipo_consulta: 'inicial',
    especialista_id: '',
    fecha: '',
    hora: '',
    opcionales: [] as string[]
  });

  const [presupuesto, setPresupuesto] = useState({
    base: 150000,
    opcionales: {} as Record<string, number>,
    total: 150000
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/v1/ivi/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paciente: {
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          rut: formData.rut,
          edad: parseInt(formData.edad)
        },
        cita: {
          tipo_consulta: formData.tipo_consulta,
          especialista_id: formData.especialista_id,
          fecha: formData.fecha,
          hora: formData.hora
        },
        presupuesto: {
          tipo_consulta: formData.tipo_consulta,
          opcionales: formData.opcionales
        }
      })
    });

    const reserva = await response.json();
    
    // Redirigir a pago
    window.location.href = reserva.pago.enlace_pago;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Agendar Consulta - IVI Chile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos personales */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Datos Personales</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre completo"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="RUT"
              value={formData.rut}
              onChange={(e) => setFormData({...formData, rut: e.target.value})}
              className="border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        {/* Tipo de consulta */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Tipo de Consulta</h2>
          
          <select
            value={formData.tipo_consulta}
            onChange={(e) => setFormData({...formData, tipo_consulta: e.target.value})}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="inicial">Consulta Inicial</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="congelacion">Congelación de Óvulos</option>
          </select>
        </div>

        {/* Presupuesto y opcionales */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Presupuesto</h2>
          
          <div className="space-y-2">
            <p>Consulta base: ${presupuesto.base.toLocaleString('es-CL')}</p>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                onChange={(e) => {
                  const total = presupuesto.base + (e.target.checked ? 80000 : -80000);
                  setPresupuesto({...presupuesto, total});
                  setFormData({
                    ...formData,
                    opcionales: e.target.checked 
                      ? [...formData.opcionales, 'bateria_hormonal']
                      : formData.opcionales.filter(o => o !== 'bateria_hormonal')
                  });
                }}
                className="mr-2"
              />
              Batería Hormonal (+$80.000)
            </label>

            <p className="font-bold text-lg mt-4">
              Total: ${presupuesto.total.toLocaleString('es-CL')}
            </p>
          </div>
        </div>

        {/* Botón enviar */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Proceder al Pago
        </button>
      </form>
    </div>
  );
}
```

---

## 8. Deployment & DevOps

### 8.1 Variables de Entorno (`.env`)

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ivi_chile
REDIS_URL=redis://localhost:6379

# APIs
CLAUDE_API_KEY=sk-...
WEBPAY_COMMERCE_CODE=597xxxxxxxxx
WEBPAY_API_KEY=...
WEBPAY_ENVIRONMENT=sandbox

# Outlook
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
OUTLOOK_TENANT_ID=...

# Email & SMS
SENDGRID_API_KEY=SG.xxx
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+56912345678

# Frontend
NEXT_PUBLIC_API_URL=https://ivinet.cl/api
FRONTEND_URL=https://ivinet.cl
```

### 8.2 Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ivi_chile
      POSTGRES_USER: ivi_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://ivi_user:${POSTGRES_PASSWORD}@postgres:5432/ivi_chile
      - REDIS_URL=redis://redis:6379
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 9. Testing

### 9.1 Unit Tests (Backend)

```bash
# Jest
npm test --watch
```

**Ejemplos**:

```typescript
// src/__tests__/chat.test.ts
describe('Chat API', () => {
  test('debe responder FAQ conocida', async () => {
    const response = await request(app)
      .post('/api/v1/chat/mensaje')
      .send({
        email: 'test@example.com',
        mensaje: '¿Hacen congelación de óvulos?'
      });

    expect(response.status).toBe(200);
    expect(response.body.respuesta).toContain('congelación');
    expect(response.body.lead_status).toBe('warm');
  });
});
```

### 9.2 E2E Tests (Frontend)

```bash
# Playwright
npx playwright test
```

---

## 10. Timeline Desarrollo

| Semana | Backend | Frontend | Infra | Testing |
|---|---|---|---|---|
| 1-2 | Setup DB + migrations | Setup Next.js | Docker compose | |
| 3 | Chat API | Chatbot widget | | Unit tests |
| 4 | Reservas CRUD | Formulario reservas | Webpay sandbox | |
| 5 | Webpay integración | Pago flow | | |
| 6 | Outlook sync | Confirmación | Monitoring | E2E |
| 7 | Pulir + fixes | UI/UX | | UAT |
| 8 | | | Go live | |

---

## 11. Consideraciones Finales

1. **Reutilizar de Trato**: Backend, frontend, DB, hosting de Trato sirven como baseline.
2. **API Rate Limiting**: Proteger contra abuso de Claude API.
3. **Security**: Validar JWT en endpoints, sanitizar inputs (Joi/Zod).
4. **Monitoring**: Sentry para errores, Datadog para performance.
5. **Escalabilidad**: Queue jobs para emails/SMS con Bull (ya usamos Redis).

---

**Siguiente paso**: Kickoff con el equipo. ¡A codear!
