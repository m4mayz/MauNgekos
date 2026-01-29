import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as sqliteService from './sqliteService';
import * as kosService from './kosService';
import type { SyncQueueItem } from './sqliteService';
import type { Kos } from '@/types';

/**
 * Sync Service
 * Handles synchronization between Firestore and SQLite
 */

const LAST_SYNC_KEY = 'lastSyncTimestamp';
const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_RETRY_COUNT = 3;

let isCurrentlySyncing = false;
let networkUnsubscribe: (() => void) | null = null;

/**
 * Check if we need to sync based on last sync timestamp
 */
export async function shouldSync(): Promise<boolean> {
  try {
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
    if (!lastSyncStr) return true; // Never synced before

    const lastSync = parseInt(lastSyncStr, 10);
    const now = Date.now();
    const timeSinceLastSync = now - lastSync;

    console.log(`Last sync: ${Math.floor(timeSinceLastSync / 1000 / 60)} minutes ago`);

    return timeSinceLastSync > SYNC_INTERVAL;
  } catch (error) {
    console.error('Error checking if should sync:', error);
    return true; // Default to sync on error
  }
}

/**
 * Update last sync timestamp
 */
export async function updateLastSyncTimestamp(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error updating last sync timestamp:', error);
  }
}

/**
 * Check if device is currently online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const netState = await NetInfo.fetch();
    return netState.isConnected === true;
  } catch (error) {
    console.error('Error checking network state:', error);
    return false;
  }
}

/**
 * Full sync: Download all approved kos from Firestore to SQLite
 * This is the "simple strategy" - sync everything on launch
 */
export async function syncAllKosFromFirestore(forceSync = false): Promise<void> {
  // Prevent concurrent syncs
  if (isCurrentlySyncing) {
    console.log('Sync already in progress, skipping...');
    return;
  }

  try {
    isCurrentlySyncing = true;

    // Check if we should sync
    if (!forceSync && !(await shouldSync())) {
      console.log('Sync not needed yet (within interval)');
      return;
    }

    // Check network connectivity
    if (!(await isOnline())) {
      console.log('Device offline, skipping sync');
      return;
    }

    console.log('Starting full sync from Firestore...');
    const startTime = Date.now();

    // Get all approved kos from Firestore (direct fetch, bypass SQLite)
    const firestoreKos = await kosService.getApprovedKosFromFirestore();
    console.log(`Fetched ${firestoreKos.length} kos from Firestore`);

    // Batch insert to SQLite
    if (firestoreKos.length > 0) {
      await sqliteService.insertManyKos(firestoreKos);
    }

    // Update last sync timestamp
    await updateLastSyncTimestamp();

    const duration = Date.now() - startTime;
    console.log(`Full sync completed in ${duration}ms`);
  } catch (error) {
    console.error('Error syncing from Firestore:', error);
    throw error;
  } finally {
    isCurrentlySyncing = false;
  }
}

/**
 * Process sync queue: Push pending operations to Firestore
 */
export async function processSyncQueue(): Promise<void> {
  if (!(await isOnline())) {
    console.log('Device offline, cannot process sync queue');
    return;
  }

  try {
    const queue = await sqliteService.getSyncQueue();

    if (queue.length === 0) {
      console.log('Sync queue is empty');
      return;
    }

    console.log(`Processing ${queue.length} items in sync queue...`);

    for (const item of queue) {
      // Skip items that have exceeded max retries
      if (item.retryCount >= MAX_RETRY_COUNT) {
        console.warn(`Skipping item ${item.id} (max retries exceeded)`);
        // Optionally remove or mark as failed
        await sqliteService.removeSyncQueueItem(item.id);
        continue;
      }

      try {
        await processQueueItem(item);

        // Success - remove from queue
        await sqliteService.removeSyncQueueItem(item.id);
        console.log(`Successfully synced ${item.operation} for ${item.documentId}`);
      } catch (error: any) {
        console.error(`Error syncing item ${item.id}:`, error);

        // Update retry count and error message
        await sqliteService.updateSyncQueueItemError(item.id, error.message || 'Unknown error');
      }
    }

    console.log('Sync queue processing completed');
  } catch (error) {
    console.error('Error processing sync queue:', error);
  }
}

/**
 * Process a single queue item
 */
async function processQueueItem(item: SyncQueueItem): Promise<void> {
  const data = item.data ? JSON.parse(item.data) : null;

  switch (item.operation) {
    case 'create':
      if (item.collection === 'kos') {
        await kosService.createKos(data);
      }
      break;

    case 'update':
      if (item.collection === 'kos') {
        await kosService.updateKos(item.documentId, data);
      }
      break;

    case 'delete':
      if (item.collection === 'kos') {
        await kosService.deleteKos(item.documentId);
      }
      break;

    case 'updateStatus':
      if (item.collection === 'kos') {
        await kosService.updateKosStatus(item.documentId, data.status);
      }
      break;

    case 'save':
      // Save favorite to Firestore
      await kosService.saveKos(data.userId, item.documentId);
      // Mark as synced in SQLite
      await sqliteService.markFavoriteSynced(data.userId, item.documentId);
      break;

    case 'unsave':
      // Remove favorite from Firestore
      await kosService.unsaveKos(data.userId, item.documentId);
      break;

    default:
      console.warn(`Unknown operation: ${item.operation}`);
  }
}

/**
 * Sync a specific kos by ID from Firestore to SQLite
 */
export async function syncKosById(id: string): Promise<void> {
  if (!(await isOnline())) {
    console.log('Device offline, cannot sync kos');
    return;
  }

  try {
    const kos = await kosService.getKosById(id);
    if (kos) {
      await sqliteService.insertKos(kos);
      console.log(`Synced kos ${id} from Firestore to SQLite`);
    }
  } catch (error) {
    console.error(`Error syncing kos ${id}:`, error);
    throw error;
  }
}

/**
 * Initialize network listener to auto-sync when coming online
 */
export function startNetworkListener(): void {
  if (networkUnsubscribe) {
    console.log('Network listener already active');
    return;
  }

  console.log('Starting network listener...');

  networkUnsubscribe = NetInfo.addEventListener((state) => {
    console.log('Network state changed:', state.isConnected);

    // When device comes online, process sync queue
    if (state.isConnected) {
      console.log('Device is online, processing sync queue...');
      processSyncQueue().catch((error) => {
        console.error('Error processing sync queue on network change:', error);
      });

      // Also check if we need to do a full sync
      shouldSync().then((needsSync) => {
        if (needsSync) {
          console.log('Full sync needed, starting...');
          syncAllKosFromFirestore().catch((error) => {
            console.error('Error during auto-sync:', error);
          });
        }
      });
    }
  });
}

/**
 * Stop network listener (cleanup)
 */
export function stopNetworkListener(): void {
  if (networkUnsubscribe) {
    networkUnsubscribe();
    networkUnsubscribe = null;
    console.log('Network listener stopped');
  }
}

/**
 * Force a full sync (useful for pull-to-refresh)
 */
export async function forceSyncNow(): Promise<void> {
  console.log('Force syncing now...');
  await syncAllKosFromFirestore(true);
  await processSyncQueue();
}

/**
 * Get sync status information
 */
export async function getSyncStatus(): Promise<{
  lastSync: number | null;
  queueCount: number;
  isOnline: boolean;
}> {
  try {
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : null;
    const queue = await sqliteService.getSyncQueue();
    const online = await isOnline();

    return {
      lastSync,
      queueCount: queue.length,
      isOnline: online,
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return {
      lastSync: null,
      queueCount: 0,
      isOnline: false,
    };
  }
}
