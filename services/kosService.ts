import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Kos, KosFilter, KosStatus, KosType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as sqliteService from './sqliteService';
import * as syncService from './syncService';

const COLLECTION_NAME = 'kos';

// Flag to control SQLite usage (can be disabled for debugging)
const USE_SQLITE = true;

/**
 * Get all approved kos directly from Firestore (for sync operations)
 * This bypasses SQLite and always reads from cloud
 * Also includes kos with status=pending that were previously approved (keeps them on map during re-review)
 */
export async function getApprovedKosFromFirestore(): Promise<Kos[]> {
  // Query 1: Get approved kos
  const q1 = query(
    collection(db, COLLECTION_NAME),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc')
  );
  const snapshot1 = await getDocs(q1);
  const approvedKos = snapshot1.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Kos[];

  // Query 2: Get pending kos that were previously approved
  // Note: This requires a composite index in Firestore
  try {
    const q2 = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'pending'),
      where('previousStatus', '==', 'approved')
    );
    const snapshot2 = await getDocs(q2);
    const pendingButWasApproved = snapshot2.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Kos[];

    // Combine and sort by createdAt
    const allKos = [...approvedKos, ...pendingButWasApproved];
    allKos.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    console.log(
      '[getApprovedKosFromFirestore] Total:',
      allKos.length,
      '(approved:',
      approvedKos.length,
      ', pending-was-approved:',
      pendingButWasApproved.length,
      ')'
    );
    return allKos;
  } catch (error: any) {
    // If composite index doesn't exist, fallback to client-side filtering
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      console.warn(
        '[getApprovedKosFromFirestore] Composite index not found, using client-side filter. Please create index in Firebase Console.'
      );
      console.warn('Index URL will be in the error message above.');

      // Fallback: get all pending kos and filter client-side
      const q2Fallback = query(collection(db, COLLECTION_NAME), where('status', '==', 'pending'));
      const snapshot2 = await getDocs(q2Fallback);
      const allPending = snapshot2.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Kos[];

      // Client-side filter for previousStatus === 'approved'
      const pendingButWasApproved = allPending.filter(
        (kos: any) => kos.previousStatus === 'approved'
      );

      const allKos = [...approvedKos, ...pendingButWasApproved];
      allKos.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      console.log(
        '[getApprovedKosFromFirestore] Total (fallback):',
        allKos.length,
        '(approved:',
        approvedKos.length,
        ', pending-was-approved:',
        pendingButWasApproved.length,
        ')'
      );
      return allKos;
    }
    throw error;
  }
}

/**
 * Get all approved kos (for map display)
 * Online-first strategy: when online, fetches from Firebase and updates cache in background
 * When offline, reads from local SQLite cache
 * @param forceRefresh - If true, always fetches from Firestore regardless of online status
 */
