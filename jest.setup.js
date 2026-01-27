// Setup for Jest tests
import '@testing-library/react-native/extend-expect';

// Polyfill for React Native globals
global.window = {};
global.window.matchMedia = () => ({
  matches: false,
  addListener: () => {},
  removeListener: () => {},
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
}));

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => {
  // Define mocks inline to avoid scope issues
  class MockTimestamp {
    constructor(seconds, nanoseconds = 0) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }

    toMillis() {
      return this.seconds * 1000 + Math.floor(this.nanoseconds / 1000000);
    }

    static now() {
      const ms = Date.now();
      return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
    }

    static fromMillis(ms) {
      return new MockTimestamp(Math.floor(ms / 1000), (ms % 1000) * 1000000);
    }
  }

  class MockGeoPoint {
    constructor(latitude, longitude) {
      this.latitude = latitude;
      this.longitude = longitude;
    }
  }

  return {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    GeoPoint: MockGeoPoint,
    Timestamp: MockTimestamp,
  };
});

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()), // Return unsubscribe function
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

// Mock expo-sqlite with in-memory implementation
const createMockDatabase = () => {
  // In-memory storage
  const tables = {
    kos: [],
    saved_kos: [],
    sync_queue: [],
  };

  let userVersion = 0;

  return {
    execAsync: jest.fn(async (sql) => {
      // Handle PRAGMA user_version
      if (sql.includes('PRAGMA user_version =')) {
        const match = sql.match(/PRAGMA user_version = (\d+)/);
        if (match) userVersion = parseInt(match[1]);
        return;
      }

      // Handle DELETE operations
      if (sql.includes('DELETE FROM')) {
        if (sql.includes('DELETE FROM kos')) tables.kos = [];
        if (sql.includes('DELETE FROM saved_kos')) tables.saved_kos = [];
        if (sql.includes('DELETE FROM sync_queue')) tables.sync_queue = [];
        return;
      }

      // CREATE TABLE, CREATE INDEX - just return
      return;
    }),

    getFirstAsync: jest.fn(async (sql, params = []) => {
      // PRAGMA user_version
      if (sql.includes('PRAGMA user_version')) {
        return { user_version: userVersion };
      }

      // COUNT queries
      if (sql.includes('COUNT(*)')) {
        if (sql.includes('FROM kos')) {
          return { count: tables.kos.length };
        }
        if (sql.includes('FROM saved_kos')) {
          const [userId, kosId] = params;
          const count = tables.saved_kos.filter(
            (s) => s.userId === userId && s.kosId === kosId
          ).length;
          return { count };
        }
        if (sql.includes('FROM sync_queue')) {
          return { count: tables.sync_queue.length };
        }
      }

      return null;
    }),

    getAllAsync: jest.fn(async (sql, params = []) => {
      // SELECT from kos
      if (sql.includes('FROM kos')) {
        let results = [...tables.kos];

        // Filter by status
        if (params.includes('approved')) {
          results = results.filter((k) => k.status === 'approved');
        }

        // Filter by type
        if (sql.includes('type = ?')) {
          const typeParam = params.find((p) => ['putra', 'putri', 'campur'].includes(p));
          if (typeParam) {
            results = results.filter((k) => k.type === typeParam);
          }
        }

        return results;
      }

      // SELECT from saved_kos with JOIN
      if (sql.includes('FROM kos k INNER JOIN saved_kos')) {
        const [userId] = params;
        const savedKosIds = tables.saved_kos.filter((s) => s.userId === userId).map((s) => s.kosId);
        return tables.kos.filter((k) => savedKosIds.includes(k.id));
      }

      // SELECT from sync_queue
      if (sql.includes('FROM sync_queue')) {
        return [...tables.sync_queue];
      }

      return [];
    }),

    runAsync: jest.fn(async (sql, params = []) => {
      // INSERT into kos
      if (sql.includes('INSERT OR REPLACE INTO kos')) {
        const row = {
          id: params[0],
          ownerId: params[1],
          ownerName: params[2],
          ownerPhone: params[3],
          name: params[4],
          address: params[5],
          latitude: params[6],
          longitude: params[7],
          type: params[8],
          priceMin: params[9],
          priceMax: params[10],
          facilities: params[11],
          totalRooms: params[12],
          availableRooms: params[13],
          images: params[14],
          description: params[15],
          status: params[16],
          createdAt: params[17],
          updatedAt: params[18],
          syncedAt: params[19],
        };

        // Remove existing if any
        tables.kos = tables.kos.filter((k) => k.id !== row.id);
        tables.kos.push(row);
        return { changes: 1, lastInsertRowId: 1 };
      }

      // INSERT into saved_kos
      if (sql.includes('INSERT OR IGNORE INTO saved_kos')) {
        const [userId, kosId, savedAt, synced] = params;
        const exists = tables.saved_kos.some((s) => s.userId === userId && s.kosId === kosId);
        if (!exists) {
          tables.saved_kos.push({ userId, kosId, savedAt, synced });
        }
        return { changes: exists ? 0 : 1, lastInsertRowId: 1 };
      }

      // INSERT into sync_queue
      if (sql.includes('INSERT INTO sync_queue')) {
        const item = {
          id: tables.sync_queue.length + 1,
          operation: params[0],
          collection: params[1],
          documentId: params[2],
          data: params[3],
          createdAt: params[4],
          retryCount: params[5] || 0,
          lastError: params[6] || null,
        };
        tables.sync_queue.push(item);
        return { changes: 1, lastInsertRowId: item.id };
      }

      // DELETE from saved_kos
      if (sql.includes('DELETE FROM saved_kos')) {
        const [userId, kosId] = params;
        const initialLength = tables.saved_kos.length;
        tables.saved_kos = tables.saved_kos.filter(
          (s) => !(s.userId === userId && s.kosId === kosId)
        );
        return { changes: initialLength - tables.saved_kos.length };
      }

      return { changes: 0 };
    }),

    prepareAsync: jest.fn(() =>
      Promise.resolve({
        executeAsync: jest.fn(() => Promise.resolve()),
        finalizeAsync: jest.fn(() => Promise.resolve()),
      })
    ),

    withTransactionAsync: jest.fn((callback) => callback()),
  };
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => createMockDatabase()),
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  },
}));

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => '/'),
  Stack: { Screen: () => null },
  Slot: () => null,
  Link: () => null,
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(() => Promise.resolve()),
  },
}));

// Mock React Native Animated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Silence console logs during tests (optional - comment out for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
