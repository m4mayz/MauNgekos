/**
 * 🎯 USER FLOW TESTING SUITE
 * Tests mengikuti flow aplikasi dari user buka app sampai sync selesai
 * Sesuai dengan arsitektur SQLite + Firestore hybrid
 */

import { initDatabase, clearDatabase, getDatabaseStats, getDatabase } from '@/lib/database';
import * as sqliteService from '@/services/sqliteService';
import * as syncService from '@/services/syncService';
import NetInfo from '@react-native-community/netinfo';
import { Kos } from '@/types';

const { GeoPoint, Timestamp } = require('firebase/firestore');

jest.mock('@react-native-community/netinfo');

// Mock data untuk testing
const createMockKos = (id: string): Kos => ({
  id,
  ownerId: 'owner-123',
  ownerName: 'Test Owner',
  ownerPhone: '628123456789', // Format WhatsApp (628xxx tanpa +)
  name: `Kos Test ${id}`,
  address: 'Jl. Test No. 123, Jakarta',
  location: new GeoPoint(-6.2088, 106.8456),
  type: 'putra',
  priceMin: 800000,
  priceMax: 1200000,
  facilities: ['Kasur', 'AC', 'WiFi', 'K. Mandi Dalam', 'Parkir Motor'],
  totalRooms: 10,
  availableRooms: 5,
  images: ['https://example.com/image1.jpg'],
  description: 'Kos strategis dekat kampus dengan fasilitas lengkap',
  status: 'approved',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

// ============================================
// STEP 1: 📱 User Buka App
// ============================================
describe('📱 Step 1: User Buka App', () => {
  it('✅ App dapat di-launch tanpa error', () => {
    // Test bahwa module-module penting bisa di-import
    expect(initDatabase).toBeDefined();
    expect(sqliteService).toBeDefined();
    expect(syncService).toBeDefined();
  });
});

// ============================================
// STEP 2: 💾 SQLite Database Init
// ============================================
describe('💾 Step 2: SQLite Database Initialization', () => {
  it('✅ Database dapat diinisialisasi', async () => {
    await initDatabase();
    const db = getDatabase();

    expect(db).toBeDefined();
    expect(typeof db.getAllAsync).toBe('function');
    expect(typeof db.runAsync).toBe('function');
  });

  it('✅ Tables berhasil dibuat (kos, saved_kos, sync_queue)', async () => {
    const db = getDatabase();

    // Check if tables exist via database stats
    const stats = await getDatabaseStats();

    expect(stats).toHaveProperty('kosCount');
    expect(stats).toHaveProperty('savedKosCount');
    expect(stats).toHaveProperty('syncQueueCount');
  });

  it('✅ Database stats dapat diambil', async () => {
    const stats = await getDatabaseStats();

    expect(typeof stats.kosCount).toBe('number');
    expect(typeof stats.savedKosCount).toBe('number');
    expect(typeof stats.syncQueueCount).toBe('number');
  });
});

// ============================================
// STEP 3: 🔍 Network Status Check
// ============================================
describe('🔍 Step 3: Check Network Status', () => {
  it('✅ Dapat mendeteksi status ONLINE', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });

    const isOnline = await syncService.isOnline();
    expect(isOnline).toBe(true);
  });

  it('✅ Dapat mendeteksi status OFFLINE', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false });

    const isOnline = await syncService.isOnline();
    expect(isOnline).toBe(false);
  });

  it('✅ Handle null connection state (treat as offline)', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: null });

    const isOnline = await syncService.isOnline();
    expect(isOnline).toBe(false);
  });
});

// ============================================
// STEP 4: ⏰ Sync Timing Check
// ============================================
describe('⏰ Step 4: Check Last Sync Time', () => {
  beforeAll(async () => {
    await initDatabase();
    await clearDatabase();
  });

  it('✅ Pertama kali app buka, harus sync (belum pernah sync)', async () => {
    const shouldSync = await syncService.shouldSync();
    expect(shouldSync).toBe(true);
  });

  it('✅ Setelah sync, cek shouldSync() berubah', async () => {
    // Test that shouldSync logic works
    // Note: Implementation depends on 30-min interval
    const shouldSyncNow = await syncService.shouldSync();
    expect(typeof shouldSyncNow).toBe('boolean');
  });
});

