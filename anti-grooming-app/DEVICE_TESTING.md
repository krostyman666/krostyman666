# Testing en Dispositivos Reales - Taro

Guía completa para testing en dispositivos iOS y Android reales.

---

## 📋 Requisitos Previos

### Para iOS
- **Mac con Xcode 14+** instalado
- **Apple Developer Account** (puede ser gratuita)
- **Dispositivo iPhone/iPad** con iOS 14+
- **Cable USB** para conectar
- **Expo Go app** instalada (opcional, para desarrollo rápido)

### Para Android
- **Dispositivo Android** con Android 8+
- **Cable USB** con modo debug habilitado
- **Android Studio** (opcional pero recomendado)
- **Expo Go app** instalada (opcional)
- **adb** (Android Debug Bridge)

---

## 🔧 Setup Inicial

### Opción A: Usar Expo Go (Rápido, Desarrollo)

**Requisitos mínimos:**
- Dispositivo conectado a WiFi
- Expo Go app instalada
- Misma red WiFi que tu computadora

**Pasos:**

```bash
cd anti-grooming-app

# Instalar Expo CLI
npm install -g expo-cli

# Verificar conexión
expo whoami
# Si no estás logged, ejecuta:
# expo login

# Iniciar servidor
npm run dev:child

# En la terminal, verás un QR code
# Abre Expo Go en tu teléfono y escanea el QR
```

**Ventajas:**
- Rápido de configurar
- Hot reload mientras codificas
- Funciona en WiFi

**Desventajas:**
- No incluye todos los módulos nativos
- Requiere Expo Go app
- Más lento que build nativo

---

### Opción B: Build Nativo con EAS (Producción)

**Requisitos:**
- Cuenta Expo (gratuita)
- Apple Developer Account ($99/año para App Store)
- Certificados configurados

**Pasos:**

```bash
# 1. Login a Expo
npm install -g eas-cli
eas login

# 2. Configurar proyecto
eas build:configure

# 3. Build para desarrollo (iOS)
eas build --platform ios --profile development

# 4. Build para desarrollo (Android)
eas build --platform android --profile development

# 5. Descarga el build completado y instala en tu dispositivo
```

---

## 📱 Setup por Plataforma

### iOS en Dispositivo Real

#### Método 1: Expo Go (10 minutos)

```bash
# En tu Mac
npm run dev:child

# En tu iPhone
1. Abre Expo Go app
2. Escanea QR code que aparece en terminal
3. App carga en segundos
```

#### Método 2: Xcode Build (30 minutos)

```bash
# Crear build para iOS
eas build --platform ios --profile development --local

# (Requiere Xcode + certificados configurados)
```

#### Conexión con iPhone

```bash
# 1. Conecta iPhone con cable USB
# 2. En iPhone: Settings > Developer > Trust Computer
# 3. En Mac: Xcode > Window > Devices and Simulators
# 4. Verifica que el device aparece listado
```

---

### Android en Dispositivo Real

#### Método 1: Expo Go (10 minutos)

```bash
# En tu PC/Mac/Linux
npm run dev:child

# En tu Android
1. Abre Expo Go app
2. Escanea QR code de terminal
3. App carga
```

#### Método 2: adb Install (20 minutos)

```bash
# Habilitar USB Debug en Android
# Settings > About Phone > tap Build Number 7 times
# Settings > Developer Options > Enable USB Debugging

# Conectar dispositivo
adb devices

# Crear APK
eas build --platform android --profile development

# Instalar
adb install app.apk
```

#### Conexión con Android

```bash
# Verificar que el device está conectado
adb devices

# Ver logs
adb logcat

# Reinstalar app
adb reinstall app.apk

# Borrar datos
adb shell pm clear com.taro.child
```

---

## 🧪 Testing Manual en Dispositivo Real

### Fase 1: Instalación y Setup (5 min)

**Paso 1: Instalar app del hijo**
- [ ] App abre correctamente
- [ ] No crashea al inicio
- [ ] Muestra pantalla de setup
- [ ] Se ve bien en pantalla completa

**Paso 2: Generar código de emparejamiento**
- [ ] Pantalla muestra código de 6 caracteres
- [ ] Código es legible
- [ ] Instrucciones son claras

---

### Fase 2: Emparejamiento (10 min)

**En dispositivo del hijo:**
- [ ] Código visible en pantalla
- [ ] Botón "Emparejamiento confirmado" accesible
- [ ] No hay errores al presionar

**En dispositivo del padre:**
- [ ] Campo de código acepta entrada
- [ ] Campo de nombre acepta entrada
- [ ] Botón "Emparejar" es accesible
- [ ] Se muestra feedback mientras empareja

