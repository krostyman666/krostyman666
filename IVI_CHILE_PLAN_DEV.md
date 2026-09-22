# 🚀 IVI Chile Chatbot - Plan de Desarrollo Detallado

**Rama**: `claude/ivi-chile-booking-chatbot-0hfda3`  
**Proyecto Base**: `trato/` (reutilizar Express + Next.js + PostgreSQL)  
**Duración estimada**: 8 semanas MVP

---

## Fase 1: Setup & Database (Semana 1-2)

### Semana 1: Base de Datos y Modelos

**Tareas**:

- [ ] **Crear migraciones Sequelize para IVI**
  - `20260922_create_chat_sessions.js`
  - `20260922_create_ivi_especialistas.js`
  - `20260922_create_ivi_reservas.js`
  - `20260922_create_ivi_pagos.js`
  - `20260922_create_ivi_presupuestos.js`
  - `20260922_create_ivi_integraciones.js`

- [ ] **Crear modelos Sequelize** en `backend/src/models/`
  - `ChatSession.ts`
  - `IviEspecialista.ts`
  - `IviReserva.ts`
  - `IviPago.ts`
  - `IviPresupuesto.ts`
  - `IviIntegracion.ts`

- [ ] **Crear tipos TypeScript** en `backend/src/types/ivi.ts`

**Entregables**:
```bash
npm run db:up                    # Docker compose levanta Postgres
npm run build -w @trato/backend  # Compila sin errores
```

---

### Semana 2: Configuración y Environment

**Tareas**:

- [ ] **Actualizar `.env.example`**
  ```bash
  # Existentes (Trato)
  DATABASE_URL=...
  JWT_SECRET=...
  
  # Nuevas (IVI)
  CLAUDE_API_KEY=sk-...
  WEBPAY_COMMERCE_CODE=...
  WEBPAY_API_KEY=...
  SENDGRID_API_KEY=...
  TWILIO_ACCOUNT_SID=...
  TWILIO_AUTH_TOKEN=...
  OUTLOOK_CLIENT_ID=...
  OUTLOOK_CLIENT_SECRET=...
  ```

- [ ] **Crear archivo config** en `backend/src/config/ivi.ts`
  - Cargar variables de entorno
  - Inicializar clientes (Claude API, Webpay, etc)

- [ ] **Crear KB inicial** en `backend/src/data/faq.json`
  ```json
  {
    "faq": [
      {
        "id": "congelacion-ovulos",
        "preguntas": ["¿Hacen congelación?", "¿Se pueden congelar óvulos?"],
        "respuesta": "Sí, ofrecemos...",
        "categoria": "servicios"
      }
    ]
  }
  ```

---

## Fase 2: Backend - Chat API (Semana 3-4)

### Semana 3: Endpoints Base

**Tareas**:

- [ ] **Crear router** `backend/src/routes/chat.ts`
  ```typescript
  POST /api/v1/chat/mensaje
  GET  /api/v1/chat/sesion/:sessionId
  ```

- [ ] **Crear servicio de chat** `backend/src/services/ChatService.ts`
  - Buscar respuesta en KB local
  - Si no encuentra → llamar Claude API
  - Guardar conversación en DB
  - Calcular lead_score

- [ ] **Integración Claude API** `backend/src/services/ClaudeService.ts`
  - Streaming de respuestas
  - Manejo de errores
  - Rate limiting

- [ ] **Logging y monitoring**
  - Winston logger con nivel debug
  - Sentry para errores

**Entregables**:
```bash
curl -X POST http://localhost:3001/api/v1/chat/mensaje \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ivi.cl","mensaje":"¿Hacen congelación?"}'
# Responde en 2 segundos
```

---

### Semana 4: Scoring y Validación

**Tareas**:

- [ ] **Crear lead scorer** `backend/src/services/LeadScorerService.ts`
  - Analizar conversación
  - Datos completados (+25)
  - Intención clara (+50)
  - Engagement (+25)
  - Retornar score 0-100 y status (hot/warm/cold)

- [ ] **Validación de datos**
  - Email validado con Joi
  - RUT chileno validado
  - Teléfono formato +56

- [ ] **Tests unitarios** `backend/src/__tests__/chat.test.ts`
  - Mock de Claude API
  - Casos de KB hit/miss
  - Scoring correcto

**Entregables**:
```bash
npm test -w @trato/backend  # 10+ tests passing
```

---

## Fase 3: Frontend - Chatbot Widget (Semana 5-6)

### Semana 5: Widget UI

**Tareas**:

- [ ] **Crear componente Chatbot** `frontend/src/components/ChatbotWidget.tsx`
  - Botón flotante minimizado
  - Panel expandible
  - Estilos con Tailwind
  - Responsive (mobile-first)

- [ ] **Crear formulario inicial** 
  - Nombre, email, teléfono (campos rápidos)
  - Validación con Zod

- [ ] **Historial de mensajes**
  - Scroll automático
  - Timestamps
  - Indicador "escribiendo..."

**Entregables**:
```bash
npm run dev -w @trato/frontend
# Widget visible en http://localhost:3000
# Chat funcional con backend
```

---

### Semana 6: Integraciones y UX

**Tareas**:

- [ ] **Conectar con API backend**
  - Fetch a `/api/v1/chat/mensaje`
  - WebSocket para streaming (opcional, Semana 6.5)
  - Manejo de errores

- [ ] **Persistencia de sesión**
  - LocalStorage para session_id
  - Recuperar conversación anterior