export async function getApprovedKos(forceRefresh: boolean = false): Promise<Kos[]> {
  if (!USE_SQLITE) {
    // SQLite disabled - just use Firestore
    return await getApprovedKosFromFirestore();
  }

  if (forceRefresh) {
    // Force refresh: get from Firestore and update SQLite cache
    console.log('[getApprovedKos] Force refresh - fetching from Firestore and updating cache');
    try {
      const freshData = await getApprovedKosFromFirestore();

      // Update SQLite cache (await to ensure completion)
      if (freshData.length > 0) {
        try {
          await sqliteService.insertManyKos(freshData);
          console.log('[getApprovedKos] Cache updated successfully after force refresh');
        } catch (cacheError) {
          console.error('[getApprovedKos] Error updating cache after refresh:', cacheError);
          // Continue anyway - we have fresh data from Firestore
        }
      }

      return freshData;
    } catch (error) {
      console.error('[getApprovedKos] Force refresh failed:', error);
      // Fallback to cached data if Firestore fails
      try {
        return await sqliteService.getAllApprovedKos();
      } catch (sqliteError) {
        console.error('[getApprovedKos] SQLite fallback also failed:', sqliteError);
        return [];
      }
    }
  }

  try {
    // Check if we're online first
    const isOnline = await syncService.isOnline();

    if (isOnline) {
      console.log('[getApprovedKos] Online detected - fetching fresh data from Firebase first');
      try {
        // When online, fetch from Firebase first to ensure fresh data
        const freshData = await getApprovedKosFromFirestore();

        // Update SQLite cache in background (don't await)
        if (freshData.length > 0) {
          sqliteService
            .insertManyKos(freshData)
            .then(() => {
              console.log(
                '[getApprovedKos] Cache updated with',
                freshData.length,
                'kos from Firebase'
              );
              syncService.updateLastSyncTimestamp();
            })
            .catch((cacheError) => {
              console.error('[getApprovedKos] Cache update failed:', cacheError);
            });
        }

        return freshData;
      } catch (firebaseError) {
        console.error(
          '[getApprovedKos] Firebase fetch failed, falling back to cache:',
          firebaseError
        );
        // Fallback to cache if Firebase fails
        return await sqliteService.getAllApprovedKos();
      }
    }

    // Offline: Read from SQLite cache
    console.log('[getApprovedKos] Offline - using SQLite cache');
    const localKos = await sqliteService.getAllApprovedKos();
    return localKos;
  } catch (error) {
    console.error('Error reading from SQLite, falling back to Firestore:', error);
    // Fallback to Firestore on SQLite error - use combined query
    return await getApprovedKosFromFirestore();
  }
}

/**
 * Get kos with filters (for search)
 * Uses SQLite for offline filtering
 */
export async function getFilteredKos(filters: KosFilter): Promise<Kos[]> {
  if (!USE_SQLITE) {
    // Fallback to Firestore with client-side filtering
    let q = query(collection(db, COLLECTION_NAME), where('status', '==', 'approved'));
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Kos[];

    // Client-side filtering
    if (filters.priceMin !== undefined) {
      results = results.filter((kos) => kos.priceMin >= filters.priceMin!);
    }

    if (filters.priceMax !== undefined) {
      results = results.filter((kos) => kos.priceMax <= filters.priceMax!);
    }

    if (filters.type) {
      results = results.filter((kos) => kos.type === filters.type);
    }

    if (filters.facilities && filters.facilities.length > 0) {
      results = results.filter((kos) =>
        filters.facilities!.every((f) => kos.facilities.includes(f))
      );
    }

    if (filters.hasAvailableRooms) {
      results = results.filter((kos) => kos.availableRooms > 0);
    }

    return results;
  }

  try {
    // Use SQLite filtering (works offline)
    return await sqliteService.getFilteredKos(filters);
  } catch (error) {
    console.error('Error filtering from SQLite, falling back to Firestore:', error);
    // Fallback to Firestore
    let q = query(collection(db, COLLECTION_NAME), where('status', '==', 'approved'));
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Kos[];

    // Client-side filtering
    if (filters.priceMin !== undefined) {
      results = results.filter((kos) => kos.priceMin >= filters.priceMin!);
    }

    if (filters.priceMax !== undefined) {
      results = results.filter((kos) => kos.priceMax <= filters.priceMax!);
    }

    if (filters.type) {
      results = results.filter((kos) => kos.type === filters.type);
    }

    if (filters.facilities && filters.facilities.length > 0) {
      results = results.filter((kos) =>
        filters.facilities!.every((f) => kos.facilities.includes(f))
      );
    }

    if (filters.hasAvailableRooms) {
      results = results.filter((kos) => kos.availableRooms > 0);
    }

    return results;
  }
}

/**
 * Get kos by owner ID (for penyewa dashboard)
 * Uses SQLite cache with Firestore fallback
 */
/**
 * Get kos by owner ID
 * Always reads from Firestore (not cached) to ensure owner sees latest status
 */
export async function getKosByOwner(ownerId: string): Promise<Kos[]> {
  console.log('[getKosByOwner] Fetching kos for owner:', ownerId);

  // Always use Firestore for owner's kos list (not cached in SQLite)
  // This ensures owner always sees their kos with latest status (pending/approved/rejected)
  const q = query(
    collection(db, COLLECTION_NAME),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  );

  try {
    const snapshot = await getDocs(q);
    const result = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Kos[];

    console.log('[getKosByOwner] Found', result.length, 'kos for owner:', ownerId);
    return result;
  } catch (error) {
    console.error('[getKosByOwner] Error fetching from Firestore:', error);
    throw error;
  }
}