**Después de emparejar:**
- [ ] Ambas apps muestran éxito
- [ ] Datos se guardan localmente
- [ ] Ambos dispositivos navegan a home

---

### Fase 3: Monitoreo Básico (15 min)

**En dispositivo del hijo:**
- [ ] Pantalla home es visible
- [ ] Indicador de estado muestra "Monitoreo activo"
- [ ] Contadores muestran 0 alertas/eventos
- [ ] Botón 🧪 testing es accesible (si está en dev)

**Simular primer intento de grooming:**
- [ ] Selecciona mensaje de prueba en testing tools
- [ ] App procesa sin crashear
- [ ] Contador de alertas incrementa a 1
- [ ] Se genera la alerta localmente

**En dispositivo del padre:**
- [ ] Home se abre sin errores
- [ ] Verifica disponibilidad de datos del hijo
- [ ] Nueva alerta aparece en lista
- [ ] Alerta muestra severidad correcta

---

### Fase 4: Interacción de Alertas (10 min)

**En padre, revisar alerta:**
- [ ] Presionar alerta abre detalles
- [ ] Se ve título, descripción, severidad
- [ ] Timestamp es correcto
- [ ] Evidencia se muestra correctamente

**Marcar como revisada:**
- [ ] Botón "Marcar como revisado" funciona
- [ ] Alerta cambia de color (azul → blanco)
- [ ] Contador de no-revisadas decrementa
- [ ] Cambio se guarda localmente

---

### Fase 5: Performance y Estabilidad (20 min)

**Generar múltiples alertas:**
- [ ] Genera 10 alertas en el hijo
- [ ] Padre sincroniza todas
- [ ] No hay lag perceptible
- [ ] No crashea con muchas alertas

**Monitor de memoria (en desarrollo):**

```bash
# En Android
adb shell dumpsys meminfo com.taro.child

# En iOS (en Xcode)
# Debug > View Memory Graph
```

**Esperado:**
- Memoria en reposo: ~80-120MB
- Después de 10 alertas: ~150-200MB
- Sin memory leaks (aumenta pero no infinito)

**Prueba de batería (1 hora):**
- [ ] Inicia con 100%
- [ ] Monitoreo en background
- [ ] Genera 20 alertas
- [ ] Final: >90% (menos de 10% consumido)

---

### Fase 6: Permisos (15 min)

**iOS:**

```bash
# Verificar permisos en Settings
Settings > [App Name] > Permissions
```

- [ ] Contactos: Solicita y otorga
- [ ] Ubicación: Solicita y otorga
- [ ] Notificaciones: Solicita y otorga

**Android:**

```bash
# Verificar permisos
adb shell pm list permissions -d
adb shell pm grant com.taro.child android.permission.READ_CONTACTS
adb shell pm grant com.taro.child android.permission.ACCESS_FINE_LOCATION
```

- [ ] Contactos: Solicita y otorga
- [ ] Ubicación: Solicita y otorga
- [ ] Notificaciones: Solicita y otorga

---

## 🔍 Debugging en Dispositivo Real

### iOS

**Ver logs en Xcode:**

```bash
# Conectar iPhone a Mac
# Xcode > Window > Devices and Simulators
# Seleccionar dispositivo
# Ver logs en panel inferior
```

**Via terminal:**

```bash
# Ver logs directamente
log stream --predicate 'process == "Taro"'
```

**Usar React Native debugger:**

```bash
# En terminal con app ejecutando
expo start --dev-client

# En app, agitar dispositivo
# Seleccionar "Debug Remote JS"
```

---

### Android

**Ver logs:**

```bash
# Ver todos los logs
adb logcat

# Filtrar por app
adb logcat | grep "Taro"

# Guardar a archivo
adb logcat > logs.txt
```

**Android Studio Logcat:**

```bash
# Abrir Android Studio
# Connect > Select device
# View > Tool Windows > Logcat
```

**React Native Debugger:**

```bash
# Agitar dispositivo o presionar Ctrl+M
# Seleccionar "Debug Remote JS"
```

---

## 📊 Casos de Testing en Real

### Caso 1: Notificaciones Interceptadas

**En padre, esperando:**
- [ ] Enviar mensaje de prueba al hijo
- [ ] Notificación aparece en hijo
- [ ] Se analiza automáticamente
- [ ] Alerta aparece en padre

```bash
# Simular notificación con adb
adb shell am start -a android.intent.action.VIEW \
  -d "exp://localhost:19000"
```

---

### Caso 2: Contacto Desconocido

