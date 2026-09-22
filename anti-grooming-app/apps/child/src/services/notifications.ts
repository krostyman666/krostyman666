import * as Notifications from 'expo-notifications';
import { monitoringService } from './monitoring';

// Configurar cómo se manejan las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('Notification received:', notification.request.content.body);

    // Analizar el contenido de la notificación
    const content = notification.request.content;
    if (content.body && content.data?.app) {
      await monitoringService.analyzeText(content.body, content.data.app);
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

export class NotificationService {
  private static listeners: Array<(notification: Notifications.Notification) => void> = [];

  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async getPermissionsStatus(): Promise<Notifications.PermissionStatus> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.error('Error getting notification status:', error);
      return { granted: false, ios: { status: -1 } } as any;
    }
  }

  static subscribeToNotifications(
    callback: (notification: Notifications.Notification) => void
  ): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      callback(response.notification);
    });

    return () => {
      subscription.remove();
    };
  }

  static async sendTestNotification(title: string, body: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          badge: 1,
        },
        trigger: {
          type: 'timeInterval',
          seconds: 1,
        },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  static async dismissAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error dismissing notifications:', error);
    }
  }

  static async getBadgeCountAsync(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  static async setBadgeCountAsync(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }
}
