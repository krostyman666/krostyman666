import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useMonitoring } from '../hooks/useMonitoring';
import { TestingTools } from '../components/TestingTools';

export default function HomeScreen() {
  const { isActive, stats } = useMonitoring();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Taro</Text>
          <Text style={styles.subtitle}>Protección activa</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.indicator,
                isActive ? styles.activeIndicator : styles.inactiveIndicator,
              ]}
            />
            <Text style={styles.statusText}>
              {isActive ? 'Monitoreo activo' : 'Monitoreo inactivo'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estadísticas</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Alertas detectadas:</Text>
            <Text style={styles.statValue}>{stats.alerts || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Eventos monitoreados:</Text>
            <Text style={styles.statValue}>{stats.events || 0}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información</Text>
          <Text style={styles.infoText}>
            Esta aplicación está protegiendo tu dispositivo monitoreando patrones de grooming.
          </Text>
          <Text style={styles.infoText}>
            Los datos se almacenan de forma segura y encriptada en tu dispositivo.
          </Text>
        </View>

        <View style={styles.spacing} />
      </ScrollView>

      <TestingTools />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    flex: 1,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#0066cc',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  activeIndicator: {
    backgroundColor: '#4ade80',
  },
  inactiveIndicator: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    color: '#333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  spacing: {
    height: 20,
  },
});