- [ ] **Sugerencias de acciones**
  - Botones "Ver presupuesto"
  - Botón "Agendar consulta"
  - Links a landing específicos

- [ ] **Analytics**
  - Mixpanel o Segment
  - Track eventos (mensaje enviado, botón clic, etc)

**Entregables**:
```bash
# Widget completamente funcional
# Usuario puede chatear y luego clicar "Agendar"
```

---

## Fase 4: Sistema de Reservas (Semana 7)

### Semana 7: Reservas Full Stack

**Tareas**:

- [ ] **Backend - Endpoints reservas**
  ```typescript
  POST   /api/v1/ivi/reservas
  GET    /api/v1/ivi/reservas/:id
  PATCH  /api/v1/ivi/reservas/:id
  GET    /api/v1/ivi/especialistas
  ```

- [ ] **Integración Webpay**
  - Crear orden de compra
  - Redirigir a pasarela
  - Webhook de confirmación
  - Actualizar estado de reserva

- [ ] **Frontend - Página `/reservas`**
  - Formulario completo (paciente + cita + presupuesto)
  - Calculadora de presupuesto interactiva
  - Flujo de pago integrado
  - Confirmación post-pago

- [ ] **Integración Outlook (API)**
  - Crear evento en calendario médico
  - Sincronización de disponibilidad

**Entregables**:
```bash
# Usuario llena formulario → paga → reserva confirmada
# Email automático al cliente + SMS
# Evento en calendario del médico
```

---

## Fase 5: Pulido y Testing (Semana 8)

### Semana 8: QA y Optimización

**Tareas**:

- [ ] **E2E Testing** con Playwright
  - Flujo completo: chat → presupuesto → reserva → pago
  - Casos edge (validaciones, errores)

- [ ] **Performance**
  - Chat response < 1 segundo (local KB)
  - Claude API < 3 segundos
  - Página carga < 2 segundos

- [ ] **Security**
  - CSRF protection
  - XSS prevention (sanitizar inputs)
  - Rate limiting en endpoints
  - Validación de JWT

- [ ] **Documentation**
  - README con setup
  - API docs con Swagger
  - Troubleshooting

- [ ] **Deployment prep**
  - Dockerfile actualizado
  - Variables de entorno en prod
  - Backups de DB
  - Monitoring setup

**Entregables**:
```bash
npm run build                # Compila sin warnings
npm run lint                 # 0 errores ESLint
npm test                     # 95%+ cobertura
npm run type-check          # 0 TypeScript errors
```

---

## Flujo de Implementación Día a Día

### Por hacer HOY (Semana 1):

```bash
# 1. Crear branch local si no existe
git checkout -b claude/ivi-chile-booking-chatbot-0hfda3

# 2. Crear migrations folder
mkdir -p backend/src/migrations
mkdir -p backend/src/models
mkdir -p backend/src/services
mkdir -p frontend/src/components/ChatBot

# 3. Crear primer archivo
touch backend/src/migrations/20260922_create_chat_sessions.js
```

### Checklist Diario:

- [ ] Pull de cambios remotos
- [ ] Tests pasando localmente
- [ ] Commit antes de dormir
- [ ] Push a rama (sin PR todavía)

---

## Stack por Componente

| Componente | Tech | Archivo |
|---|---|---|
| **DB** | PostgreSQL + Sequelize | `backend/src/migrations/` |
| **Chat API** | Express + TypeScript | `backend/src/routes/chat.ts` |
| **Claude Integration** | Claude SDK | `backend/src/services/ClaudeService.ts` |
| **Widget** | React + TypeScript | `frontend/src/components/ChatbotWidget.tsx` |
| **Reservas** | Express + Sequelize | `backend/src/routes/ivi.ts` |
| **Pagos** | Webpay SDK | `backend/src/services/WebpayService.ts` |
| **Testing** | Jest + Playwright | `**/__tests__/` |

---

## Dependencias a Instalar

```bash
cd trato

# Backend
npm install -w @trato/backend \
  @anthropic-ai/sdk \
  transbank-sdk \
  @microsoft/microsoft-graph-client \
  sendgrid \
  twilio \
  joi \
  winston \
  @sentry/node

# Frontend
npm install -w @trato/frontend \
  zod \
  @hookform/resolvers
```

---

## Validaciones por Fase

### End of Semana 2
```bash
✅ DB migrada
✅ Modelos compilados
✅ .env configurado
✅ docker-compose up working
```

### End of Semana 4
```bash
✅ POST /chat/mensaje funciona
✅ Claude API integrada
✅ KB local retorna respuestas
✅ 10+ unit tests passing
```

### End of Semana 6
```bash
✅ Widget visible en página
✅ Chat persiste en LocalStorage
✅ Conexión a backend OK
✅ Botón "Agendar" redirige a /reservas
```

### End of Semana 8 (MVP Go Live)
```bash
✅ Chat → Presupuesto → Reserva → Pago flujo completo
✅ Webpay integrado
✅ Outlook sincronizado
✅ E2E tests 95%+ passing
✅ Zero errores TypeScript
✅ Listo para producción
```

---

## Próximos Pasos Inmediatos

**Hoy**:
1. ✅ Revisar este plan
2. ⏭️ Crear migraciones DB
3. ⏭️ Crear modelos Sequelize
4. ⏭️ Instalar dependencias

**Mañana**:
- Empezar semana 1: Backend setup

¿Empezamos?
