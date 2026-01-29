import * as SQLite from 'expo-sqlite';
import { getDatabase, isDatabaseInitialized, initDatabase } from '@/lib/database';
import { serializeKosForSQLite, deserializeKosFromSQLite, type SQLiteKosRow } from '@/lib/utils';
import type { Kos, KosFilter } from '@/types';

/**
 * SQLite Service Layer
 * Handles all local database operations for kos data
 */

/**
 * Ensure database is initialized before operations
 */
async function ensureDatabaseReady(): Promise<void> {
  if (!isDatabaseInitialized()) {
    console.warn('Database not initialized, initializing now...');
    await initDatabase();
  }
}

// ==================== KOS CRUD OPERATIONS ====================

/**
 * Insert or replace a kos in SQLite
 */
export async function insertKos(kos: Kos): Promise<void> {
  await ensureDatabaseReady();
  const db = getDatabase();
  const row = serializeKosForSQLite(kos);

  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO kos (
        id, ownerId, ownerName, ownerPhone, name, address, 
        latitude, longitude, type, priceMin, priceMax,
        facilities, totalRooms, availableRooms,
        images, description, status, createdAt, updatedAt, syncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.ownerId,
        row.ownerName,
        row.ownerPhone,
        row.name,
        row.address,
        row.latitude,
        row.longitude,
        row.type,
        row.priceMin,
        row.priceMax,
        row.facilities,
        row.totalRooms,
        row.availableRooms,
        row.images,
        row.description,
        row.status,
        row.createdAt,
        row.updatedAt,
        row.syncedAt,
      ]
    );
  } catch (error) {
    console.error('Error inserting kos to SQLite:', error);
    throw error;
  }
}

/**
 * Batch insert multiple kos (for sync operations)
 * Uses prepared statement for efficiency without explicit transaction to avoid nesting conflicts
 */
