import {
  $activities,
  $dataVersion,
  acquireInflight,
  applyPendingOptimistic,
  refreshData,
  releaseInflight,
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
 * - On success: bumps the row version in store + calls onSuccess(version)
 * - On error (409 or other): drops this mutation, restores the snapshot with the
 *   other in-flight mutations re-applied, and refetches server truth
 *
 * Concurrency: the in-flight lock is keyed per activity + row (`key`), so
 * mutations on different players/rows of the same activity can run in parallel
 * while a double-click on the same row is still rejected.
 *
 * @param activityId  - The activity to mutate
 * @param key         - In-flight key from `inflightKey(activityId, type, rowId)`
 * @param mutate      - Pure function: takes current row, returns patched row.
 *                      Must only touch the fields it needs (idempotent patch).
 * @param serverCall  - The async PATCH call. Must return { version: number }.
 * @param onSuccess   - Called with the server-returned version on success.
 * @param onConflict  - Called on VersionConflictError (409) after revert+refetch.
 */
export async function optimisticUpdateActivity(
  activityId: number,
  key: string,
  mutate: (activity: Activity) => Activity,
  serverCall: () => Promise<OptimisticResult>,
  onSuccess: (version: number) => void,
  onConflict?: () => void,
): Promise<void> {
  if (!acquireInflight(key, activityId, mutate)) {
    throw new AppError("Ya se está guardando este cambio. Esperá un momento.", 409);
  }

  // Declared outside try so it's visible in catch (block scoping)
  let previous: Activity | undefined;

  try {
    // 1. Snapshot the row before mutation
    const activities = $activities.get();
    const idx = activities.findIndex((a) => a.id === activityId);
    if (idx === -1) throw new AppError("No se encontró la actividad", 404);
    previous = { ...activities[idx] };

    // 2. Apply optimistic mutation immediately
    const updated = mutate({ ...previous });
    const newArr = [...activities];
    newArr[idx] = updated;
    $activities.set(newArr);

    // 3. Fire server call
    const result = await serverCall();

    // 4. Success: keep optimistic state, adopt the server version.
    //    Responses of concurrent calls may arrive out of order: never go back.
    releaseInflight(key);
    const current = $activities.get();
    const i = current.findIndex((a) => a.id === activityId);
    if (i !== -1) {
      const patched = [...current];
      patched[i] = { ...patched[i], version: Math.max(patched[i].version ?? 0, result.version) };
      $activities.set(patched);
      $dataVersion.set($dataVersion.get() + 1);
    }
    onSuccess(result.version);
  } catch (error) {
    releaseInflight(key);

    // Revert this mutation locally: snapshot + the other still-pending mutations
    const current = $activities.get();
    const i = current.findIndex((a) => a.id === activityId);
    if (previous && i !== -1) {
      const reverted = [...current];
      reverted[i] = applyPendingOptimistic(previous);
      $activities.set(reverted);
    }

    // Refetch server truth (pending mutations are re-applied by the store)
    void refreshData(false);

    if (error instanceof VersionConflictError) onConflict?.();
    throw error;
  }
}
