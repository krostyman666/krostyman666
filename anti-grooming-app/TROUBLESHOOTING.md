# Troubleshooting - Taro

Solución de problemas comunes durante desarrollo y testing.

---

## 📱 Problemas de Conectividad

### Problema: "Unable to resolve module" con Expo

**Síntoma:** Error en console sobre módulo no encontrado

```
Unable to resolve module `@react-navigation/native`
```

**Solución:**

```bash
# Limpiar cache
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules
npm install

# Reiniciar Expo
expo start --clear
```

---

### Problema: QR code en Expo Go no funciona

**Síntoma:** Escanear QR no carga la app

**Causas comunes:**
1. Dispositivo y computadora no en la misma WiFi
2. Firewall bloqueando conexión
3. Versión de Expo incompatible

**Solución:**

```bash
# Verificar WiFi
# iPhone: Settings > WiFi
# Android: Settings > Network > WiFi

# Usar conexión por IP local
expo start

# Si falla, usar tunnel
expo start --tunnel

# Verificar versión
expo --version
npm list expo

# Actualizar si es necesario
npm install -g expo-cli@latest
```

---

### Problema: "Connection timeout" al conectar

**Síntoma:** App no se carga desde QR code

```
Connection timeout after 30 seconds
```

**Solución:**

```bash
# Reiniciar WiFi en ambos dispositivos
# En iPhone: Settings > WiFi > Desconectar > Reconectar
# En Android: Settings > WiFi > Turn Off > Turn On

# Reiniciar router
# Apagar por 30 segundos, volver a encender

# Usar tunnel en lugar de LAN
expo start --tunnel

# Verificar firewall
# Asegurar que puerto 19000-19006 está abierto
```

---

## 🔧 Problemas de Permisos

### Problema: App pide permisos indefinidamente

**Síntoma:** Cada vez que abre, solicita los mismos permisos

**Solución (iOS):**

```bash
# Settings > [App Name] > Permissions
# Dar permisos manualmente

# O reinstalar app
# Home button 2x > Swipe up para cerrar
# Ir a Settings > iPhone Storage > [App] > Uninstall
# Reinstalar
```

**Solución (Android):**

```bash
# Resetear permisos globalmente
adb shell pm reset-permissions

# O denegar y otorgar de nuevo
# Settings > Apps > [App] > Permissions
# Denegar todos
# Abrir app de nuevo y dar permisos

# O desinstalar y reinstalar
adb uninstall com.taro.child
```

---

### Problema: Permisos de Contactos no funciona

**Síntoma:** ContactsService retorna array vacío

**Solución:**

```bash
# iOS
# Settings > [App] > Contacts > Allow Access

# Android
adb shell pm grant com.taro.child android.permission.READ_CONTACTS
adb shell pm grant com.taro.child android.permission.WRITE_CONTACTS

# Reiniciar app
```

---

### Problema: Permiso de Ubicación siempre retorna null

**Síntoma:** LocationService no retorna coordenadas

**Solución:**

```bash
# iOS
# Settings > [App] > Location > "While Using" o "Always"

# Android
# Simular ubicación en Developer Options
# adb shell am startservice -a com.example.mock_location

# Verificar que GPS está habilitado
# Android: Settings > Location > GPS
```

---

## 💾 Problemas de Almacenamiento

### Problema: AsyncStorage no persiste datos

**Síntoma:** Alertas se pierden después de cerrar app

**Solución:**

```bash
# Verificar que LocalStorage se está usando
// En el código
import { LocalStorage } from '@anti-grooming/shared';
await LocalStorage.saveAlert(alert);

# iOS: Verificar que app no se limpia
# Settings > [App] > App Clips > Don't Allow Removing

# Android: Verificar almacenamiento
adb shell pm grant com.taro.child android.permission.WRITE_EXTERNAL_STORAGE
adb shell pm grant com.taro.child android.permission.READ_EXTERNAL_STORAGE

# Verificar espacio disponible
adb shell df -h

# Si está lleno, limpiar
adb shell pm clear com.taro.child
```

