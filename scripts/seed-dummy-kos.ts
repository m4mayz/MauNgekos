import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';

// Firebase config - sesuaikan dengan config project Anda
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Owner data
const OWNER_ID = 'CYJ5VgW3gdOhJZWyGIqQ8gF6AgZ2';
const OWNER_NAME = 'Amay';
const OWNER_PHONE = '6282111856806';

// Center point Sukabumi
const CENTER_LAT = -6.9058695;
const CENTER_LNG = 106.873752;
const RADIUS = 0.02; // ~2km radius

// Kos names pool
const KOS_NAMES = [
  'Kos Melati',
  'Kos Mawar',
  'Kos Anggrek',
  'Kos Sakura',
  'Kos Flamboyan',
  'Kos Cemara',
  'Kos Teratai',
  'Kos Kenanga',
  'Kos Dahlia',
  'Kos Tulip',
  'Kos Seruni',
  'Kos Azalea',
  'Kos Lavender',
  'Kos Camelia',
  'Kos Bougenville',
];

// Address templates
const STREETS = [
  'Jl. Pelabuhan II',
  'Jl. R.E. Martadinata',
  'Jl. Surya Kencana',
  'Jl. Suryakencana',
  'Jl. Jend. Ahmad Yani',
  'Jl. Bhayangkara',
  'Jl. Merdeka',
  'Jl. Pajajaran',
  'Jl. Pemuda',
  'Jl. Veteran',
];

const AREAS = ['Cibeureum', 'Gunung Parang', 'Lembursitu', 'Cikole', 'Warudoyong', 'Selabatu'];

// Room facilities
const ROOM_FACILITIES = [
  'K. Mandi Dalam',
  'Kloset Duduk',
  'Air Panas',
  'Kasur',
  'Lemari / Storage',
  'AC',
  'Meja',
  'Kursi',
  'Kipas Angin',
  'Jendela',
  'Termasuk Listrik',
];

// Common facilities
const COMMON_FACILITIES = [
  'WiFi',
  'Parkir Motor',
  'Dapur',
  'Mesin Cuci',
  'Penjaga Kos',
  'Laundry',
  'Kulkas',
  'Dispenser',
  'R. Keluarga',
];

// Unsplash images untuk kos
const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800',
  'https://images.unsplash.com/photo-1571508601936-6d0eaa3c3a21?w=800',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
  'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
  'https://images.unsplash.com/photo-1616137422495-b8a7e26e8e4c?w=800',
];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateRandomLocation(): GeoPoint {
  const latOffset = randomInRange(-RADIUS, RADIUS);
  const lngOffset = randomInRange(-RADIUS, RADIUS);
  return new GeoPoint(CENTER_LAT + latOffset, CENTER_LNG + lngOffset);
}

function generateAddress(kosName: string): string {
  const street = randomElement(STREETS);
  const number = randomInt(1, 200);
  const area = randomElement(AREAS);
  return `${street} No. ${number}, ${area}, Sukabumi`;
}

function generateDescription(kosName: string, type: string): string {
  const descriptions = [
    `${kosName} menawarkan hunian nyaman untuk mahasiswa dan pekerja ${type}. Dekat dengan kampus dan pusat kota.`,
    `Kos strategis di ${kosName} dengan fasilitas lengkap. Cocok untuk ${type} yang mencari tempat tinggal yang aman dan nyaman.`,
    `${kosName} adalah pilihan tepat untuk ${type} yang mengutamakan kenyamanan. Lokasi dekat dengan minimarket dan transportasi umum.`,
    `Hunian ${type} di ${kosName} dengan suasana tenang dan aman. Fasilitas lengkap dengan harga terjangkau.`,
    `${kosName} menyediakan kamar kos ${type} dengan lokasi strategis. Akses mudah ke berbagai fasilitas umum.`,
  ];
  return randomElement(descriptions);
}

async function seedDummyKos() {
  console.log('🚀 Starting dummy kos data generation...\n');

  // Verify Firebase config
  console.log('Firebase config check:');
  console.log('- API Key:', firebaseConfig.apiKey ? '✓ Set' : '✗ Missing');
  console.log('- Project ID:', firebaseConfig.projectId || '✗ Missing');
  console.log('- Auth Domain:', firebaseConfig.authDomain ? '✓ Set' : '✗ Missing');
  console.log('');

  const statusPool = [
    'approved',
    'approved',
    'approved',
    'approved',
    'approved',
    'approved',
    'approved',
    'approved',
    'pending',
    'pending',
    'pending',
    'pending',
    'rejected',
    'rejected',
    'rejected',
  ];

  const typePool: Array<'putra' | 'putri' | 'campur'> = [
    'putra',
    'putri',
    'campur',
    'putra',
    'putri',
    'campur',
    'putra',
    'putri',
    'campur',
    'putra',
    'putri',
    'campur',
    'putra',
    'putri',
    'campur',
  ];

  for (let i = 0; i < 15; i++) {
    const kosName = KOS_NAMES[i];
    const type = typePool[i];
    const status = statusPool[i];

    const priceBase = randomInt(500, 1500) * 1000;
    const priceMin = priceBase;
    const priceMax = priceBase + randomInt(200, 500) * 1000;

    const roomFacilitiesCount = randomInt(4, 8);
    const roomFacilities = randomElements(ROOM_FACILITIES, roomFacilitiesCount);

    const commonFacilitiesCount = randomInt(3, 6);
    const commonFacilities = randomElements(COMMON_FACILITIES, commonFacilitiesCount);

    const allFacilities = [...roomFacilities, ...commonFacilities];

    const imageCount = randomInt(3, 5);
    const images = randomElements(ROOM_IMAGES, imageCount);

    const totalRooms = randomInt(8, 20);
    const availableRooms = status === 'approved' ? randomInt(0, totalRooms) : 0;

    const location = generateRandomLocation();
    
    console.log(`\n[${i + 1}/15] Preparing ${kosName}...`);
    console.log('Location:', location.latitude, location.longitude);
    console.log('Facilities:', allFacilities.length);
    console.log('Images:', images.length);

    try {
      const docRef = await addDoc(collection(db, 'kos'), {
        ownerId: OWNER_ID,
        ownerName: OWNER_NAME,
        ownerPhone: OWNER_PHONE,
        name: kosName,
        address: generateAddress(kosName),
        location: location,
        type,
        priceMin,
        priceMax,
        facilities: allFacilities,
        totalRooms,
        availableRooms,
        images,
        description: generateDescription(kosName, type),
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ [${i + 1}/15] ${kosName} created (${type}, ${status}) - ID: ${docRef.id}`);
    } catch (error: any) {
      console.error(`❌ [${i + 1}/15] Failed to create ${kosName}:`);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error:', JSON.stringify(error, null, 2));
    }
  }

  console.log('\n✨ Dummy data generation completed!');
  console.log('\nSummary:');
  console.log('- Total kos: 15');
  console.log('- Approved: 8');
  console.log('- Pending: 4');
  console.log('- Rejected: 3');
  console.log('- Location: Sukabumi area');
  console.log('- Owner: Amay (CYJ5VgW3gdOhJZWyGIqQ8gF6AgZ2)');
}

// Run the script
seedDummyKos()
  .then(() => {
    console.log('\n👍 Script finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