**En hijo:**
- [ ] Abre app de Contactos
- [ ] Agrega nuevo contacto
- [ ] Vuelve a Taro
- [ ] (Si se detecta) alerta de contacto nuevo

```bash
# Verificar permisos de contactos
adb shell pm grant com.taro.child android.permission.READ_CONTACTS
```

---

### Caso 3: Ubicación

**En hijo:**
- [ ] Abre Google Maps
- [ ] Navega a una ubicación
- [ ] Vuelve a Taro
- [ ] (Si coincide con zona de riesgo) alerta de ubicación

```bash
# Simular ubicación en Android
adb shell am startservice \
  -a com.example.mock_location \
  --es latitude "40.7128" \
  --es longitude "-74.0060"
```

---

### Caso 4: Background Task

**En iOS:**

```bash
# Force background
1. Home button
2. Swipe up (cerrar app)
3. Esperar 15 minutos
4. Abrir app
5. Verificar que tarea de background completó
```

**En Android:**

```bash
# Force background
adb shell input keyevent 3  # Home
# Esperar 15 minutos
adb shell am start -n com.taro.child/.MainActivity
```

---

## ✅ Checklist de Testing Final

### Funcionalidad
- [ ] Emparejamiento exitoso en ambos dispositivos
- [ ] Alertas se generan correctamente
- [ ] Sincronización funciona
- [ ] Permisos se solicitan apropiadamente
- [ ] Background task ejecuta
- [ ] Notificaciones se envían

### Performance
- [ ] <200MB memoria en uso
- [ ] <10% batería/hora
- [ ] <500ms para generar alerta
- [ ] <2s para sincronizar

### Estabilidad
- [ ] 0 crasheos en 50+ intentos
- [ ] No hay memory leaks
- [ ] Recovery después de background
- [ ] Datos persistidos correctamente

### Seguridad
- [ ] Datos encriptados localmente
- [ ] No se envía a servidores no autorizados
- [ ] Permisos respetados
- [ ] Datos se pueden borrar

### UX/UI
- [ ] UI es legible en real device
- [ ] Botones son accesibles
- [ ] Texto no está cortado
- [ ] Colores son visibles en luz solar

---

## 🐛 Troubleshooting en Real Device

### App no inicia en Expo Go

```bash
# Limpiar cache
expo prebuild --clean
npm start -- --clear

# Verificar versión
expo --version
npm list expo-router
```

### Conectividad WiFi no funciona

```bash
# Verificar conexión
ping 192.168.x.x  # IP del simulador

# Ver IP local
ifconfig (Mac/Linux)
ipconfig (Windows)
```

### Permisos no se solicitan

```bash
# Android: Resetear permisos
adb shell pm reset-permissions

# iOS: Desinstalar app
# Ir a Settings > [App] > Remove App
# Reinstalar
```

### Memory leak detectado

```bash
# Android: Dump heap
adb shell dumpsys meminfo --unreachable

# iOS: Use Xcode Memory Graph
# Debug > View Memory Graph
```

### Background task no ejecuta

```bash
# iOS: Verificar en Settings > Developer
# Android: Verificar Work Manager
adb shell dumpsys jobscheduler

# Forzar ejecución de tarea
eas build --platform [platform] --profile development
```

---

## 📝 Reporte de Testing

Después de testing, completa este reporte:

```markdown
# Reporte de Testing - Taro

**Fecha:** [fecha]
**Tester:** [nombre]
**Dispositivos:** iPhone X (iOS 17) + Pixel 6 (Android 14)

## Resultado General
- [ ] ✅ PASS
- [ ] ⚠️ PASS CON ISSUES
- [ ] ❌ FAIL

## Funcionalidad
| Feature | iOS | Android | Status |
|---------|-----|---------|--------|
| Setup   | ✅  | ✅      | PASS   |
| Alertas | ✅  | ⚠️      | ISSUE  |

## Performance
| Métrica | Esperado | Real | Status |
|---------|----------|------|--------|
| Memoria | <200MB   | 150MB| ✅     |
| Batería | <10%/h   | 8%/h | ✅     |

## Issues Encontrados
1. [Descripción del issue]
   - Pasos para reproducir
   - Severidad: HIGH/MEDIUM/LOW
   - Acción: [Reportar/Fix/Ignore]

## Notas
[Cualquier observación adicional]
```

---

## 🚀 Próximos Pasos Después de Testing

1. **Si PASS:** Proceder a App Store/Play Store submission
2. **Si ISSUES:** Crear tickets en backlog y revisar
3. **Performance:** Optimizar si es necesario
4. **Security:** Pasar a security audit

---

**Última actualización:** 2026-09-22
**Estado:** Listo para testing en dispositivos reales
