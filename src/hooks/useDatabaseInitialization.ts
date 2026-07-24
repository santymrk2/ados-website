/**
 * useDatabaseInitialization Hook
 * Maneja la inicialización de la base de datos de forma correcta con React
 * - Usa useEffect para inicialización
 * - Limpia el EventSource al desmontar
 * - Maneja reconexiones de SSE
 * - Usa debounce para agrupar múltiples cambios rápidos
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { checkDbConnection, refreshData } from "@/store/appStore";

// Debounce delay para agrupar múltiples cambios SSE rápidos
const SSE_DEBOUNCE_MS = 500;

export function useDatabaseInitialization(enabled = true) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const connectSSERef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connectSSE = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource("/api/live");
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      if (event.data === "update") {
        // Debounce: si llegan múltiples eventos rápidos, solo hacer 1 refresh
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          debounceTimerRef.current = null;
          refreshData(false);
        }, SSE_DEBOUNCE_MS);
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
        refreshData(false);
        connectSSERef.current?.();
      }, 5000);
    };
  }, []);

  useEffect(() => {
    connectSSERef.current = connectSSE;
  }, [connectSSE]);

  const initialize = useCallback(async () => {
    if (!enabled) return;
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const isConnected = await checkDbConnection();
    if (isConnected) {
      await refreshData();
      connectSSE();
    }
  }, [connectSSE, enabled]);

  useEffect(() => {
    if (!enabled) {
      isInitializedRef.current = false;
      cleanup();
      return cleanup;
    }

    // Small delay to ensure React is ready
    const timeoutId = setTimeout(initialize, 100);

    return () => {
      // Cleanup on unmount
      clearTimeout(timeoutId);
      cleanup();
    };
  }, [cleanup, enabled, initialize]);

  return {
    reconnect: connectSSE,
  };
}
