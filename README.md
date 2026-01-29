# MauNgekos

![GitHub stars](https://img.shields.io/github/stars/m4mayz/MauNgekos?style=social)
![GitHub forks](https://img.shields.io/github/forks/m4mayz/MauNgekos?style=social)
![GitHub issues](https://img.shields.io/github/issues/m4mayz/MauNgekos)
![GitHub license](https://img.shields.io/github/license/m4mayz/MauNgekos)
![GitHub last commit](https://img.shields.io/github/last-commit/m4mayz/MauNgekos)

React Native marketplace untuk kos-kosan di Indonesia. Dibangun dengan Expo Router, online-first architecture, dan auto-generated icon system.

<!-- TODO: Add screenshots -->

![Home Screen](assets/screenshots/home.png)
![Map View](assets/screenshots/map.png)
![Kos Detail](assets/screenshots/detail.png)

<!-- TODO: Add demo GIF -->
<!-- ![Demo](assets/demo.gif) -->

## What This Does

MauNgekos adalah marketplace kos dengan tiga role: **pencari** (yang nyari kos), **penyewa** (yang punya kos), dan **admin** (yang approve listing).

Yang menarik dari project ini: **online-first architecture dengan SQLite cache fallback** — app fetch fresh data from Firestore ketika online, dan fallback ke SQLite cache ketika offline. Saya bikin ini untuk belajar Expo Router v6 (file-based routing), network-aware caching strategy, dan eksperimen dengan auto-generate icon system.

Challenge terbesar: Managing 40+ icons secara manual itu nightmare. Jadi saya bikin script yang generate icon components dari facility type definitions di TypeScript — edit types, run script, icons auto-update di seluruh app.

## Tech Stack

### Core Framework

![Expo](https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=#D04A37)
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)

- **Expo SDK**: 54.0.32 - New architecture enabled untuk performa boost
- **React Native**: 0.81.5 - Latest stable dengan Hermes engine
- **TypeScript**: 5.9.2 - Strict mode, type safety di semua layer
- **Expo Router**: 6.0.22 - File-based routing kayak Next.js, lebih intuitive dari stack navigator
- **React**: 19.1.0 - Latest version dengan React Server Components support

### Backend & Storage

![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)

- **Firebase**: 12.8.0 - Firestore untuk main database, Auth untuk email/password authentication
- **Supabase**: 2.91.0 - Storage untuk image hosting (gratis 1GB, lebih murah dari Firebase Storage)
- **SQLite**: 16.0.10 (expo-sqlite) - Local cache untuk online-first strategy
- **NetInfo**: 11.4.1 (@react-native-community/netinfo) - Network detection untuk auto-sync

### UI & Styling

![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

- **NativeWind**: 4.2.1 - Tailwind classes di React Native untuk rapid prototyping
- **@rn-primitives**: 1.2.0+ - Accessible UI components (alert-dialog, checkbox, select, tabs, dll)
- **Monicon**: 2.0.7 - Auto-generated icons dari 5 collections (lucide, material-symbols, mdi, cil, streamline)
- **Lucide React Native**: 0.545.0 - Icon library untuk UI elements
- **react-native-maps**: 1.20.1 - Google Maps integration dengan custom markers
- **Reanimated**: 4.1.1 + Gesture Handler 2.28.0 + Worklets 0.5.1 - Smooth animations dan gestures
- **Manrope**: Font dari @expo-google-fonts dengan weights 400-800

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

#### users

```javascript
{
  id: string,
  email: string,
  name: string,
  role: 'pencari' | 'penyewa' | 'admin',
  savedKos: string[],        // Only for 'pencari' - array of saved kos IDs
  kos_quota: number,          // Only for 'penyewa' - number of kos allowed (default: 1)
  createdAt: timestamp
}
```

#### kos

```javascript
{
  id: string,
  ownerId: string,
  ownerName: string,              // Optional - owner display name
  ownerPhone: string,             // Optional - WhatsApp number (format: 628xxx tanpa +)
  name: string,
  address: string,
  location: GeoPoint,             // Firebase GeoPoint with latitude/longitude
  type: 'putra' | 'putri' | 'campur',
  priceMin: number,
  priceMax: number,
  facilities: string[],           // Array dari ROOM_FACILITIES + COMMON_FACILITIES keys
  totalRooms: number,
  availableRooms: number,
  images: string[],               // Array of Supabase Storage URLs
  description: string,            // Optional
  status: 'pending' | 'approved' | 'rejected',
  previousStatus: 'pending' | 'approved' | 'rejected',  // Optional - untuk tracking re-submission
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## How It Works

### Online-First Architecture with SQLite Cache

Data flow: **Firestore (when online) → SQLite cache (fallback) → UI**

```typescript
// services/kosService.ts - Online-first strategy
const isOnline = await syncService.isOnline();

if (isOnline) {
  // 1. When ONLINE: Fetch fresh data from Firebase first
  const freshData = await getApprovedKosFromFirestore();

  // 2. Update SQLite cache in background (don't await)
  sqliteService.insertManyKos(freshData).catch(console.error);

  return freshData; // Return fresh data immediately
} else {
  // 3. When OFFLINE: Read from SQLite cache
  return await sqliteService.getAllApprovedKos();
}
```

**Why Online-First?** Users expect fresh, real-time data ketika online. SQLite cache hanya untuk fallback when offline atau Firebase error. Network listener (`@react-native-community/netinfo`) triggers auto-sync ketika device kembali online.

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

1. Run `npm run icons`:

```bash
npm run icons
# → Reads types/index.ts
# → Generates monicon.config.ts
# → Generates lib/facilityIcons.ts
# → Creates components/icons/
```

1. Icons auto-available di seluruh app via static imports (Metro bundler requirement).

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
app/                               # Expo Router file-based routes
├── (auth)/                        # Authentication group (login, register)
│   ├── login.tsx
│   ├── register.tsx
│   └── _layout.tsx
├── (pencari)/                     # Seeker role (guest access allowed)
│   ├── (tabs)/                    # Tab navigation
│   │   ├── home.tsx               # Map view dengan filters
│   │   ├── favorites.tsx          # Saved kos (requires auth)
│   │   ├── profile.tsx
│   │   └── _layout.tsx            # Custom animated tab bar
│   └── _layout.tsx
├── (penyewa)/                     # Landlord role (protected)
│   ├── dashboard.tsx              # Kos management list
│   ├── kos/
│   │   ├── add.tsx                # Create new kos
│   │   └── edit/[id].tsx          # Edit existing kos
│   ├── profile.tsx
│   └── _layout.tsx
├── (admin)/                       # Admin role (protected)
│   ├── approvals.tsx              # Approve/reject kos queue
│   ├── kos/[id].tsx               # Kos detail for approval
│   ├── profile.tsx
│   └── _layout.tsx
├── _layout.tsx                    # Root: Auth routing + SQLite init + Sync listener
├── index.tsx                      # Entry redirect
├── +html.tsx                      # HTML head config
└── +not-found.tsx                 # 404 handler

components/
├── ui/                            # 20 Reusable primitives (@rn-primitives)
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── checkbox.tsx
│   ├── tabs.tsx
│   └── ...                        # 15 more components
├── icons/                         # Auto-generated (DO NOT EDIT)
│   ├── material-symbols/
│   ├── lucide/
│   ├── mdi/
│   ├── cil/
│   └── streamline/
├── KosDetailSheet.tsx             # Bottom sheet untuk kos details
└── PageHeader.tsx                 # Reusable header component

contexts/
└── AuthContext.tsx                # Firebase auth provider dengan user state

services/
├── kosService.ts                  # Firestore CRUD + online-first logic
├── sqliteService.ts               # Local cache layer (CRUD + sync queue)
├── syncService.ts                 # Background sync dengan NetInfo listener
└── draftService.ts                # Draft kos persistence (AsyncStorage)

lib/
├── firebase.ts                    # Firebase config (Firestore + Auth)
├── supabase.ts                    # Supabase client + image upload helpers
├── database.ts                    # SQLite initialization
├── theme.ts                       # NativeWind theme config
├── utils.ts                       # Helper functions (cn, serializers, etc)
└── facilityIcons.ts               # Auto-generated icon map (DO NOT EDIT)

types/
└── index.ts                       # TypeScript types + facility definitions with icons

scripts/
├── generate-icons.js              # Auto-generate icon system dari types/index.ts
├── add-icon.js                    # Add single icon interactively
└── seed-dummy-kos.ts              # Seed dummy data (development)
```

## What I Learned

### Online-First Strategy Balances Freshness and Reliability

Initial assumption: "Just cache Firestore queries". Reality: Need proper network detection, smart fallback strategy, and background cache updates. Ended up with online-first approach: when online, fetch fresh data from Firestore and update SQLite cache in background; when offline, read from local SQLite cache. NetInfo listener triggers auto-sync when connection restored.

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