---

### Problema: "No space left on device"

**Síntoma:** No se pueden guardar nuevas alertas

```
Error: No space left on device
```

**Solución:**

```bash
# Verificar espacio
adb shell df -h

# Limpiar caché de Expo
expo prebuild --clean

# Limpiar caché de npm
npm cache clean --force

# En dispositivo, limpiar datos de app
adb shell pm clear com.taro.child

# Desinstalar y reinstalar
adb uninstall com.taro.child
npm run build:child
```

---

## 🚀 Problemas de Performance

### Problema: App se congela al generar alertas

**Síntoma:** UI se congela por 2-3 segundos

**Causa:** Análisis de texto sincrónico

**Solución:**

```typescript
// En monitoringService.ts, usar worker
// Implementar análisis en worker thread
const worker = new Worker('analyzer.worker.js');
worker.postMessage({ text: message });
```

---

### Problema: Memory leak detectado

**Síntoma:** Memoria aumenta constantemente, no se libera

**Debugging (iOS):**

```bash
# En Xcode
# Product > Scheme > Edit Scheme
# Run > Diagnostics > Enable "Memory Management"
# Ejecutar app y ver Memory Graph
```

**Debugging (Android):**

```bash
# En Android Studio
# View > Tool Windows > Profiler
# Memory tab
# Ver si hay objects que no se liberan

# Desde línea de comandos
adb shell dumpsys meminfo com.taro.child --unreachable
```

**Soluciones comunes:**

```typescript
// Limpiar listeners cuando componente se desmonta
useEffect(() => {
  const unsubscribe = monitoringService.onAlert(callback);
  return () => unsubscribe(); // ← Importante!
}, []);

// Evitar closures que mantienen referencias
const handleAlert = useCallback((alert) => {
  // ...
}, []);
```

---

### Problema: Battery drain muy alto

**Síntoma:** Batería se consume más de 15% en 1 hora

**Causas comunes:**
1. Background task ejecutándose muy frecuentemente
2. GPS siempre activado
3. Logs excesivos

**Solución:**

```bash
# Verificar task de background
# En background.ts, el intervalo mínimo es 15 minutos

# Verificar GPS
# LocationService debe estar en modo "balanced"

# Reducir logs
// En producción, comentar console.log
if (__DEV__) {
  console.log('Debug info');
}

# Profile en dispositivo real
# iOS: Xcode > Product > Profile > Energy Impact
# Android: Android Studio > Profiler > Energy
```

---

## 🐛 Crasheos y Errores

### Problema: App crashea al iniciar

**Síntoma:** App cierra inmediatamente después de abrir

**Ver logs:**

```bash
# iOS
# Xcode > Window > Devices > Console

# Android
adb logcat | grep -E "FATAL|ERROR|Exception"
```

**Soluciones comunes:**

```bash
# Limpiar build
expo prebuild --clean

# Verificar que app.json es válido
npx eslint app.json  # (si hay validación)

# Reinstalar dependencias
rm -rf node_modules
npm install

# Limpiar caché de Expo
rm -rf .expo
expo start --clear
```

---

### Problema: "Redux DevTools" error

**Síntoma:** Error mencionando Redux

```
Error: Could not connect to Redux DevTools
```

**Solución:**
Redux DevTools no es necesario en Taro. Si aparece este error:

```bash
# Verificar que no hay DevTools configurado
grep -r "redux" apps/

# O ignorar el error (es no-blocking)
```

---

### Problema: Alerta de Uncaught Exception

**Síntoma:** App muestra alerta de error

```
Uncaught TypeError: Cannot read property 'x' of undefined
```

**Solución:**

```bash
# Ver full stack trace
adb logcat 2>&1 | grep -A 5 "Error"

# Agregar null checks
const item = data?.item; // En lugar de data.item

# Usar optional chaining
const value = obj?.prop?.subprop;
```

---

## 🔄 Problemas de Sincronización

