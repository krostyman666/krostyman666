import { useEffect, useState, useCallback } from 'react';
import { Alert, LocalStorage, Device } from '@anti-grooming/shared';

export function useSyncAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreviewedCount, setUnreviewedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const allAlerts = await LocalStorage.getAlerts();
      const unreviewed = allAlerts.filter((a) => !a.reviewed);

      setAlerts(allAlerts.sort((a, b) => b.timestamp - a.timestamp));
      setUnreviewedCount(unreviewed.length);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading alerts';
      setError(message);
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const markAsReviewed = useCallback(
    async (alertId: string) => {
      try {
        await LocalStorage.markAlertAsReviewed(alertId);
        await loadAlerts();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error marking alert as reviewed';
        setError(message);
        console.error('Error marking as reviewed:', err);
      }
    },
    [loadAlerts]
  );

  const deleteAlert = useCallback(
    async (alertId: string) => {
      try {
        await LocalStorage.deleteAlert(alertId);
        await loadAlerts();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error deleting alert';
        setError(message);
        console.error('Error deleting alert:', err);
      }
    },
    [loadAlerts]
  );

  return {
    alerts,
    unreviewedCount,
    loading,
    error,
    loadAlerts,
    markAsReviewed,
    deleteAlert,
  };
}
