import { useEffect, useRef } from 'react';

export function usePolling(refreshFn: () => void, intervalMs = 5000) {
  const refreshRef = useRef(refreshFn);

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  useEffect(() => {
    if (!refreshRef.current) return;

    refreshRef.current();
    const interval = setInterval(() => {
      if (refreshRef.current) {
        refreshRef.current();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);
}
