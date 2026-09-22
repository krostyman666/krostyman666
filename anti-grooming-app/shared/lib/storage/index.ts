import AsyncStorage from '@react-native-async-storage/async-storage';
import { Device, Alert, MonitoringEvent } from '../../types';

const STORAGE_KEYS = {
  DEVICE_INFO: '@taro/device_info',
  PAIRED_DEVICES: '@taro/paired_devices',
  ALERTS: '@taro/alerts',
  MONITORING_EVENTS: '@taro/monitoring_events',
  ENCRYPTION_KEYS: '@taro/encryption_keys',
  PAIRING_TOKEN: '@taro/pairing_token',
};

export class LocalStorage {
  static async saveDeviceInfo(device: Device): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_INFO, JSON.stringify(device));
  }

  static async getDeviceInfo(): Promise<Device | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_INFO);
    return data ? JSON.parse(data) : null;
  }

  static async savePairedDevices(devices: Device[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PAIRED_DEVICES, JSON.stringify(devices));
  }

  static async getPairedDevices(): Promise<Device[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PAIRED_DEVICES);
    return data ? JSON.parse(data) : [];
  }

  static async addPairedDevice(device: Device): Promise<void> {
    const devices = await this.getPairedDevices();
    devices.push(device);
    await this.savePairedDevices(devices);
  }

  static async removePairedDevice(deviceId: string): Promise<void> {
    const devices = await this.getPairedDevices();
    const filtered = devices.filter((d) => d.id !== deviceId);
    await this.savePairedDevices(filtered);
  }

  static async saveAlert(alert: Alert): Promise<void> {
    const alerts = await this.getAlerts();
    alerts.push(alert);
    await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  }

  static async getAlerts(): Promise<Alert[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
    return data ? JSON.parse(data) : [];
  }

  static async getUnreviewedAlerts(): Promise<Alert[]> {
    const alerts = await this.getAlerts();
    return alerts.filter((a) => !a.reviewed);
  }

  static async markAlertAsReviewed(alertId: string): Promise<void> {
    const alerts = await this.getAlerts();
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.reviewed = true;
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    }
  }

  static async deleteAlert(alertId: string): Promise<void> {
    const alerts = await this.getAlerts();
    const filtered = alerts.filter((a) => a.id !== alertId);
    await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(filtered));
  }

  static async saveMonitoringEvent(event: MonitoringEvent): Promise<void> {
    const events = await this.getMonitoringEvents();
    events.push(event);
    await AsyncStorage.setItem(STORAGE_KEYS.MONITORING_EVENTS, JSON.stringify(events));
  }

  static async getMonitoringEvents(limit: number = 100): Promise<MonitoringEvent[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MONITORING_EVENTS);
    const events = data ? JSON.parse(data) : [];
    return events.slice(-limit);
  }

  static async saveEncryptionKeys(publicKey: string, privateKey: string): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ENCRYPTION_KEYS,
      JSON.stringify({ publicKey, privateKey })
    );
  }

  static async getEncryptionKeys(): Promise<{ publicKey: string; privateKey: string } | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ENCRYPTION_KEYS);
    return data ? JSON.parse(data) : null;
  }

  static async savePairingToken(token: string, expiresAt: number): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PAIRING_TOKEN,
      JSON.stringify({ token, expiresAt })
    );
  }

  static async getPairingToken(): Promise<{ token: string; expiresAt: number } | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PAIRING_TOKEN);
    return data ? JSON.parse(data) : null;
  }

  static async clear(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  }

  static async getStorageStats(): Promise<{ alerts: number; events: number }> {
    const alerts = await this.getAlerts();
    const events = await this.getMonitoringEvents();
    return {
      alerts: alerts.length,
      events: events.length,
    };
  }
}
