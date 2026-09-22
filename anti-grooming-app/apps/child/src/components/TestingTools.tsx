import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { monitoringService } from '../services/monitoring';

interface TestingToolsProps {
  onSimulate?: () => void;
}

export function TestingTools({ onSimulate }: TestingToolsProps) {
  const [visible, setVisible] = useState(false);
  const [customText, setCustomText] = useState('');

  const testMessages = [
    'Eres muy especial, nadie te entiende como yo',
    'No le digas a tus padres que nos hablamos',
    'Envíame una foto sin ropa',
    'Nos vemos este fin de semana en un lugar discreto',
    'Si me amas me envías dinero',
  ];

  async function handleSimulate(message?: string) {
    if (message) {
      await monitoringService.analyzeText(message, 'test_grooming');
    } else {
      await monitoringService.simulateGroomingAttempt();
    }
    onSimulate?.();
  }

  return (
    <>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.floatingButtonText}>🧪</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Herramientas de Testing</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              <Text style={styles.sectionTitle}>Simular mensajes de grooming</Text>

              {testMessages.map((message, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.testButton}
                  onPress={() => handleSimulate(message)}
                >
                  <Text style={styles.testButtonText}>{message}</Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.sectionTitle}>Mensaje personalizado</Text>
              <TextInput
                style={styles.input}
                placeholder="Escribe un mensaje para probar"
                value={customText}
                onChangeText={setCustomText}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => {
                  if (customText) {
                    handleSimulate(customText);
                    setCustomText('');
                  }
                }}
              >
                <Text style={styles.submitButtonText}>Analizar mensaje</Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>ℹ️ Información</Text>
                <Text style={styles.infoText}>
                  Estas herramientas son solo para desarrollo y testing. No están disponibles
                  en producción.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButtonText: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    marginTop: 16,
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0066cc',
  },
  testButtonText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#7f1d1d',
    lineHeight: 18,
  },
});
