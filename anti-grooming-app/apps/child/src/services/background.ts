import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { monitoringService } from './monitoring';

const BACKGROUND_TASK_NAME = 'taro-background-monitoring';

// Definir la tarea de background
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    console.log('Background task started:', BACKGROUND_TASK_NAME);

    // Ejecutar el ciclo de monitoreo
    // En producción, esto sería más sofisticado
    // (interceptar notificaciones reales, etc.)

    console.log('Background task completed');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export class BackgroundService {
  private static isRegistered = false;

  static async registerBackgroundTask(): Promise<void> {
    if (this.isRegistered) return;

    try {
      const status = await BackgroundFetch.getStatusAsync();

      // Solicitar permiso si es necesario
      if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
        console.log('Background fetch is restricted');
        return;
      }

      if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
        console.log('Background fetch is denied');
        return;
      }

      // Registrar la tarea con intervalo de 15 minutos mínimo
      // En iOS, el intervalo real es controlado por el sistema
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 15 * 60, // 15 minutos
        stopOnTerminate: false, // Continuar incluso si la app se cierra
        startOnBoot: true, // Iniciar al encender el dispositivo
      });

      this.isRegistered = true;
      console.log('Background task registered successfully');
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  }

  static async unregisterBackgroundTask(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      this.isRegistered = false;
      console.log('Background task unregistered');
    } catch (error) {
      console.error('Failed to unregister background task:', error);
    }
  }

  static async getTaskStatus(): Promise<boolean> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
      return isRegistered;
    } catch (error) {
      console.error('Error getting task status:', error);
      return false;
    }
  }
}

// Inicializar el servicio al cargar el módulo
BackgroundService.registerBackgroundTask().catch(console.error);
