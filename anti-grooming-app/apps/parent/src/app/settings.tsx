import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { LocalStorage, Device } from '@anti-grooming/shared';

export default function SettingsScreen() {
  const [pairedDevices, setPairedDevices] = useState<Device[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [criticalAlertsOnly, setCriticalAlertsOnly] = useState(false);

  useEffect(() => {
    loadPairedDevices();
  }, []);

  async function loadPairedDevices() {
    try {
      const devices = await LocalStorage.getPairedDevices();
      setPairedDevices(devices);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  }

  async function handleRemoveDevice(deviceId: string) {
    Alert.alert(
      'Confirmar',
      '¿Deseas desemparejar este dispositivo?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Desemparejar',
          onPress: async () => {
            try {
              await LocalStorage.removePairedDevice(deviceId);
              await loadPairedDevices();
              Alert.alert('Éxito', 'Dispositivo desemparejado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo desemparejar el dispositivo');
            }
          },
          style: 'destructive',
        },
      ]
    );
  }

  async function handleClearData() {
    Alert.alert(
      'Advertencia',
      'Esto eliminará todas las alertas y eventos. ¿Estás seguro?',
      [
        { text: 'Cancelar', onPress: () => {} },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              await LocalStorage.clear();
              Alert.alert('Éxito', 'Datos eliminados');
              await loadPairedDevices();
            } catch (error) {
              Alert.alert('Error', 'No se pudo limpiar los datos');
            }
          },
          style: 'destructive',
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dispositivos emparejados</Text>
        {pairedDevices.length === 0 ? (
          <Text style={styles.emptyText}>No hay dispositivos emparejados</Text>
        ) : (
          pairedDevices.map((device) => (
            <View key={device.id} style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.name}</Text>
                <Text style={styles.deviceMeta}>
                  ID: {device.id.substring(0, 8)}... · Emparejado hace{' '}
                  {Math.floor((Date.now() - device.pairedAt) / 86400000)} días
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveDevice(device.id)}
              >
                <Text style={styles.removeButtonText}>Desemparejar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingName}>Notificaciones habilitadas</Text>
            <Text style={styles.settingDescription}>
              Recibir notificaciones de alertas
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingName}>Solo alertas críticas</Text>
            <Text style={styles.settingDescription}>
              Solo notificar si la severidad es crítica
            </Text>
          </View>
          <Switch value={criticalAlertsOnly} onValueChange={setCriticalAlertsOnly} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacidad y datos</Text>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleClearData}
        >
          <Text style={styles.dangerButtonText}>Eliminar todos los datos</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Sobre Taro</Text>
          <Text style={styles.infoText}>
            Taro es una herramienta de control parental que protege a menores contra
            grooming y abuso en línea.
          </Text>
          <Text style={styles.infoText}>
            Todos los datos se almacenan localmente en tus dispositivos con encriptación
            E2E. Ninguna información se envía a servidores externos.
          </Text>
          <Text style={styles.version}>Versión 0.1.0</Text>
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  deviceMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    flex: 1,
  },
  settingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dangerButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0066cc',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  version: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  footer: {
    height: 20,
  },
});
