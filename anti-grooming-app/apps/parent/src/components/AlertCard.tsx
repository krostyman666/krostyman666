import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Alert } from '@anti-grooming/shared';

interface AlertCardProps {
  alert: Alert;
  onReview?: (alertId: string) => void;
}

export function AlertCard({ alert, onReview }: AlertCardProps) {
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

  return (
    <TouchableOpacity
      style={[styles.card, !alert.reviewed && { backgroundColor: '#f0f8ff' }]}
      onPress={() => onReview?.(alert.id)}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.severityDot,
            { backgroundColor: getSeverityColor(alert.severity) },
          ]}
        />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.type}>{alert.type}</Text>
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
        <Text style={styles.description}>{alert.description}</Text>
      )}

      {alert.evidence && (
        <View style={styles.evidenceBox}>
          <Text style={styles.evidenceLabel}>Evidencia:</Text>
          <Text style={styles.evidenceText}>{alert.evidence}</Text>
        </View>
      )}

      <Text style={styles.time}>
        {new Date(alert.timestamp).toLocaleString('es-CL')}
      </Text>

      {!alert.reviewed && (
        <TouchableOpacity style={styles.reviewButton}>
          <Text style={styles.reviewButtonText}>Marcar como revisado</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  header: {
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  type: {
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
  description: {
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
  time: {
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
});
