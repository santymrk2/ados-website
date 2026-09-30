import { atom } from 'nanostores';
import { getParticipants, getActivities, checkDatabaseConnection } from "@/lib/api-client";
import { syncTeamConstants } from '@/lib/constants';
import { AppError } from '@/lib/errors';
import type { ParticipantBasic, Activity, Ranking } from '@/lib/types';

// Auth State
export const $isAuthenticated = atom<boolean>(false);
export const $authLoading = atom<boolean>(true);
export const $role = atom<string>('admin'); // 'admin' or 'viewer'

// Database State
export const $participants = atom<ParticipantBasic[]>([]);
export const $activities = atom<Activity[]>([]);
export const $rankings = atom<Ranking[]>([]);
export const $dbLoading = atom<boolean>(true);
export const $dbError = atom<Error | null>(null);
export const $dbConnected = atom<boolean>(false);
export const $dbChecked = atom<boolean>(false);

// Version counter - increments on each refresh to force React re-render
export const $dataVersion = atom<number>(0);

// UI State
export const $showSettings = atom<boolean>(false);

// Optimistic update state — tracks in-flight row-level mutations keyed by
// `${activityId}:${type}:${rowId}` so concurrent edits on different players/rows
// can run in parallel, and doRefresh() re-applies them on top of server data
// instead of overwriting them with stale state.
interface PendingOptimistic {
  activityId: number;
  mutate: (activity: Activity) => Activity;
}
export const pendingOptimistic = new Map<string, PendingOptimistic>();
export const $inflightKeys = atom<ReadonlySet<string>>(new Set());

export function inflightKey(activityId: number, type: string, rowId: unknown): string {
  return `${activityId}:${type}:${rowId ?? "*"}`;
}

export function acquireInflight(key: string, activityId: number, mutate: (activity: Activity) => Activity): boolean {
  if (pendingOptimistic.has(key)) return false;
  pendingOptimistic.set(key, { activityId, mutate });
  $inflightKeys.set(new Set(pendingOptimistic.keys()));
  return true;
}

export function releaseInflight(key: string) {
  pendingOptimistic.delete(key);
  $inflightKeys.set(new Set(pendingOptimistic.keys()));
}

/** Re-applies every in-flight optimistic mutation of this activity on top of `activity`. */
export function applyPendingOptimistic(activity: Activity): Activity {
  let result = activity;
  for (const pending of pendingOptimistic.values()) {
    if (pending.activityId === activity.id) result = pending.mutate(result);
  }
  return result;
}

// Promise-based locking to prevent race conditions
// Using a Promise instead of a boolean prevents race conditions between concurrent calls
let refreshPromise: Promise<void> | null = null;
let pendingRefresh = false;
let initialLoadDone = false;

export const checkDbConnection = async () => {
  try {
    await checkDatabaseConnection();
    $dbConnected.set(true);
    $dbError.set(null);
    return true;
  } catch (e) {
    console.error('DB Connection Error:', e);
    $dbConnected.set(false);
    $dbError.set(e instanceof Error ? e : new Error(String(e)));
    $dbLoading.set(false);
    return false;
  } finally {
    $dbChecked.set(true);
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const refreshData = async (forceLoader = false) => {
  // If a refresh is already in progress, wait for it instead of starting another
  if (refreshPromise) {
    pendingRefresh = true;
    return refreshPromise;
  }

  // Only show the loading spinner on the very first load, or when explicitly forced
  if (!initialLoadDone || forceLoader) {
    $dbLoading.set(true);
  }

  // Create the refresh promise and store it to prevent concurrent calls
  refreshPromise = doRefresh()
    .finally(async () => {
      refreshPromise = null;
      initialLoadDone = true;
      
      if (pendingRefresh) {
        pendingRefresh = false;
        await refreshData(false);
      }
    });

  return refreshPromise;
};

async function doRefresh(): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (typeof window !== 'undefined') syncTeamConstants();
      const [p, a, rReq] = await Promise.all([
        getParticipants(),
        getActivities(),
        fetch(`/api/rankings?t=${Date.now()}`, { cache: 'no-store' })
      ]);

      if (rReq.status === 401) throw new AppError('No autorizado', 401);

      // Handle both response formats: direct array or { success, data }
      const pData = p || [];
      const aData = a || [];
      // Keep the current rankings if the request failed instead of wiping them
      const rJson = rReq.ok ? await rReq.json() : null;
      const rData = rJson === null
        ? $rankings.get()
        : Array.isArray(rJson) ? rJson : (rJson.data || []);

      // Force new array reference to ensure React re-renders
      const newParticipants = [...pData];
      const newActivities = [...aData];
      const newRankings = [...rData];

      // Update all atoms atomically to prevent inconsistent state
      $participants.set(newParticipants);
      // Merge activities: re-apply in-flight optimistic mutations on top of
      // server data so pending rows aren't clobbered by stale state
      const mergedActivities = newActivities.map(applyPendingOptimistic);
      $activities.set(mergedActivities);
      $rankings.set(newRankings);
      $dbError.set(null);
      $dbConnected.set(true);
      
      // Increment version to force React re-render
      $dataVersion.set($dataVersion.get() + 1);

      // Success — exit the retry loop
      $dbLoading.set(false);

      return;
    } catch (e) {
      // Session expired: send the user back to the login instead of the "no DB connection" screen
      if (e instanceof AppError && e.status === 401) {
        $isAuthenticated.set(false);
        $dbLoading.set(false);
        return;
      }
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(`Error loading DB (attempt ${attempt}/${MAX_RETRIES}):`, lastError.message);
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY);
      }
    }
  }

  // All retries exhausted — verify if the DB is truly unreachable
  console.error('All retries exhausted loading data. Checking DB connection...');
  await checkDbConnection();
  $dbError.set(lastError);

  $dbLoading.set(false);
}

// Computed helper for Next IDs
export const getNextPid = () => {
  const p = $participants.get() || [];
  return Math.max(...p.map(x => x.id), 0) + 1;
};

export const getNextAid = () => {
  const a = $activities.get() || [];
  return Math.max(...a.map(x => x.id), 0) + 1;
};

// Export for use in hooks (not initialized at module level anymore)
// Initialization should be handled by useDatabaseInitialization hook
