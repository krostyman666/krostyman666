# Testing Guide - Taro

Guía completa para testing local de Taro.

---

## 🏁 Quick Start Testing

### Requisitos
- Node.js 18+
- Expo CLI instalado
- Dos dispositivos (simulador + simulador, o dispositivos reales)

### Setup Rápido

```bash
cd anti-grooming-app
npm install

# Terminal 1: App del hijo
npm run dev:child

# Terminal 2: App del padre (en otro puerto)
npm run dev:parent
```

---

## 📱 Testing Manual - Escenario Completo

### Fase 1: Emparejamiento

**Dispositivo Hijo:**
1. Abre la app
2. Verás un código de 6 caracteres (ej: `ABC123`)
3. Copia ese código

**Dispositivo Padre:**
1. Abre la app
2. Ingresa el código del hijo en el campo "Código de emparejamiento"
3. Ingresa un nombre para el hijo (ej: "Juan")
4. Presiona "Emparejar dispositivo"

**Resultado esperado:**
- Ambas apps muestran "Emparejado exitosamente"
- Panel del padre muestra el dispositivo bajo "Dispositivos emparejados"

---

### Fase 2: Prueba de Monitoreo (Herramientas de Testing)

**En la app del hijo:**
1. Ve a la pantalla "Home"
2. Busca el botón 🧪 flotante en la esquina inferior derecha
3. Presiona para abrir "Herramientas de Testing"

**Simular un intento de grooming:**
1. Selecciona una de los mensajes de prueba:
   - "Eres muy especial, nadie te entiende como yo"
   - "No le digas a tus padres que nos hablamos"
   - "Envíame una foto sin ropa"
   - Etc.

**Resultado esperado:**
- Se crea una alerta en la app del hijo
- El contador de alertas incrementa
- En el padre, aparece una nueva alerta con severidad alta/crítica

---

### Fase 3: Revisar Alertas (Padre)

**En la app del padre:**
1. Abre "Home" (Panel de Control)
2. Verás un badge rojo mostrando el número de alertas nuevas
3. Presiona en una alerta para verla en detalle
4. Presiona "Marcar como revisado"

**Resultado esperado:**
- Alerta cambia de azul claro a blanco
- Se elimina del contador de "nuevas"
- Timestamp muestra la hora exacta

---

## 🧪 Casos de Testing

### Caso 1: Grooming Progresivo

Secuencia de mensajes simulando escalada:

```
Momento 1: "Te entiendo como nadie"
Momento 2: "Eres muy especial para mí"
Momento 3: "No le digas a tus papás"
Momento 4: "Envíame una foto"
Momento 5: "Nos vemos en secreto"
```

**Verificar:**
- Cada mensaje genera una alerta
- La severidad incrementa
- El padre recibe todas las alertas

---

### Caso 2: Contacto Desconocido

**En la app del hijo:**
1. Ve a Settings
2. Verifica que haya 0 contactos desconocidos monitoreados
3. En Testing Tools, simula un nuevo contacto desconocido

**Verificar:**
- Se genera una alerta tipo "contact_unknown"
- El padre ve la alerta con severidad "medium"

---

### Caso 3: Sincronización Padre-Hijo

**Escenario:**
1. Genera 5 alertas en el hijo
2. Espera 5 segundos
3. Abre la app del padre
4. Recarga la pantalla

**Verificar:**
- Todas las alertas aparecen en el padre
- Los timestamps son consistentes
- Las severidades se mantienen

---

## 📊 Testing de Performance

### Memoria

```bash
# En el simulador de iOS
# Xcode > Debug > View Memory Graph (durante app uso)

# En Android
# Android Studio > Profiler > Memory
```

**Métricas esperadas:**
- Inicio: ~50MB
- Después de 10 alertas: ~80MB
- Después de limpieza: vuelve a ~50MB

### Batería

**En dispositivo real (1 hora de testing):**
1. Inicia con 100% de batería
2. Ejecuta monitoreo de fondo
3. Genera 20 alertas
4. Verifica consumo

**Esperado:** <10% de batería consumida

### CPU

**Durante monitoreo:**
- Sin análisis activo: <5% CPU
- Analizando texto: <15% CPU pico
- En reposo: cercano a 0%

---

## 🔍 Testing de Seguridad

### Encriptación E2E

```bash
# En la carpeta shared/lib/encryption
npm test  # Cuando haya test suite

# Verificar manualmente:
# 1. Generar dos pares de keys
# 2. Encriptar un mensaje con key A
# 3. Desencriptar con key B (debe fallar)
# 4. Desencriptar con key A (debe funcionar)
```

### Permisos

**Denied Permissions:**
1. Ve a Settings del sistema iOS/Android
2. Niega permisos para la app
3. Intenta usar funcionalidad
4. Debería mostrar error amable

**Verificar:**
- Contactos negado → No se puede monitorear contactos
- Ubicación negada → No se puede monitorear ubicación
- Notificaciones negadas → No se envían alertas

---

## 🐛 Debugging

### Enable Console Logging

En `_layout.tsx`:
```typescript
if (__DEV__) {
  console.log('Debug mode enabled');
}
```

### React Navigation Debugging

```typescript
import { NavigationContainer } from '@react-navigation/native';

<NavigationContainer
  onReady={() => {
    console.log('Navigation ready');
  }}
  onStateChange={() => {
    console.log('Navigation state changed');
  }}
>
```

### LocalStorage Inspection

```typescript
import { LocalStorage } from '@anti-grooming/shared';

async function dumpStorage() {
  const alerts = await LocalStorage.getAlerts();
  const events = await LocalStorage.getMonitoringEvents();
  console.log('Alerts:', alerts);
  console.log('Events:', events);
}
```

---

## ✅ Checklist Antes de Producción

- [ ] Testing en dispositivo iOS real
- [ ] Testing en dispositivo Android real
- [ ] Permisos funcionando en ambas plataformas
- [ ] Background task completando exitosamente
- [ ] Notificaciones siendo entregadas
- [ ] Sin crasheos en 100+ iteraciones
- [ ] <10% batería/hora
- [ ] Sincronización consistente
- [ ] Security review completado
- [ ] Legal review completado

---

## 📞 Troubleshooting

### App no empareja
- Verifica que ambos dispositivos sean simultaneos
- Limpia AsyncStorage: Settings > Eliminar todos los datos
- Reinicia ambas apps

### Alertas no aparecen en padre
- Verifica que dispositivos están emparejados
- Recarga la app del padre
- Revisa console logs

### Permisos no solicita
- Reinicia la app
- Ve a Settings > Permisos y otorga permisos manualmente
- En Android, puede requerir reinicio

### Background task no ejecuta
- En iOS: requiere ser agregar a App Store
- En Android: requiere permisos específicos
- Verificar en `BackgroundService.ts`

---

## 📝 Ejemplos de Prueba

### Test Message Injector

```typescript
// En testing tools
const testMessages = [
  'Eres muy especial',
  'Nadie te creería',
  'Envíame foto',
  'Manda dinero',
  'Nos vemos hoy'
];

testMessages.forEach(msg => {
  monitoringService.analyzeText(msg, 'test');
});
```

### Alert Generator

```typescript
// Generar alertas por tipo
const types = [
  'keyword_detected',
  'contact_unknown',
  'location_suspicious',
  'app_installed'
];
```

---

**Última actualización**: 2026-09-22
**Próxima revisión**: Después de testing en dispositivos reales