export async function insertManyKos(kosList: Kos[]): Promise<void> {
  if (kosList.length === 0) {
    console.log('[insertManyKos] Empty list, skipping');
    return;
  }

  await ensureDatabaseReady();
  const db = getDatabase();

  if (!db) {
    throw new Error('Database not available');
  }

  let statement: SQLite.SQLiteStatement | null = null;

  try {
    // Prepare statement once for all inserts
    statement = await db.prepareAsync(`
      INSERT OR REPLACE INTO kos (
        id, ownerId, ownerName, ownerPhone, name, address, 
        latitude, longitude, type, priceMin, priceMax,
        facilities, totalRooms, availableRooms,
        images, description, status, createdAt, updatedAt, syncedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Execute batch inserts - SQLite handles implicit transaction
    for (const kos of kosList) {
      const row = serializeKosForSQLite(kos);
      await statement.executeAsync([
        row.id,
        row.ownerId,
        row.ownerName,
        row.ownerPhone,
        row.name,
        row.address,
        row.latitude,
        row.longitude,
        row.type,
        row.priceMin,
        row.priceMax,
        row.facilities,
        row.totalRooms,
        row.availableRooms,
        row.images,
        row.description,
        row.status,
        row.createdAt,
        row.updatedAt,
        row.syncedAt,
      ]);
    }

    console.log(`✅ Batch inserted ${kosList.length} kos to SQLite`);
  } catch (error) {
    console.error('❌ Error batch inserting kos:', error);
    throw error;
  } finally {
    // Always finalize statement to release resources
    if (statement) {
      try {
        await statement.finalizeAsync();
      } catch (finalizeError) {
        console.error('Error finalizing statement:', finalizeError);
      }
    }
  }
}

/**
 * Update an existing kos in SQLite
 */
export async function updateKos(id: string, updates: Partial<Kos>): Promise<void> {
  const db = getDatabase();

  try {
    // Get existing kos first
    const existing = await getKosById(id);
    if (!existing) {
      throw new Error(`Kos with id ${id} not found in SQLite`);
    }

    // Merge updates
    const updated = { ...existing, ...updates };
    await insertKos(updated);
  } catch (error) {
    console.error('Error updating kos in SQLite:', error);
    throw error;
  }
}

/**
 * Delete a kos from SQLite
 */
export async function deleteKos(id: string): Promise<void> {
  const db = getDatabase();

  try {
    await db.runAsync('DELETE FROM kos WHERE id = ?', [id]);
    console.log(`Deleted kos ${id} from SQLite`);
  } catch (error) {
    console.error('Error deleting kos from SQLite:', error);
    throw error;
  }
}

/**
 * Get a single kos by ID
 */
export async function getKosById(id: string): Promise<Kos | null> {
  await ensureDatabaseReady();
  const db = getDatabase();

  try {
    const row = await db.getFirstAsync<SQLiteKosRow>('SELECT * FROM kos WHERE id = ?', [id]);

    if (!row) return null;
    return deserializeKosFromSQLite(row);
  } catch (error) {
    console.error('Error getting kos by id from SQLite:', error);
    throw error;
  }
}

// ==================== KOS QUERY OPERATIONS ====================

/**
 * Get all approved kos from SQLite
 */
export async function getAllApprovedKos(): Promise<Kos[]> {
  await ensureDatabaseReady();
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<SQLiteKosRow>(
      'SELECT * FROM kos WHERE status = ? ORDER BY createdAt DESC',
      ['approved']
    );

    return rows.map(deserializeKosFromSQLite);
  } catch (error) {
    console.error('Error getting approved kos from SQLite:', error);
    throw error;
  }
}

/**
 * Get kos by owner ID
 */
export async function getKosByOwner(ownerId: string): Promise<Kos[]> {
  await ensureDatabaseReady();
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<SQLiteKosRow>(
      'SELECT * FROM kos WHERE ownerId = ? ORDER BY createdAt DESC',
      [ownerId]
    );

    return rows.map(deserializeKosFromSQLite);
  } catch (error) {
    console.error('Error getting kos by owner from SQLite:', error);
    throw error;
  }
}

/**
 * Get kos by status
 */
export async function getKosByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<Kos[]> {
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<SQLiteKosRow>(
      'SELECT * FROM kos WHERE status = ? ORDER BY createdAt DESC',
      [status]
    );

    return rows.map(deserializeKosFromSQLite);
  } catch (error) {
    console.error('Error getting kos by status from SQLite:', error);
    throw error;
  }
}

/**
 * Get filtered kos from SQLite
 * Uses SQL WHERE clauses for simple filters, then client-side filtering for complex ones
 */
export async function getFilteredKos(filters: KosFilter): Promise<Kos[]> {
  await ensureDatabaseReady();
  const db = getDatabase();

  try {
    let query = 'SELECT * FROM kos WHERE status = ?';
    const params: any[] = ['approved'];

    // SQL filters
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.priceMin !== undefined) {
      query += ' AND priceMax >= ?'; // Max price of kos should be >= user's min budget
      params.push(filters.priceMin);
    }

    if (filters.priceMax !== undefined) {
      query += ' AND priceMin <= ?'; // Min price of kos should be <= user's max budget
      params.push(filters.priceMax);
    }

    if (filters.hasAvailableRooms) {
      query += ' AND availableRooms > 0';
    }

    query += ' ORDER BY createdAt DESC';

    const rows = await db.getAllAsync<SQLiteKosRow>(query, params);
    let kosList = rows.map(deserializeKosFromSQLite);

    // Client-side facility filtering (SQLite can't easily query JSON arrays)
    if (filters.facilities && filters.facilities.length > 0) {
      kosList = kosList.filter((kos) => {
        return filters.facilities!.every((facility) => kos.facilities.includes(facility));
      });
    }

    return kosList;
  } catch (error) {
    console.error('Error getting filtered kos from SQLite:', error);
    throw error;
  }
}

// ==================== FAVORITES OPERATIONS ====================

/**
 * Save a kos to favorites in SQLite
 */
export async function saveFavorite(userId: string, kosId: string): Promise<void> {
  const db = getDatabase();

  try {
    await db.runAsync(
      'INSERT OR IGNORE INTO saved_kos (userId, kosId, savedAt, synced) VALUES (?, ?, ?, ?)',
      [userId, kosId, Date.now(), 0] // synced=0 means pending sync to Firestore
    );
    console.log(`Saved favorite ${kosId} for user ${userId} to SQLite`);
  } catch (error) {
    console.error('Error saving favorite to SQLite:', error);
    throw error;
  }
}

/**
 * Remove a kos from favorites in SQLite
 */
export async function removeFavorite(userId: string, kosId: string): Promise<void> {
  const db = getDatabase();

  try {
    await db.runAsync('DELETE FROM saved_kos WHERE userId = ? AND kosId = ?', [userId, kosId]);
    console.log(`Removed favorite ${kosId} for user ${userId} from SQLite`);
  } catch (error) {
    console.error('Error removing favorite from SQLite:', error);
    throw error;
  }
}

/**
 * Get all saved kos for a user (JOIN with kos table)
 */
export async function getUserFavorites(userId: string): Promise<Kos[]> {
  await ensureDatabaseReady();
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<SQLiteKosRow>(
      `
      SELECT k.* FROM kos k
      INNER JOIN saved_kos s ON k.id = s.kosId
      WHERE s.userId = ?
      ORDER BY s.savedAt DESC
    `,
      [userId]
    );

    return rows.map(deserializeKosFromSQLite);
  } catch (error) {
    console.error('Error getting user favorites from SQLite:', error);
    throw error;
  }
}

/**
 * Check if a kos is saved by user
 */
export async function isFavoriteSaved(userId: string, kosId: string): Promise<boolean> {
  const db = getDatabase();

  try {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM saved_kos WHERE userId = ? AND kosId = ?',
      [userId, kosId]
    );

    return (result?.count || 0) > 0;
  } catch (error) {
    console.error('Error checking if favorite saved:', error);
    return false;
  }
}

/**
 * Mark favorite as synced to Firestore
 */
export async function markFavoriteSynced(userId: string, kosId: string): Promise<void> {
  const db = getDatabase();

  try {
    await db.runAsync('UPDATE saved_kos SET synced = 1 WHERE userId = ? AND kosId = ?', [
      userId,
      kosId,
    ]);
  } catch (error) {
    console.error('Error marking favorite as synced:', error);
    throw error;
  }
}

/**
 * Get unsynced favorites (need to push to Firestore)
 */
export async function getUnsyncedFavorites(userId: string): Promise<string[]> {
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<{ kosId: string }>(
      'SELECT kosId FROM saved_kos WHERE userId = ? AND synced = 0',
      [userId]
    );

    return rows.map((row) => row.kosId);
  } catch (error) {
    console.error('Error getting unsynced favorites:', error);
    return [];
  }
}

// ==================== SYNC QUEUE OPERATIONS ====================

export interface SyncQueueItem {
  id: number;
  operation: 'create' | 'update' | 'delete' | 'save' | 'unsave' | 'updateStatus';
  collection: string;
  documentId: string;
  data: string | null;
  createdAt: number;
  retryCount: number;
  lastError: string | null;
}

/**
 * Add an operation to sync queue
 */
export async function addToSyncQueue(
  operation: SyncQueueItem['operation'],
  collection: string,
  documentId: string,
  data?: any
): Promise<void> {
  const db = getDatabase();

  try {
    await db.runAsync(
      `INSERT INTO sync_queue (operation, collection, documentId, data, createdAt, retryCount, lastError)
       VALUES (?, ?, ?, ?, ?, 0, NULL)`,
      [operation, collection, documentId, data ? JSON.stringify(data) : null, Date.now()]
    );
    console.log(`Added ${operation} operation to sync queue for ${collection}/${documentId}`);
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
}

/**
 * Get all pending sync queue items
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = getDatabase();

  try {
    const rows = await db.getAllAsync<SyncQueueItem>(
      'SELECT * FROM sync_queue ORDER BY createdAt ASC'
    );
    return rows;
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
}

/**
 * Remove an item from sync queue after successful sync
 */
export async function removeSyncQueueItem(id: number): Promise<void> {
  const db = getDatabase();

  try {
    await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error removing sync queue item:', error);
    throw error;
  }
}

/**
 * Update retry count and error message for a sync queue item
 */
export async function updateSyncQueueItemError(id: number, error: string): Promise<void> {
  const db = getDatabase();

  try {
    await db.runAsync(
      'UPDATE sync_queue SET retryCount = retryCount + 1, lastError = ? WHERE id = ?',
      [error, id]
    );
  } catch (error) {
    console.error('Error updating sync queue item:', error);
    throw error;
  }
}

/**
 * Clear all sync queue items (use with caution)
 */
export async function clearSyncQueue(): Promise<void> {
  const db = getDatabase();

  try {
    await db.runAsync('DELETE FROM sync_queue');
    console.log('Sync queue cleared');
  } catch (error) {
    console.error('Error clearing sync queue:', error);
    throw error;
  }
}