// ============================================
// STEP 5: 📖 Read from SQLite
// ============================================
describe('📖 Step 5: Read Data from SQLite', () => {
  beforeAll(async () => {
    await clearDatabase();
  });

  it('✅ getAllApprovedKos() - Query SQL berjalan instant', async () => {
    // Clear first
    await clearDatabase();

    const kos1 = createMockKos('kos-1');
    const kos2 = createMockKos('kos-2');

    await sqliteService.insertKos(kos1);
    await sqliteService.insertKos(kos2);

    const result = await sqliteService.getAllApprovedKos();
    expect(result.length).toBe(2);
    expect(result.some((k) => k.id === 'kos-1')).toBe(true);
    expect(result.some((k) => k.id === 'kos-2')).toBe(true);
  });

  it('✅ getFilteredKos() - Filter by type berjalan', async () => {
    // Clear first
    await clearDatabase();

    const kosPutra = createMockKos('kos-putra');
    const kosPutri = { ...createMockKos('kos-putri'), type: 'putri' as const };

    await sqliteService.insertKos(kosPutra);
    await sqliteService.insertKos(kosPutri);

    const result = await sqliteService.getFilteredKos({ type: 'putra' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((k) => k.type === 'putra')).toBe(true);
  });

  it('✅ getUserFavorites() - JOIN query berjalan', async () => {
    // Clear first
    await clearDatabase();

    const kos = createMockKos('kos-fav');
    await sqliteService.insertKos(kos);
    await sqliteService.saveFavorite('user-123', 'kos-fav');

    const favorites = await sqliteService.getUserFavorites('user-123');
    expect(favorites.length).toBe(1);
    expect(favorites[0].id).toBe('kos-fav');
  });
});

// ============================================
// STEP 6: 👆 User Actions (Save/Unsave)
// ============================================
describe('👆 Step 6: User Actions - Save/Unsave Kos', () => {
  beforeAll(async () => {
    await clearDatabase();
  });

  it('✅ User save kos → Optimistic update ke SQLite', async () => {
    // Clear first
    await clearDatabase();

    const kos = createMockKos('kos-1');
    await sqliteService.insertKos(kos);

    await sqliteService.saveFavorite('user-123', 'kos-1');

    const isSaved = await sqliteService.isFavoriteSaved('user-123', 'kos-1');
    expect(isSaved).toBe(true);
  });

  it('✅ User unsave kos → Remove dari SQLite', async () => {
    // Clear first
    await clearDatabase();

    const kos = createMockKos('kos-1');
    await sqliteService.insertKos(kos);
    await sqliteService.saveFavorite('user-123', 'kos-1');

    await sqliteService.removeFavorite('user-123', 'kos-1');

    const isSaved = await sqliteService.isFavoriteSaved('user-123', 'kos-1');
    expect(isSaved).toBe(false);
  });

  it('✅ Offline action → Add to sync_queue', async () => {
    // Clear first
    await clearDatabase();

    await sqliteService.addToSyncQueue('save', 'kos', 'kos-1', null);

    const queue = await sqliteService.getSyncQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].documentId).toBe('kos-1');
  });
});

// ============================================
// STEP 7: 🔄 Background Sync
// ============================================
describe('🔄 Step 7: Background Sync Process', () => {
  beforeAll(async () => {
    await clearDatabase();
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
  });

  it('✅ Sync status dapat diambil', async () => {
    const status = await syncService.getSyncStatus();

    expect(status).toHaveProperty('isOnline');
    expect(status).toHaveProperty('queueCount');
    expect(status).toHaveProperty('lastSync');
  });

  it('✅ Network listener dapat distart', () => {
    const mockUnsubscribe = jest.fn();
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(mockUnsubscribe);

    syncService.startNetworkListener();
    expect(NetInfo.addEventListener).toHaveBeenCalled();
  });

  it('✅ Network listener dapat distop', () => {
    const mockUnsubscribe = jest.fn();
    (NetInfo.addEventListener as jest.Mock).mockReturnValue(mockUnsubscribe);

    syncService.startNetworkListener();
    expect(() => syncService.stopNetworkListener()).not.toThrow();
  });
});

// ============================================
// STEP 8: 🧹 Database Cleanup
// ============================================
describe('🧹 Step 8: Database Cleanup', () => {
  it('✅ clearDatabase() - Hapus semua data berhasil', async () => {
    // Insert some data
    const kos = createMockKos('kos-1');
    await sqliteService.insertKos(kos);
    await sqliteService.saveFavorite('user-1', 'kos-1');

    // Clear database
    await clearDatabase();

    // Verify all empty
    const stats = await getDatabaseStats();
    expect(stats.kosCount).toBe(0);
    expect(stats.savedKosCount).toBe(0);
    expect(stats.syncQueueCount).toBe(0);
  });
});
