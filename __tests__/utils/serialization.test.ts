/**
 * Simple Unit Test: Database Utilities
 * Tests serialization/deserialization functions
 */

import { serializeKosForSQLite, deserializeKosFromSQLite } from '@/lib/utils';
import { Kos } from '@/types';

// Import the mocked Timestamp and GeoPoint
const { GeoPoint, Timestamp } = require('firebase/firestore');

const mockKos: Kos = {
  id: 'test-1',
  ownerId: 'owner-1',
  ownerName: 'Test Owner',
  name: 'Test Kos',
  address: 'Jl. Test',
  location: new GeoPoint(-6.2, 106.8),
  type: 'putra',
  priceMin: 800000,
  priceMax: 1200000,
  facilities: ['Kasur', 'AC', 'WiFi'],
  totalRooms: 10,
  availableRooms: 5,
  images: ['image1.jpg'],
  description: 'Test description',
  status: 'approved',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

describe('Database Utils - Serialization', () => {
  it('should serialize Kos to SQLite format', () => {
    const serialized = serializeKosForSQLite(mockKos);

    expect(serialized.id).toBe('test-1');
    expect(serialized.latitude).toBe(-6.2);
    expect(serialized.longitude).toBe(106.8);
    expect(typeof serialized.facilities).toBe('string'); // JSON string
    expect(typeof serialized.images).toBe('string'); // JSON string
    expect(typeof serialized.createdAt).toBe('number'); // Unix timestamp
  });

  it('should deserialize SQLite row to Kos object', () => {
    const serialized = serializeKosForSQLite(mockKos);
    const deserialized = deserializeKosFromSQLite(serialized);

    expect(deserialized.id).toBe(mockKos.id);
    expect(deserialized.location.latitude).toBe(-6.2);
    expect(deserialized.location.longitude).toBe(106.8);
    expect(Array.isArray(deserialized.facilities)).toBe(true);
    expect(deserialized.facilities).toHaveLength(3);
  });

  it('should handle round-trip serialization', () => {
    const serialized = serializeKosForSQLite(mockKos);
    const deserialized = deserializeKosFromSQLite(serialized);

    expect(deserialized.name).toBe(mockKos.name);
    expect(deserialized.priceMin).toBe(mockKos.priceMin);
    expect(deserialized.facilities).toEqual(mockKos.facilities);
    expect(deserialized.images).toEqual(mockKos.images);
  });
});
