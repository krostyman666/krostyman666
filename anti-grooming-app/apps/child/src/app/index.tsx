import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LocalStorage } from '@anti-grooming/shared';

export default function IndexScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSetup() {
      try {
        const deviceInfo = await LocalStorage.getDeviceInfo();

        if (deviceInfo) {
          router.replace('/home');
        } else {
          router.replace('/setup/pairing');
        }
      } catch (error) {
        console.error('Error checking setup:', error);
        router.replace('/setup/pairing');
      } finally {
        setLoading(false);
      }
    }

    checkSetup();
  }, [router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.text}>Inicializando...</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
