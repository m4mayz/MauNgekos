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

// Mock expo-sqlite with proper implementation
const mockDatabase = {
  execAsync: jest.fn(() => Promise.resolve()),
  getFirstAsync: jest.fn(() => Promise.resolve(null)),
  getAllAsync: jest.fn(() => Promise.resolve([])),
  runAsync: jest.fn(() => Promise.resolve({ changes: 1, lastInsertRowId: 1 })),
  prepareAsync: jest.fn(() =>
    Promise.resolve({
      executeAsync: jest.fn(() => Promise.resolve()),
      finalizeAsync: jest.fn(() => Promise.resolve()),
    })
  ),
  withTransactionAsync: jest.fn((callback) => callback()),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDatabase),
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
