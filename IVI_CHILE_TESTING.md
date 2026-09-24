# 🧪 Guía de Testing - IVI Chile Chatbot

**Estado**: MVP Listo para probar (Frontend + Backend)

---

## 1. Setup Rápido

### Paso 1: Configurar .env

```bash
cd trato
cp .env.example .env
```

**Agregar las siguientes variables**:
```bash
# Existentes
DATABASE_URL=postgresql://user:password@localhost:5432/trato
JWT_SECRET=your-secret-key-here

# Nuevas para IVI
CLAUDE_API_KEY=sk-...  # Tu API key de Claude
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Paso 2: Levantar Base de Datos

```bash
npm run db:up
```

Esto levanta PostgreSQL en Docker. Verificar con:
```bash
docker ps | grep postgres
```

### Paso 3: Instalar Dependencias

```bash
npm install
```

---

## 2. Ejecutar en Desarrollo

### Terminal 1 - Backend (Puerto 3001)
```bash
npm run dev -w @trato/backend
```

**Esperar hasta ver**:
```
✅ Trato API escuchando en http://localhost:3001
```

Verificar health:
```bash
curl http://localhost:3001/health
```

### Terminal 2 - Frontend (Puerto 3000)
```bash
npm run dev -w @trato/frontend
```

**Esperar hasta ver**:
```
▲ Next.js started
- Local: http://localhost:3000
```

---

## 3. Probar el Chatbot

### Opción A: En el Navegador (Recomendado)

1. Abre http://localhost:3000
2. Busca el botón flotante azul 💬 abajo a la derecha
3. Haz clic para abrir
4. Ingresa tu email
5. Prueba estos mensajes:

**Casos de prueba**:
```
1. "¿Hacen congelación de óvulos?" 
   → Debe responder con FAQ local

2. "¿Cuál es la edad máxima para hacer FIV?"
   → Debe encontrar en KB

3. "Tengo 38 años y soy pareja del mismo sexo, ¿puedo hacer FIV?"
   → Debe consultar Claude API (respuesta personalizada)

4. "¿Cuánto cuesta una consulta?"
   → FAQ: debe mencionar $150.000

5. "Quiero agendar una consulta"
   → Debe sugerir botón "Agendar consulta"
```

### Opción B: Con cURL (Backend Only)

```bash
# Test 1: Mensaje simple (en KB)
curl -X POST http://localhost:3001/api/v1/chat/mensaje \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@ivi.cl",
    "mensaje": "¿Hacen congelación de óvulos?"
  }'

# Esperado: respuesta de FAQ + sessionId

# Test 2: Consultar sesión
SESSION_ID="<id-del-test-anterior>"
curl http://localhost:3001/api/v1/chat/sesion/$SESSION_ID

# Test 3: Estadísticas
curl http://localhost:3001/api/v1/chat/stats

# Test 4: Leads hot
curl http://localhost:3001/api/v1/chat/leads/hot
```

---

## 4. Verificar Scoring

### Test: Lead Score automático

Después de enviar varios mensajes en el widget, verificar:

```bash
# Obtener sesión y revisar leadScore
curl http://localhost:3001/api/v1/chat/sesion/YOUR_SESSION_ID | jq '.leadScore'
```

**Esperado**:
- 1-2 mensajes: ~20-30 (cold)
- 3-5 mensajes con palabras clave: ~50-70 (warm)
- 5+ mensajes + datos completados: ~70+ (hot)

---

## 5. Datos de Prueba Predeterminados

### FAQ Disponibles (13 temas)

✅ Congelación de óvulos  
✅ Cobertura Fonasa  
✅ FIV básico  
✅ Inseminación artificial  
✅ Edad máxima  
✅ Parejas del mismo sexo  
✅ Dolor y riesgos  
✅ Licencia laboral  
✅ Tasa de éxito  
✅ Si no funciona  
✅ Valores consulta  
✅ Financiamiento  
✅ Ubicación  

### Presupuestos Disponibles

```
1. Consulta Inicial
   Base: $150.000
   + Batería hormonal: $80.000
   + Ecografía: $120.000

2. Congelación de Óvulos
   Base: $850.000
   + Almacenamiento anual: $15.000

3. FIV Completo
   Base: $1.200.000
   + PGD: $300.000
   + ICSI: $200.000

4. Inseminación Artificial
   Base: $600.000
   + Preparación de semen: $150.000
```

---

## 6. Troubleshooting

### Error: "CLAUDE_API_KEY no configurada"

```bash
# Verificar en .env
echo $CLAUDE_API_KEY

# Si está vacío, agregar en .env:
CLAUDE_API_KEY=sk-...
```

### Error: "Cannot connect to database"

```bash
# Verificar que Docker está corriendo
docker ps

# Levantar containers
npm run db:up

# Verificar conexión
psql postgresql://user:password@localhost:5432/trato
```

### Widget no aparece en frontend

```bash
# Verificar que está importado en layout.tsx
grep "ChatbotWidget" trato/frontend/src/app/layout.tsx

# Si no está, ejecutar:
git checkout trato/frontend/src/app/layout.tsx

# Recargar página (Ctrl+Shift+R)
```

### Backend responde lentamente

```bash
# Verificar si CLAUDE_API_KEY es válida
curl -X POST http://localhost:3001/api/v1/chat/mensaje \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ivi.cl","mensaje":"hola"}'

# Si tarda >3s, revisar logs del backend
```

---

## 7. Checklist de Pruebas Completas

### Funcionalidad
- [ ] Widget abre/cierra
- [ ] Puedo escribir mensajes
- [ ] Respuestas aparecen en tiempo real
- [ ] Sesión persiste en localStorage
- [ ] Email se guarda
- [ ] Nombre se guarda (opcional)
- [ ] Edad se guarda (opcional)

### Knowledge Base
- [ ] FAQ responden correctamente (13 temas)
- [ ] Presupuestos se muestran cuando pregunta por precio
- [ ] Claude API responde para preguntas complejas
- [ ] Scoring sube con más mensajes

### Lead Scoring
- [ ] Lead score comienza en 0
- [ ] Datos completados suman puntos (+25)
- [ ] Palabras clave suman puntos (+50)
- [ ] Engagement suma puntos (+25)
- [ ] Status: cold → warm → hot según score

### Integración
- [ ] Frontend conecta a backend sin errores
- [ ] No hay CORS errors
- [ ] LocalStorage funciona
- [ ] Sesión se recupera después de refresh

---

## 8. Próximos Pasos

Después de validar estas pruebas, pasar a:

1. **Sistema de Reservas** (8 horas)
   - POST /api/v1/ivi/reservas
   - Integración Webpay
   - Página /reservas

2. **Integración Outlook** (4 horas)
   - Sincronizar disponibilidad
   - Crear eventos automáticamente

3. **Dashboard Ejecutivo** (4 horas)
   - Métricas en tiempo real
   - Estadísticas de leads

---

**Rama**: `claude/ivi-chile-booking-chatbot-0hfda3`  
**Última actualización**: 22 de septiembre de 2026  
**Estado**: MVP Ready 🚀
