import { atom } from 'nanostores';
import { getParticipants, getActivities, checkDatabaseConnection } from "@/lib/api-client";
import { syncTeamConstants } from '@/lib/constants';
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
export const $showNotifications = atom<boolean>(false);

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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
  refreshPromise = doRefresh(forceLoader)
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

async function doRefresh(forceLoader: boolean): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (typeof window !== 'undefined') syncTeamConstants();
      const [p, a, rReq] = await Promise.all([
        getParticipants(),
        getActivities(),
        fetch(`/api/rankings?t=${Date.now()}`, { cache: 'no-store' })
      ]);

      // Handle both response formats: direct array or { success, data }
      const pData = p || [];
      const aData = a || [];
      const rJson = rReq.ok ? await rReq.json() : [];
      const rData = Array.isArray(rJson) ? rJson : (rJson.data || []);

      // Compare with existing data to detect changes
      const oldP = $participants.get();
      const oldA = $activities.get();
      const oldR = $rankings.get();

      const pChanged = pData.length !== oldP.length ||
        pData.some((p, i) => p.id !== oldP[i]?.id);
      const aChanged = aData.length !== oldA.length ||
        aData.some((a, i) => a.id !== oldA[i]?.id);
      const rChanged = rData.length !== oldR.length ||
        rData.some((r, i) => r.id !== oldR[i]?.id);

      // Force new array reference to ensure React re-renders
      const newParticipants = [...pData];
      const newActivities = [...aData];
      const newRankings = [...rData];

      // Update all atoms atomically to prevent inconsistent state
      $participants.set(newParticipants);
      $activities.set(newActivities);
      $rankings.set(newRankings);
      $dbError.set(null);
      $dbConnected.set(true);
      
      // Increment version to force React re-render
      $dataVersion.set($dataVersion.get() + 1);

      // Success — exit the retry loop
      $dbLoading.set(false);

      return;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(`Error loading DB (attempt ${attempt}/${MAX_RETRIES}):`, lastError.message);
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY);
      }
    }
  }

  // All retries exhausted — verify if the DB is truly unreachable
  console.error('All retries exhausted loading data. Checking DB connection...');
  const stillConnected = await checkDbConnection();
  if (!stillConnected) {
    $dbError.set(lastError);
  } else {
    // DB is reachable but data loading failed — keep connected, show a softer error
    $dbError.set(lastError);
  }

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
