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
 * Get all approved kos (for map display)
 * SQLite-first strategy: reads from local cache, syncs from Firestore in background
 */
export async function getApprovedKos(): Promise<Kos[]> {
  if (!USE_SQLITE) {
    // Fallback to direct Firestore query
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Kos[];
  }

  try {
    // Read from SQLite first (fast, works offline)
    const localKos = await sqliteService.getAllApprovedKos();

    // Check if we're online and need to sync
    const isOnline = await syncService.isOnline();
    if (isOnline && (await syncService.shouldSync())) {
      // Background sync from Firestore to SQLite
      syncService.syncAllKosFromFirestore().catch((error) => {
        console.error('Background sync failed:', error);
      });
    }

    return localKos;
  } catch (error) {
    console.error('Error reading from SQLite, falling back to Firestore:', error);
    // Fallback to Firestore on SQLite error
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'approved'),
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
export async function getKosByOwner(ownerId: string): Promise<Kos[]> {
  if (!USE_SQLITE) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Kos[];
  }

  try {
    return await sqliteService.getKosByOwner(ownerId);
  } catch (error) {
    console.error('Error reading from SQLite, falling back to Firestore:', error);
    const q = query(
      collection(db, COLLECTION_NAME),
      where('ownerId', '==', ownerId),
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
 * Get pending kos (for admin approval)
 * Uses SQLite cache with Firestore fallback
 */
export async function getPendingKos(): Promise<Kos[]> {
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

  try {
    return await sqliteService.getKosByStatus('pending');
  } catch (error) {
    console.error('Error reading from SQLite, falling back to Firestore:', error);
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
 * Get saved kos by user ID (with cache-first strategy)
 */
export async function getSavedKos(userId: string, forceRefresh: boolean = false): Promise<Kos[]> {
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

  // Fetch from Firestore in background to sync cache
  fetchAndCacheSavedKos(userId, cacheKey).catch(console.error);

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
    '[getSavedKos] Fetched kos results:',
    kosResults.map((k) => (k ? { id: k.id, name: k.name, status: k.status } : null))
  );

  // Filter out null values (deleted kos) and only return approved ones
  const filteredKos = kosResults.filter(
    (kos): kos is Kos => kos !== null && kos.status === 'approved'
  );
  console.log('[getSavedKos] Filtered approved kos count:', filteredKos.length);
  return filteredKos;
}

/**
 * Background fetch to sync cache with Firestore
 */
async function fetchAndCacheSavedKos(userId: string, cacheKey: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    const savedKosIds = userData.savedKos || [];
    await AsyncStorage.setItem(cacheKey, JSON.stringify(savedKosIds));
    console.log('[fetchAndCacheSavedKos] Cache updated from Firestore');
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
