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

// Optimistic update state. The displayed row of an activity is always rebuilt as
// lastKnownServerRow + every optimistic entry of that activity, in call order:
// - pending entries (request in flight or queued behind the same key)
// - committed entries (server said OK) that no refresh has proven yet: they stay
//   applied until a refresh that STARTED after their commit completes, so a GET
//   that read the DB before the commit can't revert them.
// Keys are `${activityId}:${type}:${rowId}`: requests on the same key run one
// after the other (in order, none dropped); different keys run in parallel.
interface OptimisticEntry {
  seq: number;
  activityId: number;
  key: string;
  mutate: (activity: Activity) => Activity;
  /** Value of refreshStarts when the server confirmed it; undefined while pending. */
  committedAt?: number;
}
let optimisticSeq = 0;
let refreshStarts = 0;
const optimisticEntries: OptimisticEntry[] = [];
const serverRows = new Map<number, Activity>();
const knownVersions = new Map<number, number>();
const keyTails = new Map<string, Promise<unknown>>();
export const $inflightKeys = atom<ReadonlySet<string>>(new Set());

export function inflightKey(activityId: number, type: string, rowId: unknown): string {
  return `${activityId}:${type}:${rowId ?? "*"}`;
}

function publishInflight() {
  $inflightKeys.set(new Set(optimisticEntries.filter((e) => e.committedAt === undefined).map((e) => e.key)));
}

/** Runs `task` after every earlier task of the same key has settled (per-key FIFO). */
export function runSerialized<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = keyTails.get(key) ?? Promise.resolve();
  const run = previous.then(task, task);
  const tail = run.catch(() => undefined);
  keyTails.set(key, tail);
  void tail.then(() => {
    if (keyTails.get(key) === tail) keyTails.delete(key);
  });
  return run;
}

function applyEntries(row: Activity, include: (entry: OptimisticEntry) => boolean): Activity {
  let result = row;
  for (const entry of optimisticEntries) {
    if (entry.activityId === row.id && include(entry)) result = entry.mutate(result);
  }
  return result;
}

function bumpKnownVersion(activityId: number, version: number | undefined) {
  knownVersions.set(activityId, Math.max(knownVersions.get(activityId) ?? 0, version ?? 0));
}

/** lastKnownServerRow + optimistic entries; the version never goes backwards. */
function buildRow(serverRow: Activity): Activity {
  bumpKnownVersion(serverRow.id, serverRow.version);
  return { ...applyEntries(serverRow, () => true), version: knownVersions.get(serverRow.id) };
}

function rebuildActivity(activityId: number) {
  const serverRow = serverRows.get(activityId);
  const current = $activities.get();
  const idx = current.findIndex((a) => a.id === activityId);
  if (!serverRow || idx === -1) return;
  const next = [...current];
  next[idx] = buildRow(serverRow);
  $activities.set(next);
  $dataVersion.set($dataVersion.get() + 1);
}

/** Registers an optimistic mutation and shows it immediately. Returns its handle. */
export function addOptimistic(activityId: number, key: string, mutate: (activity: Activity) => Activity): number {
  // Before the first refresh the displayed row is the server row (no entries yet)
  if (!serverRows.has(activityId)) {
    const row = $activities.get().find((a) => a.id === activityId);
    if (!row) throw new AppError("No se encontró la actividad", 404);
    serverRows.set(activityId, row);
  }
  const seq = ++optimisticSeq;
  optimisticEntries.push({ seq, activityId, key, mutate });
  publishInflight();
  rebuildActivity(activityId);
  return seq;
}

/** Base a request is built on: server row + already-committed entries (not other pending ones). */
export function committedBase(activityId: number): Activity | undefined {
  const serverRow = serverRows.get(activityId) ?? $activities.get().find((a) => a.id === activityId);
  return serverRow && applyEntries(serverRow, (e) => e.committedAt !== undefined);
}

export function commitOptimistic(seq: number, version: number) {
  const entry = optimisticEntries.find((e) => e.seq === seq);
  if (!entry) return;
  entry.committedAt = refreshStarts;
  bumpKnownVersion(entry.activityId, version);
  publishInflight();
  rebuildActivity(entry.activityId);
}

/** Drops only this mutation and rebuilds the row from the server row + the rest. */
export function dropOptimistic(seq: number) {
  const idx = optimisticEntries.findIndex((e) => e.seq === seq);
  if (idx === -1) return;
  const [entry] = optimisticEntries.splice(idx, 1);
  publishInflight();
  rebuildActivity(entry.activityId);
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
    // Committed mutations before this point may be missing from this response
    const startedAt = ++refreshStarts;
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
      // Merge activities: this response contains every mutation committed before
      // it started; keep re-applying the pending ones and the later commits
      for (let i = optimisticEntries.length - 1; i >= 0; i--) {
        const committedAt = optimisticEntries[i].committedAt;
        if (committedAt !== undefined && committedAt < startedAt) optimisticEntries.splice(i, 1);
      }
      serverRows.clear();
      for (const row of newActivities) serverRows.set(row.id, row);
      const mergedActivities = newActivities.map(buildRow);
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
