import { atom } from 'nanostores';
import { getParticipants, getActivities, checkDatabaseConnection } from '@/lib/db-utils';
import { syncTeamConstants } from '@/lib/constants';

// Auth State
export const $isAuthenticated = atom<boolean>(false);
export const $authLoading = atom<boolean>(true);
export const $role = atom<string>('admin'); // 'admin' or 'viewer'

// Database State
export const $participants = atom<any[]>([]);
export const $activities = atom<any[]>([]);
export const $rankings = atom<any[]>([]);
export const $dbLoading = atom<boolean>(true);
export const $dbError = atom<any>(null);
export const $dbConnected = atom<boolean>(false);
export const $dbChecked = atom<boolean>(false);

// UI State
export const $showSettings = atom<boolean>(false);
export const $showNotifications = atom<boolean>(false);

let isRefreshing = false;
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
    $dbError.set(e);
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
  if (isRefreshing) return;

  // Only show the loading spinner on the very first load, or when explicitly forced
  if (!initialLoadDone || forceLoader) {
    $dbLoading.set(true);
  }

  isRefreshing = true;
  let lastError: any = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (typeof window !== 'undefined') syncTeamConstants();
      const [p, a, rReq] = await Promise.all([getParticipants(), getActivities(), fetch('/api/rankings')]);
      const r = rReq.ok ? await rReq.json() : [];
      
      $participants.set(p || []);
      $activities.set(a || []);
      $rankings.set(r.data || r || []);
      $dbError.set(null);
      $dbConnected.set(true);
      // Success — exit the retry loop
      $dbLoading.set(false);
      isRefreshing = false;
      initialLoadDone = true;
      return;
    } catch (e: any) {
      lastError = e;
      console.warn(`Error loading DB (attempt ${attempt}/${MAX_RETRIES}):`, e.message);
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
    // $dbConnected is already set to false by checkDbConnection
  } else {
    // DB is reachable but data loading failed — keep connected, show a softer error
    $dbError.set(lastError);
  }

  $dbLoading.set(false);
  isRefreshing = false;
  initialLoadDone = true;
};

// Computed helper for Next IDs
export const getNextPid = () => {
  const p = $participants.get() || [];
  return Math.max(...p.map(x => x.id), 0) + 1;
};

export const getNextAid = () => {
  const a = $activities.get() || [];
  return Math.max(...a.map(x => x.id), 0) + 1;
};

// Initialize once on client
let eventSource: EventSource | null = null;

if (typeof window !== 'undefined') {
  setTimeout(async () => {
    const isConnected = await checkDbConnection();
    if (isConnected) {
      refreshData();
      
      // Setup Server-Sent Events for real-time updates without polling
      if (!eventSource) {
        const connectSSE = () => {
          eventSource = new EventSource('/api/live');
          
          eventSource.onmessage = (event) => {
            if (event.data === 'update') {
              console.log('Received live update from server. Refreshing data...');
              refreshData(false); // background refresh
            }
          };

          eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
              console.log('SSE connection closed, reconnecting in 5s...');
              eventSource = null;
              setTimeout(connectSSE, 5000);
            } else if (eventSource.readyState === EventSource.CONNECTING) {
              console.log('SSE connecting, waiting...');
            }
          };

          eventSource.onopen = () => {
            console.log('SSE connection established');
          };
        };
        
        connectSSE();
      }
    }
  }, 100);
}
