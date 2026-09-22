import { Alert, MonitoringEvent, encryptMessage, decryptMessage, EncryptedMessage } from '../index';

export interface SyncMessage {
  type: 'alert' | 'event' | 'sync_request' | 'sync_response';
  data: Alert | MonitoringEvent | { lastSync: number };
  timestamp: number;
  encrypted: boolean;
}

export class SyncService {
  private static instance: SyncService;
  private listeners: Set<(message: SyncMessage) => void> = new Set();
  private lastSyncTime = 0;

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async sendAlert(
    alert: Alert,
    recipientPublicKey: string,
    senderPrivateKey: string
  ): Promise<EncryptedMessage> {
    const message: SyncMessage = {
      type: 'alert',
      data: alert,
      timestamp: Date.now(),
      encrypted: false,
    };

    return await encryptMessage(
      JSON.stringify(message),
      recipientPublicKey,
      senderPrivateKey
    );
  }

  async sendEvent(
    event: MonitoringEvent,
    recipientPublicKey: string,
    senderPrivateKey: string
  ): Promise<EncryptedMessage> {
    const message: SyncMessage = {
      type: 'event',
      data: event,
      timestamp: Date.now(),
      encrypted: false,
    };

    return await encryptMessage(
      JSON.stringify(message),
      recipientPublicKey,
      senderPrivateKey
    );
  }

  async requestSync(
    recipientPublicKey: string,
    senderPrivateKey: string
  ): Promise<EncryptedMessage> {
    const message: SyncMessage = {
      type: 'sync_request',
      data: { lastSync: this.lastSyncTime },
      timestamp: Date.now(),
      encrypted: false,
    };

    return await encryptMessage(
      JSON.stringify(message),
      recipientPublicKey,
      senderPrivateKey
    );
  }

  async decryptMessage(
    encrypted: EncryptedMessage,
    senderPublicKey: string,
    recipientPrivateKey: string
  ): Promise<SyncMessage> {
    const decrypted = await decryptMessage(encrypted, senderPublicKey, recipientPrivateKey);
    return JSON.parse(decrypted);
  }

  onMessage(callback: (message: SyncMessage) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyMessage(message: SyncMessage): void {
    this.listeners.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
    this.lastSyncTime = Math.max(this.lastSyncTime, message.timestamp);
  }

  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  setLastSyncTime(time: number): void {
    this.lastSyncTime = time;
  }
}

export const syncService = SyncService.getInstance();
