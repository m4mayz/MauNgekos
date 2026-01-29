import { Timestamp, GeoPoint } from 'firebase/firestore';

export type UserRole = 'pencari' | 'penyewa' | 'admin';

export type KosType = 'putra' | 'putri' | 'campur';

export type KosStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  savedKos?: string[]; // Array of saved kos IDs
  kos_quota?: number; // Number of kos a penyewa can create (default: 1 for free, more for premium)
  createdAt: Timestamp;
}

export interface Kos {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerPhone?: string; // Nomor WhatsApp pemilik (format: 628xxx tanpa +)
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
  previousStatus?: KosStatus; // Status sebelumnya (untuk tracking re-submission)
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

// Room facilities (Fasilitas Kamar) with icons
export const ROOM_FACILITIES = {
  'K. Mandi Dalam': { label: 'K. Mandi Dalam', icon: 'material-symbols:shower' },
  'Kloset Duduk': { label: 'Kloset Duduk', icon: 'mdi:toilet' },
  'Air Panas': { label: 'Air Panas', icon: 'material-symbols:water-heater' },
  Kasur: { label: 'Kasur', icon: 'material-symbols:bed' },
  'Lemari / Storage': { label: 'Lemari / Storage', icon: 'streamline:shelf' },
  TV: { label: 'TV', icon: 'ic:round-tv' },
  AC: { label: 'AC', icon: 'material-symbols:ac-unit' },
  Meja: { label: 'Meja', icon: 'material-symbols:desk' },
  Kursi: { label: 'Kursi', icon: 'material-symbols:chair' },
  'Kipas Angin': { label: 'Kipas Angin', icon: 'material-symbols:mode-fan' },
  Jendela: { label: 'Jendela', icon: 'material-symbols:window' },
  'Termasuk Listrik': { label: 'Termasuk Listrik', icon: 'material-symbols:flash-on' },
} as const;

// Common facilities (Fasilitas Umum) with icons
export const COMMON_FACILITIES = {
  WiFi: { label: 'WiFi', icon: 'material-symbols:wifi' },
  'Parkir Mobil': { label: 'Parkir Mobil', icon: 'material-symbols:directions-car' },
  'Parkir Motor': { label: 'Parkir Motor', icon: 'material-symbols:two-wheeler' },
  Dapur: { label: 'Dapur', icon: 'material-symbols:fork-spoon' },
  'Mesin Cuci': { label: 'Mesin Cuci', icon: 'material-symbols:local-laundry-service' },
  'Penjaga Kos': { label: 'Penjaga Kos', icon: 'material-symbols:security' },
  Laundry: { label: 'Laundry', icon: 'material-symbols:laundry' },
  Mushola: { label: 'Mushola', icon: 'material-symbols:mosque' },
  Kulkas: { label: 'Kulkas', icon: 'material-symbols:kitchen' },
  Dispenser: { label: 'Dispenser', icon: 'material-symbols:water-drop' },
  'TV Umum': { label: 'TV Umum', icon: 'material-symbols:tv' },
  'R. Keluarga': { label: 'R. Keluarga', icon: 'cil:couch' },
} as const;

// Helper to get all facility keys
export const ROOM_FACILITY_KEYS = Object.keys(ROOM_FACILITIES) as Array<
  keyof typeof ROOM_FACILITIES
>;
export const COMMON_FACILITY_KEYS = Object.keys(COMMON_FACILITIES) as Array<
  keyof typeof COMMON_FACILITIES
>;
export const ALL_FACILITY_KEYS = [...ROOM_FACILITY_KEYS, ...COMMON_FACILITY_KEYS];

export type RoomFacility = keyof typeof ROOM_FACILITIES;
export type CommonFacility = keyof typeof COMMON_FACILITIES;
export type Facility = RoomFacility | CommonFacility;
export type FacilityCategory = 'room' | 'common';
