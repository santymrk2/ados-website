import {
  addOptimistic,
  commitOptimistic,
  committedBase,
  dropOptimistic,
  refreshData,
  runSerialized,
} from "@/store/appStore";
import { AppError, VersionConflictError } from "@/lib/errors";
import type { Activity } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────

export interface OptimisticResult {
  version: number;
}

// ── Core ───────────────────────────────────────────────────────────────────

/**
 * Applies a local mutation immediately, fires a server call, and reconciles.
 *
 * - The mutation shows at once and stays applied (see appStore) while pending,
 *   and after success until a refresh started after the commit lands.
 * - On error (409 or other): drops only this mutation, rebuilds the row from the
 *   last server row + the remaining mutations, and refetches server truth.
 *
 * Concurrency: requests with the same `key` are queued and sent one after the
 * other in call order (none dropped, so the latest intent is persisted last);
 * different keys run in parallel.
 *
 * @param activityId  - The activity to mutate
 * @param key         - In-flight key from `inflightKey(activityId, type, rowId)`
 * @param mutate      - Pure function: takes current row, returns patched row.
 *                      Must only touch the fields it needs (idempotent patch).
 * @param serverCall  - The async PATCH call, sent when its turn comes. Receives the
 *                      base it applies to (server row + committed mutations) to
 *                      build compare-and-set fields. Must return { version }.
 * @param onSuccess   - Called with the server-returned version on success.
 * @param onConflict  - Called on VersionConflictError (409) after revert+refetch.
 */
export async function optimisticUpdateActivity(
  activityId: number,
  key: string,
  mutate: (activity: Activity) => Activity,
  serverCall: (base: Activity) => Promise<OptimisticResult>,
  onSuccess: (version: number) => void,
  onConflict?: () => void,
): Promise<void> {
  const seq = addOptimistic(activityId, key, mutate);

  try {
    const result = await runSerialized(key, () => {
      const base = committedBase(activityId);
      if (!base) throw new AppError("No se encontró la actividad", 404);
      return serverCall(base);
    });
    commitOptimistic(seq, result.version);
    onSuccess(result.version);
  } catch (error) {
    dropOptimistic(seq);

    // Refetch server truth (remaining mutations are re-applied by the store)
    void refreshData(false);

    if (error instanceof VersionConflictError) onConflict?.();
    throw error;
  }
}
