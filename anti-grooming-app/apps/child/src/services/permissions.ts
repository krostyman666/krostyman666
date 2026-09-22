import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import { NotificationService } from './notifications';

export interface PermissionStatus {
  contacts: 'granted' | 'denied' | 'pending';
  location: 'granted' | 'denied' | 'pending';
  notifications: 'granted' | 'denied' | 'pending';
}

export class PermissionsService {
  static async requestContactsPermission(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  }

  static async getContactsPermissionStatus(): Promise<'granted' | 'denied' | 'pending'> {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      if (status === 'granted') return 'granted';
      if (status === 'denied') return 'denied';
      return 'pending';
    } catch (error) {
      console.error('Error getting contacts permission status:', error);
      return 'pending';
    }
  }

  static async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  static async getLocationPermissionStatus(): Promise<'granted' | 'denied' | 'pending'> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') return 'granted';
      if (status === 'denied') return 'denied';
      return 'pending';
    } catch (error) {
      console.error('Error getting location permission status:', error);
      return 'pending';
    }
  }

  static async requestNotificationPermission(): Promise<boolean> {
    return await NotificationService.requestPermissions();
  }

  static async getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'pending'> {
    try {
      const status = await NotificationService.getPermissionsStatus();
      if (status.granted) return 'granted';
      if (!status.granted && status.ios?.status === -1) return 'pending';
      return 'denied';
    } catch (error) {
      console.error('Error getting notification permission status:', error);
      return 'pending';
    }
  }

  static async getAllPermissionsStatus(): Promise<PermissionStatus> {
    const [contacts, location, notifications] = await Promise.all([
      this.getContactsPermissionStatus(),
      this.getLocationPermissionStatus(),
      this.getNotificationPermissionStatus(),
    ]);

    return { contacts, location, notifications };
  }

  static async requestAllPermissions(): Promise<PermissionStatus> {
    const results = await Promise.all([
      this.requestContactsPermission(),
      this.requestLocationPermission(),
      this.requestNotificationPermission(),
    ]);

    return {
      contacts: results[0] ? 'granted' : 'denied',
      location: results[1] ? 'granted' : 'denied',
      notifications: results[2] ? 'granted' : 'denied',
    };
  }
}
