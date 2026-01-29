import AsyncStorage from '@react-native-async-storage/async-storage';
import { Kos } from '@/types';

/**
 * Draft Service
 * Manages local kos drafts before submission to database
 * Uses AsyncStorage for simple key-value storage
 */

const DRAFT_PREFIX = 'kos_draft_';

export interface KosDraft {
  kosId: string; // Kos ID for edits, or temp ID for new kos
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  name: string;
  address: string;
  description?: string;
  latitude: number;
  longitude: number;
  type: 'putra' | 'putri' | 'campur';
  priceMin: number;
  priceMax: number;
  totalRooms: number;
  availableRooms: number;
  facilities: string[];
  images: string[]; // Local URIs for new images
  existingImages?: string[]; // URLs for existing images (edits only)
  createdAt: number;
  updatedAt: number;
}

/**
 * Save a draft locally
 */
export async function saveDraft(kosId: string, draft: KosDraft): Promise<void> {
  try {
    const key = `${DRAFT_PREFIX}${kosId}`;
    const value = JSON.stringify(draft);
    await AsyncStorage.setItem(key, value);
    console.log(`Draft saved for kos ${kosId}`);
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
}

/**
 * Get a draft by kos ID
 */
export async function getDraft(kosId: string): Promise<KosDraft | null> {
  try {
    const key = `${DRAFT_PREFIX}${kosId}`;
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (error) {
    console.error('Error getting draft:', error);
    return null;
  }
}

/**
 * Delete a draft
 */
export async function deleteDraft(kosId: string): Promise<void> {
  try {
    const key = `${DRAFT_PREFIX}${kosId}`;
    await AsyncStorage.removeItem(key);
    console.log(`Draft deleted for kos ${kosId}`);
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
}

/**
 * Get all drafts for a user
 */
export async function getAllDrafts(ownerId: string): Promise<KosDraft[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const draftKeys = keys.filter((k) => k.startsWith(DRAFT_PREFIX));

    if (draftKeys.length === 0) return [];

    const items = await AsyncStorage.multiGet(draftKeys);
    const drafts: KosDraft[] = [];

    for (const [key, value] of items) {
      if (value) {
        const draft = JSON.parse(value);
        if (draft.ownerId === ownerId) {
          drafts.push(draft);
        }
      }
    }

    return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Error getting all drafts:', error);
    return [];
  }
}

/**
 * Check if a draft exists
 */
export async function hasDraft(kosId: string): Promise<boolean> {
  const draft = await getDraft(kosId);
  return draft !== null;
}

/**
 * Clear all drafts for a user (for testing/cleanup)
 */
export async function clearAllDrafts(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const draftKeys = keys.filter((k) => k.startsWith(DRAFT_PREFIX));
    await AsyncStorage.multiRemove(draftKeys);
    console.log('All drafts cleared');
  } catch (error) {
    console.error('Error clearing drafts:', error);
    throw error;
  }
}
