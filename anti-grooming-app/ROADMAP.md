# Roadmap - Taro

Versión actual: **0.1.0-alpha** (MVP)

---

## ✅ Completado (0.1.0)

### Core
- [x] Monorepo con npm workspaces
- [x] Encriptación E2E con libsodium
- [x] Base de 25+ palabras clave de grooming (español)
- [x] Almacenamiento local con AsyncStorage
- [x] Sistema de emparejamiento seguro

### Apps
- [x] UI básica padre/hijo
- [x] Setup de emparejamiento
- [x] Panel de alertas (padre)
- [x] Monitor de estado (hijo)
- [x] Pantallas de configuración
- [x] Herramientas de testing

### Testing
- [x] Simular grooming (desarrollo)
- [x] Inyectar textos personalizados
- [x] Visualizar alertas creadas

---

## 🚀 En Progreso (0.2.0 - Próximas 2-4 semanas)

### Background Monitoring
- [ ] Servicio de fondo para iOS
- [ ] Servicio de fondo para Android
- [ ] Interceptor de notificaciones
- [ ] Detector de búsquedas en navegador

### Integraciones de Sistema
- [ ] Permiso de Contactos (iOS/Android)
- [ ] Permiso de Ubicación (iOS/Android)
- [ ] Permiso de Notificaciones (iOS/Android)
- [ ] Acceso a Safari History (iOS)
- [ ] Acceso a Chrome History (Android)

### Sincronización
- [ ] WebSocket para tiempo real (opcional)
- [ ] BLE (Bluetooth Low Energy) local
- [ ] QR code para compartir alertas
- [ ] Compresión de eventos

### UX Mejorada
- [ ] Dashboards más detallados
- [ ] Gráficos de tendencias
- [ ] Timeline de eventos
- [ ] Exportar alertas a PDF

---

## 📋 Planeado (0.3.0+ - Largo plazo)

### Machine Learning
- [ ] Modelo de detección de cambio de comportamiento
- [ ] Clustering de patrones similares
- [ ] Scores de riesgo personalizados

### Funcionalidades Avanzadas
- [ ] Sincronización a la nube (opcional, encriptado)
- [ ] Panel web para padres
- [ ] Notificaciones por email/SMS
- [ ] Geofencing (alertas por salida de zona)
- [ ] Detección de VPN/proxy usage
- [ ] Monitoreo de instalación de apps nuevas

### Expansión Multiidioma
- [ ] Patrones de grooming en inglés
- [ ] Patrones en portugués
- [ ] Patrones en francés
- [ ] Editor de palabras clave personalizadas

### Escalabilidad
- [ ] Multi-hijo por padre
- [ ] Roles adicionales (educadores, consejeros)
- [ ] Auditoría de cambios
- [ ] Backups automáticos

---

## 🛠️ Tareas Técnicas Inmediatas

### Semana 1
1. Implementar servicio de background en iOS (`BGProcessingTaskRequest`)
2. Implementar servicio de background en Android (`WorkManager`)
3. Crear handler de notificaciones
4. Agregar permisos a app.json

### Semana 2
1. Integración de contactos (`expo-contacts`)
2. Integración de ubicación (`expo-location`)
3. Historial de navegación (iOS Safari, Android Chrome)
4. Testing end-to-end

### Semana 3
1. Sincronización BLE local
2. Mejoras de UX en alertas
3. Pantalla de historial de eventos
4. Refactorización de código

### Semana 4
1. Documentación completa
2. Security review
3. Testing de performance
4. Build inicial para App Store / Play Store

---

## 📊 Métricas de Éxito

- [ ] 100% de patrones de grooming detectados en test suite
- [ ] <100ms de latencia entre evento y alerta
- [ ] <50MB de memoria en reposo (hijo)
- [ ] <10% de batería consumida en 24h
- [ ] 0 crashes en 1000 iteraciones

---

## 🔒 Consideraciones de Seguridad

Antes de 1.0.0 (Release):
- [ ] Audit de seguridad por terceros
- [ ] Penetration testing
- [ ] Review de privacidad (GDPR, LOPC)
- [ ] Code signing con certificados
- [ ] Hardcoded secrets removal

---

## 📌 Notas

- El MVP se enfoca en **detección local** sin servidores
- La sincronización será **opcional** (usuario decide si envía a la nube)
- Priorizamos **privacidad sobre funcionalidad**
- Cada feature requiere consentimiento informado

---

**Última actualización**: 2026-09-22
**Próxima review**: 2026-10-06
