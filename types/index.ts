import { Timestamp, GeoPoint } from 'firebase/firestore';

export type UserRole = 'pencari' | 'penyewa' | 'admin';

export type KosType = 'putra' | 'putri' | 'campur';

export type KosStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: Timestamp;
}

export interface Kos {
  id: string;
  ownerId: string;
  ownerName?: string;
  name: string;
  address: string;
  location: GeoPoint;
  type: KosType;
  priceMin: number;
  priceMax: number;
  facilities: string[];
  totalRooms: number;
  availableRooms: number;
  images: string[];
  description?: string;
  status: KosStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface KosFilter {
  priceMin?: number;
  priceMax?: number;
  type?: KosType;
  facilities?: string[];
  hasAvailableRooms?: boolean;
}

// Room facilities (Fasilitas Kamar)
export const ROOM_FACILITIES = [
  'K. Mandi Dalam',
  'Kloset Duduk',
  'Air Panas',
  'Kasur',
  'Lemari / Storage',
  'TV',
  'AC',
  'Meja',
  'Kursi',
  'Kipas Angin',
  'Jendela',
  'Termasuk Listrik',
] as const;

// Common facilities (Fasilitas Umum)
export const COMMON_FACILITIES = [
  'WiFi',
  'Parkir Mobil',
  'Parkir Motor',
  'Dapur',
  'Mesin Cuci',
  'Penjaga Kos',
  'Laundry',
  'Mushola',
  'Kulkas',
  'Dispenser',
  'TV Umum',
  'R. Keluarga',
] as const;

// All facilities combined
export const FACILITIES = [...ROOM_FACILITIES, ...COMMON_FACILITIES] as const;

export type RoomFacility = (typeof ROOM_FACILITIES)[number];
export type CommonFacility = (typeof COMMON_FACILITIES)[number];
export type Facility = (typeof FACILITIES)[number];
export type FacilityCategory = 'room' | 'common';
