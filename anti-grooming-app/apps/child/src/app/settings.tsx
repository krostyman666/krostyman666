import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LocalStorage, Device } from '@anti-grooming/shared';

export default function SettingsScreen() {
  const [deviceInfo, setDeviceInfo] = useState<Device | null>(null);
  const [pairedParent, setpairedParent] = useState<Device | null>(null);

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  async function loadDeviceInfo() {
    try {
      const device = await LocalStorage.getDeviceInfo();
      setDeviceInfo(device);

      const pairedDevices = await LocalStorage.getPairedDevices();
      const parent = pairedDevices.find((d) => d.role === 'parent');
      setpairedParent(parent || null);
    } catch (error) {
      console.error('Error loading device info:', error);
    }
  }

  function handleAbout() {
    Alert.alert('Acerca de Taro', 'Taro v0.1.0\n\nProtección contra grooming en línea');
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Este dispositivo</Text>
        {deviceInfo ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{deviceInfo.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>ID:</Text>
              <Text style={styles.value}>{deviceInfo.id.substring(0, 12)}...</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Emparejado hace:</Text>
              <Text style={styles.value}>
                {Math.floor((Date.now() - deviceInfo.pairedAt) / 86400000)} días
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>No configurado</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dispositivo padre/madre</Text>
        {pairedParent ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{pairedParent.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Emparejado hace:</Text>
              <Text style={styles.value}>
                {Math.floor((Date.now() - pairedParent.pairedAt) / 86400000)} días
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>No hay dispositivo padre/madre emparejado</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>

        <TouchableOpacity style={styles.infoButton} onPress={handleAbout}>
          <Text style={styles.infoButtonText}>Acerca de Taro</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          <Text style={styles.infoText}>
            Taro detecta patrones de grooming y conductas peligrosas en línea. Si se detecta
            algo sospechoso, se notifica a tu padre o madre.
          </Text>
          <Text style={styles.infoText}>
            Tu privacidad es importante. Taro no puede leer mensajes encriptados ni acceder a
            contenido personal sin tu consentimiento.
          </Text>
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  infoButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#0066cc',
  },
  infoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
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
  footer: {
    height: 20,
  },
});