### Problema: Alertas no se sincronizan entre dispositivos

**Síntoma:** Alerta en hijo pero no aparece en padre

**Verificar:**

1. **Emparejamiento:**
```typescript
const devices = await LocalStorage.getPairedDevices();
console.log('Paired devices:', devices);
```

2. **Encriptación:**
```bash
# Verificar que keys existen
adb shell su -c 'cat /data/data/com.taro.child/shared_prefs/*.xml' | grep publicKey
```

3. **Sincronización:**
```typescript
// Verificar que se está guardando la alerta
const alerts = await LocalStorage.getAlerts();
console.log('Total alerts:', alerts.length);
```

**Soluciones:**

```bash
# Reiniciar ambas apps
# En hijo: Home > swipe up
# En padre: Home > swipe up

# Desemparejar y reparear
# En padre: Settings > Remove Device
# Volver a hacer setup

# Limpiar datos
adb shell pm clear com.taro.child
adb shell pm clear com.taro.parent
```

---

### Problema: Encriptación no funciona

**Síntoma:** "Invalid ciphertext" error

**Verificar:**

```typescript
// En crypto.ts
await initSodium(); // Asegurar que se llama primero

// Verificar que las keys son válidas
const keys = await LocalStorage.getEncryptionKeys();
console.log('Keys loaded:', keys !== null);
```

**Solución:**

```bash
# Generar nuevas keys
# Limpiar datos y reiniciar setup
adb shell pm clear com.taro.child

# O reinstalar desde cero
npm run build:child
npm run build:parent
```

---

## 🔐 Problemas de Seguridad

### Problema: Keys se exponen en logs

**Verificar:**

```bash
# Buscar keys en logs
adb logcat | grep -i "publickey\|privatekey"

# Buscar en archivos
grep -r "privateKey" apps/
grep -r "publicKey" apps/
```

**Solución:**

```typescript
// Nunca logear keys sensibles
// ❌ Incorrecto:
console.log('Keys:', keys);

// ✅ Correcto:
console.log('Keys loaded:', keys !== null);
console.log('Public key starts with:', keys.publicKey.substring(0, 8) + '...');
```

---

### Problema: Datos sin encriptar en almacenamiento

**Verificar:**

```bash
# Ver contenido de AsyncStorage
adb shell sqlite3 /data/data/com.taro.child/databases/RKStorage | '.dump'

# Si ve alertas en texto plano, hay un problema
```

**Solución:**

Todos los datos deben ir a través de:
```typescript
await LocalStorage.saveAlert(alert); // Encriptado
```

No hacerlo directamente a AsyncStorage:
```typescript
// ❌ Incorrecto:
AsyncStorage.setItem('alerts', JSON.stringify(alerts));

// ✅ Correcto:
await LocalStorage.saveAlert(alert);
```

---

## 🎯 Debugging Avanzado

### Habilitar verbose logging

```bash
# Expo
DEBUG=* expo start

# React Native
react-native log-android
react-native log-ios
```

### Usar debugger de React Native

```bash
# Android
adb shell input keyevent 82  # Menu
# Seleccionar "Debug Remote JS"

# iOS
# Agitar dispositivo > Debug Remote JS
```

### Inspeccionar con React DevTools

```bash
# Instalar globalmente
npm install -g react-devtools

# Ejecutar
react-devtools

# Conectar desde app (Shake > Debug Remote JS)
```

---

## 📞 Escalar Issues

Si después de todo esto el problema persiste:

1. **Recolectar información:**
   - Logs completos (adb logcat > logs.txt)
   - Screenshots del error
   - Steps para reproducir
   - Device info (versión SO, modelo)

2. **Reportar en GitHub:**
   - Crear issue con template
   - Adjuntar logs
   - Si es sensitive, reportar en privado

3. **Contactar soporte:**
   - Expo support: https://expo.dev/help
   - React Native: https://react-native.dev/help

---

**Última actualización:** 2026-09-22  
**Próxima revisión:** Después de testing en 5+ dispositivos
