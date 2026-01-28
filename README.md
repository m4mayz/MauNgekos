# MauNgekos

![GitHub stars](https://img.shields.io/github/stars/m4mayz/MauNgekos?style=social)
![GitHub forks](https://img.shields.io/github/forks/m4mayz/MauNgekos?style=social)
![GitHub issues](https://img.shields.io/github/issues/m4mayz/MauNgekos)
![GitHub license](https://img.shields.io/github/license/m4mayz/MauNgekos)
![GitHub last commit](https://img.shields.io/github/last-commit/m4mayz/MauNgekos)

React Native marketplace untuk kos-kosan di Indonesia. Dibangun dengan Expo Router, offline-first architecture, dan auto-generated icon system.

<!-- TODO: Add screenshots -->

![Home Screen](assets/screenshots/home.png)
![Map View](assets/screenshots/map.png)
![Kos Detail](assets/screenshots/detail.png)

<!-- TODO: Add demo GIF -->
<!-- ![Demo](assets/demo.gif) -->

## What This Does

MauNgekos adalah marketplace kos dengan tiga role: **pencari** (yang nyari kos), **penyewa** (yang punya kos), dan **admin** (yang approve listing).

Yang menarik dari project ini: **data di-cache ke SQLite dulu, baru sync ke Firestore** — jadi app tetap cepat meski koneksi jelek. Saya bikin ini untuk belajar Expo Router v6 (file-based routing), offline-first architecture, dan eksperimen dengan auto-generate icon system.

Challenge terbesar: Managing 40+ icons secara manual itu nightmare. Jadi saya bikin script yang generate icon components dari facility type definitions di TypeScript — edit types, run script, icons auto-update di seluruh app.

## Tech Stack

### Core Framework

![Expo](https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=#D04A37)
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)

- **Expo SDK**: 54.0.29 - New architecture enabled, pengen coba performa boost
- **React Native**: 0.81.5 - Latest stable dengan Hermes
- **TypeScript**: 5.9.2 - Strict mode, type safety di semua layer
- **Expo Router**: 6.0.19 - File-based routing kayak Next.js, lebih intuitive dari stack navigator

### Backend & Storage

![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

- **Firebase Firestore**: Main database - real-time, free tier cukup untuk MVP
- **Firebase Auth**: Email/password authentication dengan AsyncStorage persistence
- **Supabase Storage**: Image hosting - gratis 1GB, Firebase Storage berbayar
- **SQLite**: Offline cache - read from local first, sync di background

### UI & Styling

![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

- **NativeWind**: 4.2.1 - Tailwind classes di React Native, game changer untuk rapid prototyping
- **@rn-primitives**: Accessible UI components (alert-dialog, checkbox, select, etc)
- **Monicon**: Auto-generated icons dari 5 collections (lucide, material-symbols, mdi, cil, streamline)
- **react-native-maps**: Google Maps integration dengan custom markers
- **Reanimated**: Custom animated tab bar dengan smooth transitions
- **Manrope**: Google Font dengan weights 400-800

### Development

![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)

- **Jest**: Unit & integration testing
- **Prettier**: Auto-formatting
- **EAS**: Build & deployment pipeline

## Getting Started

### Prerequisites

```bash
# Required
node >= 18
npm atau yarn
expo-cli

# Platform-specific
Android Studio (untuk Android)
Xcode (untuk iOS, macOS only)

# Backend accounts
Firebase project
Supabase project
Google Maps API key
```

### Installation

```bash
# Clone repo
git clone https://github.com/m4mayz/MauNgekos.git
cd MauNgekos

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan credentials Anda (lihat Environment Setup di bawah)

# Run app
npm run dev           # Start Expo dev server
npm run android       # Android emulator
npm run ios           # iOS simulator (macOS only)
```

### Environment Setup

File `.env` butuh 9 variables dari Firebase, Supabase, dan Google Maps:

**Firebase Configuration** ([console.firebase.google.com](https://console.firebase.google.com))

```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

**Supabase Configuration** ([app.supabase.com](https://app.supabase.com))

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

Buat storage bucket bernama `kos-images` di Supabase (public bucket).

**Google Maps API** ([console.cloud.google.com](https://console.cloud.google.com))

```env
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

Enable Maps SDK for Android dan Maps SDK for iOS.

### Firestore Setup

Buat 2 collections di Firebase Console:

**users**

```
id: string
email: string
name: string
role: 'pencari' | 'penyewa' | 'admin'
savedKos: string[]
createdAt: timestamp
```

**kos**

```
id: string
ownerId: string
name: string
address: string
location: GeoPoint
type: 'putra' | 'putri' | 'campur'
priceMin: number
priceMax: number
facilities: string[]
images: string[]
status: 'pending' | 'approved' | 'rejected'
createdAt: timestamp
```

## How It Works

### Offline-First Architecture

Data flow: **SQLite cache → Firestore sync → UI**

```typescript
// services/sqliteService.ts - Read cache first
const cachedKos = await getAllKosFromSQLite();

// services/syncService.ts - Background sync
NetInfo.addEventListener(async (state) => {
  if (state.isConnected) {
    await syncKosData(); // Sync di background
  }
});
```

Why? Network latency di Indonesia bisa unpredictable. Dengan read-from-cache-first, app feels instant. Sync happens di background pakai NetInfo listener.

### Auto-Generated Icon System

Problem: Managing 40+ icon imports secara manual prone to error, susah maintain consistency.

Solution: Generate icon components dari facility type definitions.

**Workflow:**

1. Define facilities di [types/index.ts](types/index.ts):

```typescript
export const ROOM_FACILITIES = {
  Kasur: { label: 'Kasur', icon: 'material-symbols:bed' },
  AC: { label: 'AC', icon: 'material-symbols:ac-unit' },
  Wifi: { label: 'Wifi', icon: 'material-symbols:wifi' },
};
```

2. Run `npm run icons`:

```bash
npm run icons
# → Reads types/index.ts
# → Generates monicon.config.ts
# → Generates lib/facilityIcons.ts
# → Creates components/icons/
```

3. Icons auto-available di seluruh app via static imports (Metro bundler requirement).

Constraint: Metro bundler tidak support dynamic imports dengan template literals. Jadi semua icon imports harus static, hence the auto-generation.

### Role-Based Routing

[app/\_layout.tsx](app/_layout.tsx) redirect based on user role:

```typescript
if (user.role === 'pencari') router.replace('/(pencari)/(tabs)/home');
if (user.role === 'penyewa') router.replace('/(penyewa)/dashboard');
if (user.role === 'admin') router.replace('/(admin)/approvals');
```

Guest access allowed di `(pencari)` routes untuk browsing tanpa login.

## Project Structure

```
app/                      # Expo Router file-based routes
├── (auth)/              # Login & register
├── (pencari)/           # Seeker role (tabs: home, favorites, profile)
├── (penyewa)/           # Landlord role (dashboard, kos CRUD)
├── (admin)/             # Admin approval flows
└── _layout.tsx          # Auth routing logic

components/
├── ui/                  # Reusable primitives
├── icons/               # Auto-generated (DO NOT EDIT)
└── KosDetailSheet.tsx   # Bottom sheet component

services/
├── kosService.ts        # Firestore CRUD operations
├── sqliteService.ts     # Local cache layer
└── syncService.ts       # Offline-first sync

lib/
├── firebase.ts          # Firebase config
├── supabase.ts          # Supabase client + image upload
├── facilityIcons.ts     # Auto-generated icon map (DO NOT EDIT)
└── utils.ts             # Helpers

types/
└── index.ts             # TypeScript types + facility definitions

scripts/
├── generate-icons.js    # Auto-generate icon system
└── add-icon.js          # Add single icon interactively
```

## What I Learned

### Offline-First Strategy is Non-Trivial

Initial assumption: "Just cache Firestore queries". Reality: Need proper sync strategy, conflict resolution, stale data handling. Ended up with SQLite as single source of truth for reads, Firestore for writes, NetInfo listener for sync timing.

### Metro Bundler Has Hard Constraints

Dynamic imports dengan template literals tidak bisa:

```typescript
// This breaks Metro:
import(`@/components/icons/${collection}/${name}`);
```

Solution: Auto-generate static imports. Script reads type definitions, generates all imports upfront.

### File-Based Routing Scales Better

Expo Router's file-based routing lebih intuitive than imperative navigation. Route groups `(auth)`, `(pencari)` for organization. Layout files handle role-based redirects cleanly.

### NativeWind Changes Everything

Tailwind di React Native = rapid prototyping on steroids. Dark mode support via CSS variables. Responsive breakpoints work out of the box. No more StyleSheet.create boilerplate.

### Firestore Query Limits

Firestore hanya support 1 array-contains per query. Complex filters (multiple facilities, price range, type) harus client-side. For production, better use Algolia or Typesense.

## Available Commands

| Command                 | Description                                |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Start Expo dev server (with cache clear)   |
| `npm run android`       | Run on Android emulator                    |
| `npm run ios`           | Run on iOS simulator (macOS only)          |
| `npm run icons`         | Regenerate icon config from facility types |
| `npm run add-icon`      | Add single icon interactively              |
| `npm test`              | Run Jest tests                             |
| `npm run test:coverage` | Generate test coverage report              |

## Known Limitations

1. **Client-side filtering** - Firestore query limits force complex filters to run in-memory
2. **No image compression** - Images uploaded as-is, can be large
3. **Single array-contains query** - Can't filter multiple facilities at Firestore level
4. **Hardcoded bucket name** - `kos-images` not configurable via env
5. **No pagination** - All kos loaded at once (fine for MVP, not scalable)

## Future Ideas

- [ ] Add image compression before upload (expo-image-manipulator)
- [ ] Implement pagination for kos list (Firestore cursor-based)
- [ ] Migrate search to Algolia for better filtering
- [ ] Add push notifications for approval status (Expo Notifications)
- [ ] Chat feature between pencari and penyewa
- [ ] Analytics dashboard for penyewa (views, favorites, clicks)
- [ ] Rating & review system

## License

Personal project for portfolio and learning purposes.

---

Built with React Native, Expo, and TypeScript. January 2026.
