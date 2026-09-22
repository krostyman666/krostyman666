import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Alert, LocalStorage } from '@anti-grooming/shared';

export default function HomeScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreviewedCount, setUnreviewedCount] = useState(0);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadAlerts() {
    try {
      const allAlerts = await LocalStorage.getAlerts();
      const unreviewed = allAlerts.filter((a) => !a.reviewed);
      setAlerts(allAlerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20));
      setUnreviewedCount(unreviewed.length);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewAlert(alertId: string) {
    try {
      await LocalStorage.markAlertAsReviewed(alertId);
      loadAlerts();
    } catch (error) {
      console.error('Error reviewing alert:', error);
    }
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  }

  function getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'Crítico';
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Medio';
      case 'low':
        return 'Bajo';
      default:
        return 'Desconocido';
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Control</Text>
        {unreviewedCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreviewedCount}</Text>
          </View>
        )}
      </View>

      {unreviewedCount === 0 && alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sin alertas</Text>
          <Text style={styles.emptyMessage}>
            Todo está bien. No hay patrones sospechosos detectados.
          </Text>
        </View>
      ) : (
        <>
          {unreviewedCount > 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Tienes {unreviewedCount} alertas nuevas que revisar
              </Text>
            </View>
          )}

          <View style={styles.alertsList}>
            {alerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertCard,
                  !alert.reviewed && { backgroundColor: '#f0f8ff' },
                ]}
                onPress={() => handleReviewAlert(alert.id)}
              >
                <View style={styles.alertHeader}>
                  <View
                    style={[
                      styles.severityDot,
                      { backgroundColor: getSeverityColor(alert.severity) },
                    ]}
                  />
                  <View style={styles.alertTitleContainer}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertType}>{alert.type}</Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: getSeverityColor(alert.severity) },
                    ]}
                  >
                    <Text style={styles.severityLabel}>
                      {getSeverityLabel(alert.severity)}
                    </Text>
                  </View>
                </View>

                {alert.description && (
                  <Text style={styles.alertDescription}>{alert.description}</Text>
                )}

                {alert.evidence && (
                  <View style={styles.evidenceBox}>
                    <Text style={styles.evidenceLabel}>Evidencia:</Text>
                    <Text style={styles.evidenceText}>{alert.evidence}</Text>
                  </View>
                )}

                <Text style={styles.alertTime}>
                  {new Date(alert.timestamp).toLocaleString('es-CL')}
                </Text>

                {!alert.reviewed && (
                  <TouchableOpacity style={styles.reviewButton}>
                    <Text style={styles.reviewButtonText}>Marcar como revisado</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  badge: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  alertsList: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    marginTop: 4,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  alertType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  alertDescription: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  evidenceBox: {
    backgroundColor: '#f5f5f5',
    borderLeftWidth: 3,
    borderLeftColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  evidenceText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Courier New',
  },
  alertTime: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
  },
  reviewButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    height: 20,
  },
});
