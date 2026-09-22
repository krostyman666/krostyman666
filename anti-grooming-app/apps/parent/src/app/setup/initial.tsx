import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { generateKeyPair, LocalStorage } from '@anti-grooming/shared';
import { v4 as uuidv4 } from 'uuid';

export default function InitialSetupScreen() {
  const router = useRouter();
  const [pairingCode, setPairingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [childName, setChildName] = useState('');

  async function handlePairDevice() {
    if (!pairingCode.trim()) {
      Alert.alert('Error', 'Ingresa el código de emparejamiento');
      return;
    }

    if (!childName.trim()) {
      Alert.alert('Error', 'Ingresa el nombre de tu hijo/a');
      return;
    }

    setLoading(true);
    try {
      const { publicKey, privateKey } = generateKeyPair();

      const childDevice = {
        id: uuidv4(),
        publicKey: pairingCode,
        role: 'child' as const,
        name: childName.trim(),
        pairedAt: Date.now(),
      };

      const parentDevice = {
        id: uuidv4(),
        publicKey,
        role: 'parent' as const,
        name: 'Mi Dispositivo',
        pairedAt: Date.now(),
      };

      await LocalStorage.saveEncryptionKeys(publicKey, privateKey);
      await LocalStorage.saveDeviceInfo(parentDevice);
      await LocalStorage.addPairedDevice(childDevice);

      Alert.alert('Éxito', `${childName} ha sido emparejado exitosamente`);
      router.replace('/home');
    } catch (error) {
      console.error('Error pairing device:', error);
      Alert.alert('Error', 'No se pudo emparejar el dispositivo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Taro</Text>
        <Text style={styles.subtitle}>Protección familiar</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bienvenido</Text>
          <Text style={styles.description}>
            Taro te ayuda a proteger a tus hijos del grooming y otras conductas peligrosas en línea.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Nombre del niño/a</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan"
              value={childName}
              onChangeText={setChildName}
              editable={!loading}
            />

            <Text style={styles.label}>Código de emparejamiento</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa el código del dispositivo"
              value={pairingCode}
              onChangeText={setPairingCode}
              maxLength={6}
              editable={!loading}
            />

            <Text style={styles.hint}>
              Solicita el código en el dispositivo de tu hijo/a
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handlePairDevice}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Emparejando...' : 'Emparejar dispositivo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.featureBox}>
          <Text style={styles.featureTitle}>Características:</Text>
          <Text style={styles.feature}>✓ Detección de patrones de grooming</Text>
          <Text style={styles.feature}>✓ Alertas en tiempo real</Text>
          <Text style={styles.feature}>✓ Encriptación local</Text>
          <Text style={styles.feature}>✓ Sin acceso a contenido privado</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#cce0ff',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  form: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: '#0066cc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  featureBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 12,
  },
  feature: {
    fontSize: 13,
    color: '#333',
    lineHeight: 24,
  },
});