/**
 * Get pending kos (for admin approval)
 * Uses SQLite cache with Firestore fallback
 * @param forceRefresh - If true, bypasses cache and reads directly from Firestore, then updates local cache
 */
export async function getPendingKos(forceRefresh: boolean = false): Promise<Kos[]> {
  if (!USE_SQLITE) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Kos[];
  }

  if (forceRefresh) {
    console.log('[getPendingKos] Force refresh - fetching from Firestore and updating cache');
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const freshData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Kos[];

      // Update SQLite cache in background
      if (freshData.length > 0) {
        sqliteService
          .insertManyKos(freshData)
          .then(() => console.log('[getPendingKos] Cache updated successfully'))
          .catch((cacheError) => console.error('[getPendingKos] Cache update failed:', cacheError));
      }

      return freshData;
    } catch (error) {
      console.error('[getPendingKos] Force refresh failed, falling back to cache:', error);
      return await sqliteService.getKosByStatus('pending');
    }
  }

  try {
    // Check if online
    const isOnline = await syncService.isOnline();

    if (isOnline) {
      console.log('[getPendingKos] Online - fetching fresh data from Firebase');
      try {
        const q = query(
          collection(db, COLLECTION_NAME),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const freshData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Kos[];

        // Update cache in background
        if (freshData.length > 0) {
          sqliteService
            .insertManyKos(freshData)
            .then(() => console.log('[getPendingKos] Cache updated'))
            .catch((err) => console.error('[getPendingKos] Cache update failed:', err));
        }

        return freshData;
      } catch (firebaseError) {
        console.error('[getPendingKos] Firebase fetch failed, using cache:', firebaseError);
        return await sqliteService.getKosByStatus('pending');
      }
    }

    // Offline - use cache
    console.log('[getPendingKos] Offline - using cache');
    return await sqliteService.getKosByStatus('pending');
  } catch (error) {
    console.error('[getPendingKos] Error, falling back to Firestore:', error);
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Kos[];
  }
}

/**
 * Get single kos by ID
 */
export async function getKosById(id: string): Promise<Kos | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Kos;
  }

  return null;
}

/**
 * Create new kos
 * If online: write to Firestore directly
 * If offline: queue for sync
 */
export async function createKos(
  data: Omit<Kos, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const isOnline = await syncService.isOnline();

  if (isOnline) {
    // Online: write to Firestore directly
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      status: 'pending' as KosStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Also save to SQLite cache
    if (USE_SQLITE) {
      try {
        const newKos: Kos = {
          id: docRef.id,
          ...data,
          status: 'pending',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        await sqliteService.insertKos(newKos);
      } catch (error) {
        console.error('Error caching created kos to SQLite:', error);
      }
    }

    return docRef.id;
  } else {
    // Offline: generate temp ID and queue for sync
    const tempId = `temp_${Date.now()}`;

    if (USE_SQLITE) {
      // Add to sync queue
      await sqliteService.addToSyncQueue('create', COLLECTION_NAME, tempId, data);

      // Optimistically add to SQLite
      const newKos: Kos = {
        id: tempId,
        ...data,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await sqliteService.insertKos(newKos);
    }

    return tempId;
  }
}

/**
 * Update kos
 * If online: write to Firestore directly
 * If offline: queue for sync
 */
export async function updateKos(
  id: string,
  data: Partial<Omit<Kos, 'id' | 'createdAt'>>
): Promise<void> {
  const isOnline = await syncService.isOnline();

  if (isOnline) {
    // Online: write to Firestore
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    // Update SQLite cache
    if (USE_SQLITE) {
      try {
        await sqliteService.updateKos(id, data as any);
      } catch (error) {
        console.error('Error updating kos in SQLite:', error);
      }
    }
  } else {
    // Offline: queue for sync
    if (USE_SQLITE) {
      await sqliteService.addToSyncQueue('update', COLLECTION_NAME, id, data);
      // Optimistically update SQLite
      await sqliteService.updateKos(id, data as any);
    }
  }
}

/**
 * Update kos status (for admin)
 * If online: write to Firestore directly
 * If offline: queue for sync
 */
export async function updateKosStatus(id: string, status: KosStatus): Promise<void> {
  const isOnline = await syncService.isOnline();

  if (isOnline) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });

    // Update SQLite cache
    if (USE_SQLITE) {
      try {
        await sqliteService.updateKos(id, { status } as any);
      } catch (error) {
        console.error('Error updating kos status in SQLite:', error);
      }
    }
  } else {
    // Offline: queue for sync
    if (USE_SQLITE) {
      await sqliteService.addToSyncQueue('updateStatus', COLLECTION_NAME, id, { status });
      // Optimistically update SQLite
      await sqliteService.updateKos(id, { status } as any);
    }
  }
}

