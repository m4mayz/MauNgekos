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

// Common facilities for kos
export const FACILITIES = [
  'WiFi',
  'AC',
  'Kamar Mandi Dalam',
  'Kamar Mandi Luar',
  'Parkir Motor',
  'Parkir Mobil',
  'Dapur',
  'Kulkas',
  'Mesin Cuci',
  'TV',
  'Meja Belajar',
  'Lemari',
  'Kasur',
  'Air Panas',
  'Security 24 Jam',
] as const;

export type Facility = (typeof FACILITIES)[number];
