# Taro - Aplicación Anti-Grooming

Una aplicación móvil multiplataforma (iOS/Android) diseñada para proteger a menores de edad contra el grooming y el abuso en línea. La app funciona localmente sin necesidad de servidor central, utilizando encriptación end-to-end entre dispositivos.

## 🛡️ Características

- **Detección de patrones**: Identifica patrones de grooming, solicitudes de fotos inapropiadas, aislamiento social y otras conductas de riesgo
- **Alertas en tiempo real**: Notificaciones inmediatas a los padres cuando se detectan actividades sospechosas
- **Encriptación local**: Toda la comunicación y datos se almacenan encriptados en los dispositivos
- **Sin acceso a contenido privado**: Los dispositivos no pueden leer mensajes de apps encriptadas (WhatsApp, Signal, etc.), solo detectar patrones en metadatos
- **Emparejamiento seguro**: Sistema de pairing con código único entre dispositivo del padre y del hijo
- **Almacenamiento local**: Sin sincronización a servidores externos, máxima privacidad

## 📱 Arquitectura

```
anti-grooming-app/
├── apps/
│   ├── parent/        # App del padre/madre (iOS + Android)
│   └── child/         # App del hijo/a (iOS + Android)
├── shared/            # Código compartido
│   ├── lib/
│   │   ├── encryption/  # Encriptación E2E (libsodium)
│   │   ├── patterns/    # Base de palabras clave y patrones
│   │   └── storage/     # Almacenamiento local
│   └── types/           # Tipos TypeScript compartidos
└── eas.json          # Configuración Expo EAS Builds
```

## 🚀 Inicio Rápido

### Requisitos Previos

