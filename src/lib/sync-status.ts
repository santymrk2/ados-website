// ── Sync status types ────────────────────────────────────────────────────────

export type SyncState = "saved" | "saving" | "syncing" | "error" | "conflict";

export interface SyncStatus {
  state: SyncState;
  message?: string;
  /** Per-operation error details */
  errors?: SyncError[];
}

export interface SyncError {
  scope: string; // e.g. "attendance:42", "biblia:15"
  message: string;
  retryable: boolean;
  timestamp: number;
}

// ── Operation tracking ───────────────────────────────────────────────────────

export interface PendingOperation {
  id: string;
  type: string;
  scope: string;
  startedAt: number;
  retryCount: number;
  destructive: boolean;
  /** Snapshot of data before the op — for rollback */
  rollbackData?: unknown;
  rollbackFn?: () => void;
}

// ── Status helpers ───────────────────────────────────────────────────────────

export function initialSyncStatus(): SyncStatus {
  return { state: "saved" };
}

export function savingStatus(): SyncStatus {
  return { state: "saving" };
}

export function syncingStatus(): SyncStatus {
  return { state: "syncing", message: "Sincronizando..." };
}

export function errorStatus(message: string, errors?: SyncError[]): SyncStatus {
  return { state: "error", message, errors };
}

export function conflictStatus(message: string): SyncStatus {
  return { state: "conflict", message };
}

export function isStable(status: SyncStatus): boolean {
  return status.state === "saved" || status.state === "syncing";
}

export function isWorking(status: SyncStatus): boolean {
  return status.state === "saving" || status.state === "syncing";
}
