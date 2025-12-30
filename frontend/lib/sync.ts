import { db } from './db';

const API_URL = 'http://localhost:3001/sync/push';

// Phase 2: Debounce sync operations to prevent rapid-fire requests
let syncPushTimeout: NodeJS.Timeout | null = null;
let syncPullTimeout: NodeJS.Timeout | null = null;

export async function syncPush() {
  // Clear existing timeout
  if (syncPushTimeout) {
    clearTimeout(syncPushTimeout);
  }

  // Debounce by 500ms
  return new Promise<void>((resolve) => {
    syncPushTimeout = setTimeout(async () => {
      await executeSyncPush();
      resolve();
    }, 500);
  });
}

async function executeSyncPush() {
  const exercises = await db.exercises.where('pendingSync').equals(1).toArray();
  const routines = await db.routines.where('pendingSync').equals(1).toArray();
  const logs = await db.workoutLogs.where('pendingSync').equals(1).toArray();
  
  // Get deleted routines from localStorage
  const deletedRoutinesStr = localStorage.getItem('deletedRoutines');
  const deletedRoutines: number[] = deletedRoutinesStr ? JSON.parse(deletedRoutinesStr) : [];

  if (exercises.length === 0 && routines.length === 0 && logs.length === 0 && deletedRoutines.length === 0) {
    console.log('No data to sync');
    return;
  }

  const payload = {
    exercises,
    routines,
    workoutLogs: logs,
    deletedRoutines
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
        console.log('Sync Successful');
        
        // Clear pending flags
        // We use bulkUpdate roughly where we just unset the pendingSync bit?
        // Actually Dexie bulkPut is easier if we have IDs.
        
        await db.transaction('rw', db.exercises, db.routines, db.workoutLogs, async () => {
            if (exercises.length) await db.exercises.bulkPut(exercises.map(e => ({ ...e, pendingSync: 0 })));
            if (routines.length) await db.routines.bulkPut(routines.map(r => ({ ...r, pendingSync: 0 })));
            if (logs.length) await db.workoutLogs.bulkPut(logs.map(l => ({ ...l, pendingSync: 0 })));
        });
        
        // Clear deleted routines list after successful sync
        if (deletedRoutines.length > 0) {
          localStorage.removeItem('deletedRoutines');
        }
        
    } else {
        console.error('Sync Failed', res.statusText);
    }
  } catch (err) {
    console.error('Sync Network Error', err);
  }
}

export async function syncPull() {
  // Clear existing timeout
  if (syncPullTimeout) {
    clearTimeout(syncPullTimeout);
  }

  // Debounce by 500ms
  return new Promise<void>((resolve, reject) => {
    syncPullTimeout = setTimeout(async () => {
      try {
        await executeSyncPull();
        resolve();
      } catch (error) {
        reject(error);
      }
    }, 500);
  });
}

async function executeSyncPull() {
  try {
    const res = await fetch('http://localhost:3001/sync/pull');
    if (!res.ok) throw new Error('Failed to fetch sync data');
    
    const data = await res.json();
    console.log('Pulling data...', data);

    await db.transaction('rw', db.exercises, db.routines, db.workoutLogs, async () => {
       if (data.exercises && data.exercises.length > 0) {
           // We use bulkPut to update existing by ID or insert new
           // Needs careful mapping. Backend might return snake_case or different structure?
           // The backend returns { ...e, equipment: JSON.parse(...) } which matches our needs mostly.
           // However, backend has 'created_at' snake_case, frontend ID is number.
           // We need to ensure we don't duplicate if ID is missing or mismatch.
           // For now, let's simplisticly put.
           await db.exercises.bulkPut(data.exercises);
       }
       
       if (data.routines && data.routines.length > 0) {
           await db.routines.bulkPut(data.routines);
       }

       if (data.workoutLogs && data.workoutLogs.length > 0) {
           await db.workoutLogs.bulkPut(data.workoutLogs);
       }
    });

    console.log('Sync Pull Complete');
  } catch (err) {
    console.error('Sync Pull Error', err);
  }
}