- **Node.js 18+** - Descargar desde [nodejs.org](https://nodejs.org)
- **npm o yarn** - Incluido con Node.js
- **Expo CLI** - `npm install -g expo-cli`
- **Xcode 14+** (solo para iOS)
- **Android Studio** (solo para Android)

### Instalación

```bash
# Clonar repo
git clone https://github.com/tu-usuario/krostyman666.git
cd krostyman666/anti-grooming-app

# Instalar dependencias del monorepo
npm install

# (Opcional) Instalar expo-cli globalmente si no lo has hecho
npm install -g expo-cli
```

### Desarrollo Local

**Terminal 1 - App del hijo:**
```bash
npm run dev:child
# Luego presiona:
# 'i' para iOS simulator
# 'a' para Android emulator
# 'w' para web (no todas las features disponibles)
```

**Terminal 2 - App del padre (en paralelo):**
```bash
npm run dev:parent
# Mismo: 'i', 'a', 'w'
```

**Resultado esperado:**
- App del hijo muestra un código de 6 caracteres para emparejamiento
- App del padre lista campos para ingresar ese código
- Puedes ver "Herramientas de Testing" en la esquina inferior derecha del hijo

### Build para Producción (EAS)

```bash
# Primero, login a tu cuenta Expo
eas login

# Android
npm run build:child --android
npm run build:parent --android

# iOS (requiere Apple Developer Account)
npm run build:child --ios
npm run build:parent --ios
```

**Nota:** Los builds requieren EAS CLI y cuentas configuradas en Expo.

## 🔐 Seguridad

### Encriptación

- **Algoritmo**: libsodium.js (NaCl)
- **Curva**: Elliptic Curve
- **Nonce único**: Para cada mensaje
- **Keys**: Generadas localmente, nunca transmitidas

### Almacenamiento

- Todas las alertas y eventos se guardan en AsyncStorage encriptado
- Las claves de encriptación nunca salen del dispositivo
- Posibilidad de limpiar datos locales en cualquier momento

## 📊 Patrones Detectados

### Categorías de Riesgo

1. **Aislamiento** (High)
   - "nadie te creería"
   - "es nuestro secreto"
   - "no le digas a tus padres"

2. **Grooming** (Medium-High)
   - "eres especial"
   - "te entiendo como nadie"
   - "eres muy maduro para tu edad"

3. **Contenido Sexual** (Critical)
   - Solicitudes de fotos sin ropa
   - Lenguaje sexual explícito

4. **Explotación** (High)
   - Solicitudes de dinero
   - "si me amas me das"
   - Control emocional

5. **Encuentros** (High)
   - "nos vemos"
   - "te recojo"
   - Coordinación de locaciones

## ⚙️ Configuración

### Variables de Entorno

```env
# En .env (no incluir en git)
NODE_ENV=development
```

### app.json (Por app)

Cada app tiene su propio `app.json`:
- `apps/child/app.json` - Configuración para dispositivo del hijo
- `apps/parent/app.json` - Configuración para dispositivo del padre

## 📝 API Compartida

### Encriptación
```typescript
import { 
  generateKeyPair, 
  encryptMessage, 
  decryptMessage 
} from '@anti-grooming/shared';
```

### Patrones
```typescript
import { 
  searchKeywords, 
  getRiskScore, 
  getHighestSeverity 
} from '@anti-grooming/shared';
```

### Almacenamiento
```typescript
import { LocalStorage } from '@anti-grooming/shared';

// Guardar alerta
await LocalStorage.saveAlert(alert);

// Obtener alertas sin revisar
const unreviewed = await LocalStorage.getUnreviewedAlerts();
```

## 🧪 Testing

### Verificación Local

```bash
# Type-checking
npm run type-check

# Linting (cuando esté configurado)
npm run lint -w @trato/backend
```

### Testing Manual

Consulta [TESTING.md](./TESTING.md) para:
- Escenario completo padre-hijo
- Casos de testing específicos
- Performance benchmarks
- Debugging guide
- Troubleshooting

### Simulación de Grooming

En la app del hijo, usa el botón 🧪 en la esquina inferior derecha para:
- Simular intentos de grooming predefinidos
- Inyectar textos personalizados
- Ver alertas generadas en tiempo real

## 📚 Documentación

- [Tipos TypeScript](./shared/types/index.ts)
- [Encriptación](./shared/lib/encryption/crypto.ts)
- [Patrones de Grooming](./shared/lib/patterns/keywords.ts)
- [Almacenamiento Local](./shared/lib/storage/index.ts)

## ⚠️ Limitaciones Técnicas

1. **No puede leer mensajes encriptados**: Apps como WhatsApp usan E2E, imposible de interceptar
2. **Metadatos solo**: Se pueden detectar patrones en quién habla con quién, cuándo, pero no el contenido de mensajes E2E
3. **Requiere permiso de instalación**: El hijo/a puede desinstalar la app
4. **Un dispositivo por rol**: Actualmente cada padre/madre puede monitorear a un hijo/a (extensible)

## 🔄 Flujo de Emparejamiento

1. **App del hijo genera**: Código de 6 caracteres único
2. **Padre ingresa código**: En su app
3. **Intercambio de keys**: Se comparten públicamente, se encripta privado
4. **Emparejamiento confirmado**: Ambos dispositivos guardan la pareja localmente

## 🛠️ Próximas Prioridades

Consulta [ROADMAP.md](./ROADMAP.md) para el plan completo.

### Inmediatas (0.2.0 - Próximas 2-4 semanas)

- [x] Servicios de background (expo-background-fetch)
- [x] Notificaciones interceptadas
- [x] Integración de contactos
- [x] Análisis de ubicación
- [ ] Testing en dispositivos reales
- [ ] Sincronización en tiempo real (WebSocket/BLE)
- [ ] Performance optimization

### Futuro (0.3.0+)

- [ ] Machine Learning para patrones
- [ ] Panel web para padres
- [ ] Sincronización a nube (opcional)
- [ ] Multiidioma
- [ ] Multi-hijo por padre

## 📄 Licencia

Privado - No distribuir sin consentimiento

## 👨‍⚖️ Consideraciones Legales

Esta app está diseñada como herramienta de control parental legítimo. Consulta con abogado sobre leyes locales de privacidad antes de distribuir o usar en producción.

## 📧 Contacto

Para reportar vulnerabilidades de seguridad o sugerencias: [Tu email]

---

**Nota**: Esta es una aplicación en desarrollo. No se garantiza seguridad total. Úsala como complemento a supervisión activa y educación digital con tus hijos.
