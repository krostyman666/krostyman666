# Permisos Necesarios - Taro

Este documento detalla los permisos que requiere Taro en iOS y Android, y cómo se utilizan.

## iOS (Info.plist)

### Contactos
- **Permisos**: `NSContactsUsageDescription`
- **Uso**: Detectar contactos nuevos/desconocidos
- **Necesario para**: App del hijo

### Ubicación
- **Permisos**: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`
- **Uso**: Geolocalización para alertas de ubicación sospechosa
- **Necesario para**: App del hijo

### Notificaciones
- **Permisos**: `UNUserNotificationCenter`
- **Uso**: Enviar alertas al padre/madre
- **Necesario para**: Ambas apps

### Acceso a historial de búsqueda
- **Permisos**: No disponible nativamente en iOS
- **Alternativa**: Interceptar notificaciones y eventos de Safari

## Android

### Contactos
- `android.permission.READ_CONTACTS`
- **Uso**: Detectar contactos nuevos/desconocidos

### Ubicación
- `android.permission.ACCESS_FINE_LOCATION`
- `android.permission.ACCESS_COARSE_LOCATION`
- **Uso**: Geolocalización precisa

### Notificaciones (Android 13+)
- `android.permission.POST_NOTIFICATIONS`
- **Uso**: Enviar notificaciones

### Lectura de logs
- `android.permission.READ_LOGS` (requiere rooting)
- **Nota**: No incluimos esto. Enfocamos en metadatos y notificaciones

## Permisos por App

### App del Hijo
✅ Contactos - Detectar nuevos contactos
✅ Ubicación - Monitoreo de localización
✅ Notificaciones - Recibir alertas
✅ Almacenamiento - Guardar datos localmente
✅ Conectividad - Sincronizar con padre

### App del Padre
✅ Notificaciones - Recibir alertas
✅ Almacenamiento - Guardar datos de alertas
✅ Conectividad - Recibir datos del hijo

## Implementación

Los permisos se configuran automáticamente en:
- `app.json` - Configuración Expo
- Solicitud en tiempo de ejecución (Runtime Permissions)

Ejemplo de solicitud en tiempo de ejecución:

```typescript
import * as Contacts from 'expo-contacts';

async function requestContactsPermission() {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}
```

## Privacidad del Usuario

Taro respeta la privacidad del usuario:
- ❌ No accede a contenido de mensajes encriptados
- ❌ No graba llamadas
- ❌ No accede a archivos personales sin permiso
- ✅ Monitorea solo metadatos (quién, cuándo)
- ✅ Detecta patrones de lenguaje peligroso
- ✅ Guarda datos localmente (no en servidores)

## Consideraciones Legales

Antes de usar Taro en producción:
1. Consulta con asesor legal sobre privacidad en tu país
2. Obtén consentimiento informado de todas las partes
3. Documenta el propósito del monitoreo
4. Proporciona formas de desactivar la app

---

**Última actualización**: 2026-09-22
