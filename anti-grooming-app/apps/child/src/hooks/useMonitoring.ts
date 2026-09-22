import { useEffect, useState, useCallback } from 'react';
import { MonitoringEvent, Alert } from '@anti-grooming/shared';
import { monitoringService } from '../services/monitoring';

export function useMonitoring() {
  const [isActive, setIsActive] = useState(false);
  const [lastAlert, setLastAlert] = useState<Alert | null>(null);
  const [lastEvent, setLastEvent] = useState<MonitoringEvent | null>(null);
  const [stats, setStats] = useState({ alerts: 0, events: 0 });

  useEffect(() => {
    monitoringService.start();
    setIsActive(true);

    const unsubscribeAlert = monitoringService.onAlert((alert) => {
      setLastAlert(alert);
      setStats((prev) => ({ ...prev, alerts: prev.alerts + 1 }));
    });

    const unsubscribeEvent = monitoringService.onEvent((event) => {
      setLastEvent(event);
      setStats((prev) => ({ ...prev, events: prev.events + 1 }));
    });

    return () => {
      unsubscribeAlert();
      unsubscribeEvent();
      monitoringService.stop();
    };
  }, []);

  const simulateGrooming = useCallback(async () => {
    await monitoringService.simulateGroomingAttempt();
  }, []);

  const analyzeText = useCallback(async (text: string, source: string) => {
    await monitoringService.analyzeText(text, source);
  }, []);

  return {
    isActive,
    lastAlert,
    lastEvent,
    stats,
    simulateGrooming,
    analyzeText,
  };
}
