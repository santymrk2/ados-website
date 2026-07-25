import {
  $activities,
  $dataVersion,
  acquireInflight,
  releaseInflight,
} from "@/store/appStore";
import { VersionConflictError } from "@/lib/errors";
import type { Activity } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────

export interface OptimisticResult {
  version: number;
}

// ── Core ───────────────────────────────────────────────────────────────────

/**
 * Applies a local mutation immediately, fires a server call, and reconciles.
 *
 * - On success: updates version in store + calls onSuccess(version)
 * - On 409: reverts to snapshot, mandatory refetch of that row, calls onConflict
 * - On other error: reverts to snapshot only
 *
 * @param activityId  - The activity to mutate
 * @param mutate      - Pure function: takes current row, returns patched row.
 *                      Must only touch the fields it needs (idempotent patch).
 * @param serverCall  - The async PATCH call. Must return { version: number }.
 * @param onSuccess   - Called with the server-returned version on success.
 * @param onConflict  - Called on VersionConflictError (409) after revert+refetch.
 */
export async function optimisticUpdateActivity(
  activityId: number,
  mutate: (activity: Activity) => Activity,
  serverCall: () => Promise<OptimisticResult>,
  onSuccess: (version: number) => void,
  onConflict?: () => void,
): Promise<void> {
  if (!acquireInflight(activityId)) {
    throw new Error("Optimistic update already in progress for this activity");
  }

  // Declared outside try so it's visible in catch (block scoping)
  let previous: Activity | undefined;

  try {
    // 1. Snapshot the row before mutation
    const activities = $activities.get();
    const idx = activities.findIndex((a) => a.id === activityId);
    if (idx === -1) throw new Error("Activity not found in store");
    previous = { ...activities[idx] };

    // 2. Apply optimistic mutation immediately
    const updated = mutate({ ...previous });
    const newArr = [...activities];
    newArr[idx] = updated;
    $activities.set(newArr);

    // 3. Fire server call
    const result = await serverCall();

    // 4. Success: reconcile with server truth
    //    Always use result.version from the server, never assume local state
    const current = $activities.get();
    const i = current.findIndex((a) => a.id === activityId);
    if (i !== -1) {
      const patched = [...current];
      patched[i] = { ...patched[i], version: result.version };
      $activities.set(patched);
      $dataVersion.set($dataVersion.get() + 1);
    }
    onSuccess(result.version);
  } catch (error) {
    if (error instanceof VersionConflictError) {
      // Revert only this row to snapshot
      const current = $activities.get();
      const i = current.findIndex((a) => a.id === activityId);
      if (previous && i !== -1) {
        const reverted = [...current];
        reverted[i] = previous;
        $activities.set(reverted);
      }

      // Mandatory refetch of this specific row from the server
      try {
        const { getActivities } = await import("@/lib/api-client");
        const { mergeActivityIntoStore } = await import("@/store/appStore");
        const allActs = await getActivities();
        const fresh = allActs.find((a: Activity) => a.id === activityId);
        if (fresh) {
          mergeActivityIntoStore(fresh);
        }
      } catch {
        // Refetch failed — the snapshot revert is still the best we have
        console.error("[OptimisticUpdate] Failed to refetch activity after 409");
      }

      onConflict?.();
      throw error;
    }

    // Non-conflict error: revert only, no refetch
    const current = $activities.get();
    const i = current.findIndex((a) => a.id === activityId);
    if (previous && i !== -1) {
      const reverted = [...current];
      reverted[i] = previous;
      $activities.set(reverted);
    }
    throw error;
  } finally {
    releaseInflight(activityId);
  }
}