/**
 * Delete kos
 * If online: delete from Firestore directly
 * If offline: queue for sync
 */
export async function deleteKos(id: string): Promise<void> {
  const isOnline = await syncService.isOnline();

  if (isOnline) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    // Delete from SQLite cache
    if (USE_SQLITE) {
      try {
        await sqliteService.deleteKos(id);
      } catch (error) {
        console.error('Error deleting kos from SQLite:', error);
      }
    }
  } else {
    // Offline: queue for sync
    if (USE_SQLITE) {
      await sqliteService.addToSyncQueue('delete', COLLECTION_NAME, id);
      // Optimistically delete from SQLite
      await sqliteService.deleteKos(id);
    }
  }
}

/**
 * Create GeoPoint from latitude and longitude
 */
export function createGeoPoint(lat: number, lng: number): GeoPoint {
  return new GeoPoint(lat, lng);
}

/**
 * Save kos to user's favorites (optimistic with AsyncStorage cache)
 */
export async function saveKos(userId: string, kosId: string): Promise<void> {
  console.log('[saveKos] Saving kos:', { userId, kosId });
  const cacheKey = `savedKos_${userId}`;

  try {
    // 1. Update local cache first (optimistic)
    const cachedData = await AsyncStorage.getItem(cacheKey);
    const currentSavedKos = cachedData ? JSON.parse(cachedData) : [];

    if (!currentSavedKos.includes(kosId)) {
      const newSavedKos = [...currentSavedKos, kosId];
      await AsyncStorage.setItem(cacheKey, JSON.stringify(newSavedKos));
      console.log('[saveKos] Updated local cache:', newSavedKos);
    }

    // 2. Sync to Firestore in background (no await for instant response)
    syncSaveToFirestore(userId, kosId).catch((error) => {
      console.error('[saveKos] Background sync failed:', error);
      // Auto-rollback cache on failure
      AsyncStorage.setItem(cacheKey, JSON.stringify(currentSavedKos));
    });
  } catch (error) {
    console.error('[saveKos] Error:', error);
    throw error;
  }
}

/**
 * Background sync to Firestore (called by saveKos)
 */
async function syncSaveToFirestore(userId: string, kosId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    const savedKos = userData.savedKos || [];

    if (!savedKos.includes(kosId)) {
      await updateDoc(userRef, {
        savedKos: [...savedKos, kosId],
      });
      console.log('[syncSaveToFirestore] Synced to Firestore:', kosId);
    }
  } else {
    console.error('[syncSaveToFirestore] User document not found:', userId);
    throw new Error('User not found');
  }
}

/**
 * Remove kos from user's favorites (optimistic with AsyncStorage cache)
 */
