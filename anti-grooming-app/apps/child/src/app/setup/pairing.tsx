import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { generateKeyPair, LocalStorage } from '@anti-grooming/shared';
import { v4 as uuidv4 } from 'uuid';

export default function PairingScreen() {
  const router = useRouter();
  const [pairingCode, setPairingCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeDevice();
  }, []);

  async function initializeDevice() {
    try {
      const existingDevice = await LocalStorage.getDeviceInfo();
      if (existingDevice) {
        router.replace('/home');
        return;
      }

      const { publicKey, privateKey } = generateKeyPair();
      const code = generatePairingCode();
      setPairingCode(code);

      await LocalStorage.saveEncryptionKeys(publicKey, privateKey);
      await LocalStorage.savePairingToken(code, Date.now() + 3600000);
    } catch (error) {
      console.error('Error initializing device:', error);
      Alert.alert('Error', 'No se pudo inicializar el dispositivo');
    }
  }

  function generatePairingCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function handlePairingConfirmed() {
    setLoading(true);
    try {
      const keys = await LocalStorage.getEncryptionKeys();
      if (!keys) throw new Error('Keys not found');

      const device = {
        id: uuidv4(),
        publicKey: keys.publicKey,
        role: 'child' as const,
        name: 'Mi Dispositivo',
        pairedAt: Date.now(),
      };

      await LocalStorage.saveDeviceInfo(device);
      router.replace('/home');
    } catch (error) {
      console.error('Error confirming pairing:', error);
      Alert.alert('Error', 'No se pudo completar el emparejamiento');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Configurar Taro</Text>
        <Text style={styles.subtitle}>Emparejamiento con dispositivo del padre</Text>

        <View style={styles.codeBox}>
          <Text style={styles.label}>Código de emparejamiento:</Text>
          <Text style={styles.code}>{pairingCode}</Text>
          <Text style={styles.hint}>Comparte este código con tu padre/madre</Text>
        </View>

        <View style={styles.instructionsBox}>
          <Text style={styles.instructionTitle}>Instrucciones:</Text>
          <Text style={styles.instruction}>1. Muestra este código a tu padre/madre</Text>
          <Text style={styles.instruction}>
            2. Abre la app en su dispositivo e ingresa el código
          </Text>
          <Text style={styles.instruction}>3. Confirma el emparejamiento aquí</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handlePairingConfirmed}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Configurando...' : 'Emparejamiento confirmado'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  codeBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066cc',
    letterSpacing: 2,
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  instructionsBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#0066cc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
