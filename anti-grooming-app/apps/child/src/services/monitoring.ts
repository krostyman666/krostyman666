import { MonitoringEvent, Alert, searchKeywords, getRiskScore, getHighestSeverity } from '@anti-grooming/shared';
import { LocalStorage } from '@anti-grooming/shared';
import { v4 as uuidv4 } from 'uuid';

export class MonitoringService {
  private static instance: MonitoringService;
  private isActive = false;
  private eventListeners: Set<(event: MonitoringEvent) => void> = new Set();
  private alertListeners: Set<(alert: Alert) => void> = new Set();

  private constructor() {}

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async start(): Promise<void> {
    if (this.isActive) return;

    this.isActive = true;
    console.log('Monitoring service started');

    this.startMonitoringCycle();
  }

  async stop(): Promise<void> {
    this.isActive = false;
    console.log('Monitoring service stopped');
  }

  private startMonitoringCycle(): void {
    if (!this.isActive) return;

    setTimeout(() => {
      this.checkForNewNotifications();
      this.startMonitoringCycle();
    }, 5000);
  }

  private async checkForNewNotifications(): Promise<void> {
    try {
      // Simular análisis de notificaciones y búsquedas
      // En producción, esto interceptaría notificaciones reales
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }

  async analyzeText(text: string, source: string = 'unknown'): Promise<void> {
    try {
      const keywords = searchKeywords(text, 'es');

      const event: MonitoringEvent = {
        id: uuidv4(),
        timestamp: Date.now(),
        type: 'message',
        app: source,
        content: text.substring(0, 100), // Limitar a 100 caracteres por privacidad
        metadata: {
          keywordCount: keywords.length,
          categories: [...new Set(keywords.map((k) => k.category))],
        },
      };

      await LocalStorage.saveMonitoringEvent(event);
      this.notifyEventListeners(event);

      // Si hay palabras clave detectadas, crear alerta
      if (keywords.length > 0) {
        await this.createAlert(keywords, text, source);
      }
    } catch (error) {
      console.error('Error analyzing text:', error);
    }
  }

  private async createAlert(keywords: any[], text: string, source: string): Promise<void> {
    try {
      const riskScore = getRiskScore(keywords);
      const severity = getHighestSeverity(keywords);

      const alert: Alert = {
        id: uuidv4(),
        timestamp: Date.now(),
        severity: severity as any,
        type: 'keyword_detected',
        title: `Patrón detectado en ${source}`,
        description: `Se detectaron ${keywords.length} término(s) de riesgo en una comunicación.`,
        evidence: text.substring(0, 200),
        context: `Fuente: ${source}\nPalabras clave: ${keywords.map((k) => k.term).join(', ')}`,
        reviewed: false,
      };

      await LocalStorage.saveAlert(alert);
      this.notifyAlertListeners(alert);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  async analyzeContact(name: string, isUnknown: boolean): Promise<void> {
    if (!isUnknown) return;

    try {
      const alert: Alert = {
        id: uuidv4(),
        timestamp: Date.now(),
        severity: 'medium',
        type: 'contact_unknown',
        title: 'Contacto desconocido',
        description: `Se ha detectado comunicación con un nuevo contacto: ${name}`,
        reviewed: false,
      };

      await LocalStorage.saveAlert(alert);
      this.notifyAlertListeners(alert);
    } catch (error) {
      console.error('Error analyzing contact:', error);
    }
  }

  async analyzeLocation(lat: number, lng: number, name?: string): Promise<void> {
    try {
      // En producción, comparar contra lugares de riesgo conocidos
      const event: MonitoringEvent = {
        id: uuidv4(),
        timestamp: Date.now(),
        type: 'location',
        app: 'location',
        lat,
        lng,
        accuracy: 10,
      };

      await LocalStorage.saveMonitoringEvent(event);
      this.notifyEventListeners(event);
    } catch (error) {
      console.error('Error analyzing location:', error);
    }
  }

  async simulateGroomingAttempt(): Promise<void> {
    // Para testing: simular un intento de grooming
    const testMessages = [
      'Eres muy especial, nadie te entiende como yo',
      'No le digas a tus padres que nos hablamos',
      'Envíame una foto sin ropa',
      'Nos vemos este fin de semana en un lugar discreto',
      'Si me amas me envías dinero',
    ];

    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
    await this.analyzeText(randomMessage, 'test_grooming');
  }

  onEvent(callback: (event: MonitoringEvent) => void): () => void {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  onAlert(callback: (alert: Alert) => void): () => void {
    this.alertListeners.add(callback);
    return () => {
      this.alertListeners.delete(callback);
    };
  }

  private notifyEventListeners(event: MonitoringEvent): void {
    this.eventListeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  private notifyAlertListeners(alert: Alert): void {
    this.alertListeners.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert listener:', error);
      }
    });
  }

  isMonitoring(): boolean {
    return this.isActive;
  }
}

export const monitoringService = MonitoringService.getInstance();