export async function unsaveKos(userId: string, kosId: string): Promise<void> {
  console.log('[unsaveKos] Removing kos:', { userId, kosId });
  const cacheKey = `savedKos_${userId}`;

  try {
    // 1. Update local cache first (optimistic)
    const cachedData = await AsyncStorage.getItem(cacheKey);
    const currentSavedKos = cachedData ? JSON.parse(cachedData) : [];
    const newSavedKos = currentSavedKos.filter((id: string) => id !== kosId);

    await AsyncStorage.setItem(cacheKey, JSON.stringify(newSavedKos));
    console.log('[unsaveKos] Updated local cache:', newSavedKos);

    // 2. Sync to Firestore in background
    syncUnsaveToFirestore(userId, kosId).catch((error) => {
      console.error('[unsaveKos] Background sync failed:', error);
      // Auto-rollback cache on failure
      AsyncStorage.setItem(cacheKey, JSON.stringify(currentSavedKos));
    });
  } catch (error) {
    console.error('[unsaveKos] Error:', error);
    throw error;
  }
}

/**
 * Background sync to Firestore (called by unsaveKos)
 */
async function syncUnsaveToFirestore(userId: string, kosId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    const savedKos = userData.savedKos || [];

    await updateDoc(userRef, {
      savedKos: savedKos.filter((id: string) => id !== kosId),
    });
    console.log('[syncUnsaveToFirestore] Synced to Firestore:', kosId);
  }
}

/**
 * Get saved kos by user ID (with cache-first strategy + auto-update)
 * @param userId - User ID
 * @param forceRefresh - If true, bypass cache and force fetch from Firestore
 * @param onDataUpdated - Callback triggered when fresh data arrives from Firestore (for auto UI update)
 */
export async function getSavedKos(
  userId: string,
  forceRefresh: boolean = false,
  onDataUpdated?: (freshData: Kos[]) => void
): Promise<Kos[]> {
  console.log('[getSavedKos] Fetching saved kos for user:', userId);
  const cacheKey = `savedKos_${userId}`;

  // Try to get from cache first (instant load)
  let savedKosIds: string[] = [];
  if (!forceRefresh) {
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        savedKosIds = JSON.parse(cachedData);
        console.log('[getSavedKos] Loaded from cache:', savedKosIds);
      }
    } catch (error) {
      console.error('[getSavedKos] Cache read error:', error);
    }
  }

  // Fetch from Firestore in background to sync cache and trigger callback
  fetchAndCacheSavedKos(userId, cacheKey, onDataUpdated).catch(console.error);

  // If cache is empty or force refresh, wait for Firestore
  if (savedKosIds.length === 0 || forceRefresh) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log('[getSavedKos] User document not found');
      return [];
    }

    const userData = userSnap.data();
    savedKosIds = userData.savedKos || [];
    console.log('[getSavedKos] Loaded from Firestore:', savedKosIds);

    // Update cache
    await AsyncStorage.setItem(cacheKey, JSON.stringify(savedKosIds));
  }

  if (savedKosIds.length === 0) {
    console.log('[getSavedKos] No saved kos found');
    return [];
  }

  // Fetch all saved kos details
  const kosPromises = savedKosIds.map((kosId: string) => getKosById(kosId));
  const kosResults = await Promise.all(kosPromises);
  console.log(
    '[getSavedKos] 📦 Fetched kos results:',
    kosResults.map((k) => (k ? { id: k.id, name: k.name, status: k.status } : null))
  );

  // Filter out null values (deleted kos) - show ALL saved kos regardless of status
  const filteredKos = kosResults.filter((kos): kos is Kos => kos !== null);

  const pendingCount = filteredKos.filter((k) => k.status === 'pending').length;
  const rejectedCount = filteredKos.filter((k) => k.status === 'rejected').length;
  const approvedCount = filteredKos.filter((k) => k.status === 'approved').length;

  console.log(
    '[getSavedKos] ✅ Returning all saved kos:',
    filteredKos.length,
    `(approved: ${approvedCount}, pending: ${pendingCount}, rejected: ${rejectedCount})`
  );

  return filteredKos;
}

/**
 * Background fetch to sync cache with Firestore and trigger UI update
 */
