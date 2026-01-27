import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GeoPoint, Timestamp } from 'firebase/firestore';
import type { Kos } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * SQLite Serialization Helpers
 * Convert Firestore types to SQLite-compatible primitives
 */

export interface SQLiteKosRow {
  id: string;
  ownerId: string;
  ownerName: string | null;
  ownerPhone: string | null;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  priceMin: number;
  priceMax: number;
  facilities: string; // JSON string
  totalRooms: number;
  availableRooms: number;
  images: string; // JSON string
  description: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  status: string;
  createdAt: number; // Unix timestamp in milliseconds
  updatedAt: number; // Unix timestamp in milliseconds
  syncedAt: number; // Unix timestamp in milliseconds
}

/**
 * Serialize Kos object for SQLite storage
 */
export function serializeKosForSQLite(kos: Kos): SQLiteKosRow {
  return {
    id: kos.id,
    ownerId: kos.ownerId,
    ownerName: kos.ownerName || null,
    ownerPhone: kos.ownerPhone || null,
    name: kos.name,
    address: kos.address,
    latitude: kos.location.latitude,
    longitude: kos.location.longitude,
    type: kos.type,
    priceMin: kos.priceMin,
    priceMax: kos.priceMax,
    facilities: JSON.stringify(kos.facilities || []),
    totalRooms: kos.totalRooms,
    availableRooms: kos.availableRooms,
    images: JSON.stringify(kos.images || []),
    description: kos.description || null,
    contactPhone: kos.contactPhone || null,
    contactWhatsapp: kos.contactWhatsapp || null,
    status: kos.status,
    createdAt: kos.createdAt instanceof Timestamp ? kos.createdAt.toMillis() : kos.createdAt,
    updatedAt: kos.updatedAt instanceof Timestamp ? kos.updatedAt.toMillis() : kos.updatedAt,
    syncedAt: Date.now(),
  };
}

/**
 * Deserialize SQLite row to Kos object
 */
export function deserializeKosFromSQLite(row: SQLiteKosRow): Kos {
  return {
    id: row.id,
    ownerId: row.ownerId,
    ownerName: row.ownerName || undefined,
    ownerPhone: row.ownerPhone || undefined,
    name: row.name,
    address: row.address,
    location: new GeoPoint(row.latitude, row.longitude),
    type: row.type as 'putra' | 'putri' | 'campur',
    priceMin: row.priceMin,
    priceMax: row.priceMax,
    facilities: JSON.parse(row.facilities),
    totalRooms: row.totalRooms,
    availableRooms: row.availableRooms,
    images: JSON.parse(row.images),
    description: row.description || undefined,
    contactPhone: row.contactPhone || undefined,
    contactWhatsapp: row.contactWhatsapp || undefined,
    status: row.status as 'pending' | 'approved' | 'rejected',
    createdAt: Timestamp.fromMillis(row.createdAt),
    updatedAt: Timestamp.fromMillis(row.updatedAt),
  };
}
