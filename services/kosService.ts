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

const COLLECTION_NAME = 'kos';

/**
 * Get all approved kos (for map display)
 */
export async function getApprovedKos(): Promise<Kos[]> {
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

/**
 * Get kos with filters (for search)
 */
export async function getFilteredKos(filters: KosFilter): Promise<Kos[]> {
  let q = query(collection(db, COLLECTION_NAME), where('status', '==', 'approved'));

  // Note: Firestore has limitations on compound queries
  // For MVP, we filter client-side for complex filters
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
    results = results.filter((kos) => filters.facilities!.every((f) => kos.facilities.includes(f)));
  }

  if (filters.hasAvailableRooms) {
    results = results.filter((kos) => kos.availableRooms > 0);
  }

  return results;
}

/**
 * Get kos by owner ID (for penyewa dashboard)
 */
export async function getKosByOwner(ownerId: string): Promise<Kos[]> {
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

/**
 * Get pending kos (for admin approval)
 */
export async function getPendingKos(): Promise<Kos[]> {
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
 */
export async function createKos(
  data: Omit<Kos, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    status: 'pending' as KosStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Update kos
 */
export async function updateKos(
  id: string,
  data: Partial<Omit<Kos, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update kos status (for admin)
 */
export async function updateKosStatus(id: string, status: KosStatus): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete kos
 */
export async function deleteKos(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Create GeoPoint from latitude and longitude
 */
export function createGeoPoint(lat: number, lng: number): GeoPoint {
  return new GeoPoint(lat, lng);
}