async function fetchAndCacheSavedKos(
  userId: string,
  cacheKey: string,
  onDataUpdated?: (freshData: Kos[]) => void
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    const savedKosIds = userData.savedKos || [];
    await AsyncStorage.setItem(cacheKey, JSON.stringify(savedKosIds));
    console.log('[fetchAndCacheSavedKos] Cache updated from Firestore, IDs:', savedKosIds.length);

    // If callback provided, fetch full kos details and trigger UI update
    if (onDataUpdated && savedKosIds.length > 0) {
      const kosPromises = savedKosIds.map((kosId: string) => getKosById(kosId));
      const kosResults = await Promise.all(kosPromises);
      // Return ALL saved kos regardless of status
      const filteredKos = kosResults.filter((kos): kos is Kos => kos !== null);
      console.log('[fetchAndCacheSavedKos] Triggering callback with', filteredKos.length, 'kos');
      onDataUpdated(filteredKos);
    } else if (onDataUpdated && savedKosIds.length === 0) {
      // No saved kos, trigger callback with empty array
      console.log('[fetchAndCacheSavedKos] Triggering callback with empty array');
      onDataUpdated([]);
    }
  }
}

/**
 * Check if kos is saved by user (cache-first for instant response)
 */
export async function isKosSaved(userId: string, kosId: string): Promise<boolean> {
  const cacheKey = `savedKos_${userId}`;

  try {
    // Check cache first (instant)
    const cachedData = await AsyncStorage.getItem(cacheKey);
    if (cachedData) {
      const savedKos = JSON.parse(cachedData);
      const isSaved = savedKos.includes(kosId);
      console.log('[isKosSaved] From cache:', { userId, kosId, isSaved });
      return isSaved;
    }
  } catch (error) {
    console.error('[isKosSaved] Cache error:', error);
  }

  // Fallback to Firestore if cache miss
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.log('[isKosSaved] User document not found');
    return false;
  }

  const userData = userSnap.data();
  const savedKos = userData.savedKos || [];
  const isSaved = savedKos.includes(kosId);
  console.log('[isKosSaved] From Firestore:', { userId, kosId, isSaved });

  // Update cache
  await AsyncStorage.setItem(cacheKey, JSON.stringify(savedKos));

  return isSaved;
}

/**
 * Clear saved kos cache for a user (for debugging or manual sync)
 */
export async function clearSavedKosCache(userId: string): Promise<void> {
  const cacheKey = `savedKos_${userId}`;
  await AsyncStorage.removeItem(cacheKey);
  console.log('[clearSavedKosCache] Cache cleared for user:', userId);
}

/**
 * Submit kos from draft (creates new kos with pending status)
 * Used when penyewa clicks "Ajukan" button
 */
export async function submitKosFromDraft(
  data: Omit<Kos, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  return await createKos(data);
}

/**
 * Resubmit kos after editing (updates kos and sets status back to pending)
 * Preserves visibility if previous status was 'approved'
 * Used when penyewa edits approved/rejected kos and clicks "Ajukan"
 */
export async function resubmitKos(
  id: string,
  data: Partial<Omit<Kos, 'id' | 'createdAt' | 'status'>>
): Promise<void> {
  const isOnline = await syncService.isOnline();

  // Get current kos to check previous status
  const currentKos = await getKosById(id);
  const wasApproved = currentKos?.status === 'approved';

  if (isOnline) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      status: 'pending' as KosStatus,
      // Preserve previous status info for admin reference (optional)
      previousStatus: wasApproved ? 'approved' : currentKos?.status,
      updatedAt: serverTimestamp(),
    });

    // Update SQLite cache
    if (USE_SQLITE) {
      try {
        await sqliteService.updateKos(id, { ...data, status: 'pending' } as any);
      } catch (error) {
        console.error('Error updating kos in SQLite:', error);
      }
    }
  } else {
    // Offline: queue for sync
    if (USE_SQLITE) {
      await sqliteService.addToSyncQueue('update', COLLECTION_NAME, id, {
        ...data,
        status: 'pending',
        previousStatus: wasApproved ? 'approved' : currentKos?.status,
      });
      await sqliteService.updateKos(id, { ...data, status: 'pending' } as any);
    }
  }
}

/**
 * Check if a kos can be edited (not pending)
 */
export async function canEditKos(kosId: string): Promise<boolean> {
  const kos = await getKosById(kosId);
  return kos ? kos.status !== 'pending' : false;
}
