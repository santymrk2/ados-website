/**
 * useDatabaseInitialization Hook
 * Maneja la inicialización de la base de datos de forma correcta con React
 * - Usa useEffect para inicialización
 * - Limpia el EventSource al desmontar
 * -Maneja reconexiones de SSE
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { checkDbConnection, refreshData } from "@/store/appStore";

export function useDatabaseInitialization() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const isInitializedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectSSE = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("/api/live");
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {

      if (event.data === "update") {

        setTimeout(() => {
          refreshData(false);
        }, 100);
      }
    };

    eventSource.onerror = () => {
      console.error("[SSE Client] Error");
      // Close and schedule reconnection
      eventSource.close();
      eventSourceRef.current = null;

      // Schedule reconnection in 5 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        // Re-call connectSSE by accessing it through the ref would not work
        // since ref.current is null. Instead, we trigger a page-level refresh
        // which will re-initialize the connection through the useEffect
        refreshData(false);
      }, 5000);
    };


  }, []);

  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const isConnected = await checkDbConnection();
    if (isConnected) {
      await refreshData();
      connectSSE();
    }
  }, [connectSSE]);

  useEffect(() => {
    // Small delay to ensure React is ready
    const timeoutId = setTimeout(initialize, 100);

    return () => {
      // Cleanup on unmount
      clearTimeout(timeoutId);

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [initialize]);

  return {
    reconnect: connectSSE,
  };
}
