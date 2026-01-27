import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'mau-ngekos.db';
const DATABASE_VERSION = 1;

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or open SQLite database connection
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DATABASE_NAME);
  }
  return db;
}

/**
 * Initialize database schema with all tables and indexes
 */
export async function initDatabase(): Promise<void> {
  const database = getDatabase();

  try {
    // Check database version
    const result = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersion = result?.user_version || 0;

    if (currentVersion < DATABASE_VERSION) {
      console.log(`Initializing database v${DATABASE_VERSION}...`);

      // Create kos table
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS kos (
          id TEXT PRIMARY KEY,
          ownerId TEXT NOT NULL,
          ownerName TEXT,
          ownerPhone TEXT,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('putra', 'putri', 'campur')),
          priceMin INTEGER NOT NULL,
          priceMax INTEGER NOT NULL,
          facilities TEXT NOT NULL,
          totalRooms INTEGER NOT NULL,
          availableRooms INTEGER NOT NULL,
          images TEXT NOT NULL,
          description TEXT,
          contactPhone TEXT,
          contactWhatsapp TEXT,
          status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          syncedAt INTEGER NOT NULL
        );
      `);

      // Create saved_kos table (favorites)
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS saved_kos (
          userId TEXT NOT NULL,
          kosId TEXT NOT NULL,
          savedAt INTEGER NOT NULL,
          synced INTEGER DEFAULT 1 CHECK(synced IN (0, 1)),
          PRIMARY KEY (userId, kosId),
          FOREIGN KEY (kosId) REFERENCES kos(id) ON DELETE CASCADE
        );
      `);

      // Create sync_queue table for offline write operations
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete', 'save', 'unsave', 'updateStatus')),
          collection TEXT NOT NULL,
          documentId TEXT NOT NULL,
          data TEXT,
          createdAt INTEGER NOT NULL,
          retryCount INTEGER DEFAULT 0,
          lastError TEXT
        );
      `);

      // Create indexes for performance
      await database.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_kos_status ON kos(status);
        CREATE INDEX IF NOT EXISTS idx_kos_owner ON kos(ownerId);
        CREATE INDEX IF NOT EXISTS idx_kos_type ON kos(type);
        CREATE INDEX IF NOT EXISTS idx_kos_price ON kos(priceMin, priceMax);
        CREATE INDEX IF NOT EXISTS idx_saved_kos_user ON saved_kos(userId);
        CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(createdAt);
      `);

      // Update database version
      await database.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);

      console.log('Database initialized successfully!');
    } else {
      console.log(`Database v${currentVersion} already initialized`);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Clear all data from database (useful for testing or sign out)
 */
export async function clearDatabase(): Promise<void> {
  const database = getDatabase();

  try {
    await database.execAsync(`
      DELETE FROM kos;
      DELETE FROM saved_kos;
      DELETE FROM sync_queue;
    `);
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}

/**
 * Drop all tables and reset database (useful for migrations)
 */
export async function resetDatabase(): Promise<void> {
  const database = getDatabase();

  try {
    await database.execAsync(`
      DROP TABLE IF EXISTS kos;
      DROP TABLE IF EXISTS saved_kos;
      DROP TABLE IF EXISTS sync_queue;
      PRAGMA user_version = 0;
    `);
    console.log('Database reset successfully');

    // Reinitialize
    await initDatabase();
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  kosCount: number;
  savedKosCount: number;
  syncQueueCount: number;
}> {
  const database = getDatabase();

  try {
    const kosCount = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM kos'
    );
    const savedKosCount = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM saved_kos'
    );
    const syncQueueCount = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue'
    );

    return {
      kosCount: kosCount?.count || 0,
      savedKosCount: savedKosCount?.count || 0,
      syncQueueCount: syncQueueCount?.count || 0,
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { kosCount: 0, savedKosCount: 0, syncQueueCount: 0 };
  }
}
