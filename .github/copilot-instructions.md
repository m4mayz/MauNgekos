# MauNgekos - AI Agent Instructions

## Project Overview

**MauNgekos** is a React Native kos (boarding house) rental marketplace app built with Expo Router, TypeScript, and NativeWind. It supports three user roles: **pencari** (seekers), **penyewa** (landlords), and **admin**.

## Architecture

### Tech Stack

- **Framework**: Expo SDK 54 + Expo Router v6 (file-based routing)
- **UI**: NativeWind v4 (Tailwind CSS), @rn-primitives, custom UI components
- **Backend**: Firebase (Firestore + Auth) for data, Supabase Storage for images
- **State**: Context API ([AuthContext.tsx](contexts/AuthContext.tsx))
- **Icons**: Monicon (auto-generated from multiple collections)
- **Maps**: React Native Maps with Google Maps
- **Fonts**: Manrope (400-800 weights via @expo-google-fonts)

### Directory Structure

```
app/
  (auth)/       # Login, register
  (pencari)/    # Seeker role (tabs: home, favorites, profile)
  (penyewa)/    # Landlord role (dashboard, kos management)
  (admin)/      # Admin approval workflows
contexts/       # AuthContext for user state
services/       # kosService.ts - Firestore data layer
lib/            # firebase.ts, supabase.ts, facilityIcons.ts (auto-gen)
types/          # index.ts - shared types (User, Kos, facilities)
components/
  ui/           # Reusable primitives (text, button, card, etc.)
  icons/        # Auto-generated Monicon components
scripts/        # generate-icons.js, add-icon.js
```

## Critical Conventions

### Authentication & Routing

- **Role-based redirects** in [app/\_layout.tsx](app/_layout.tsx): pencari→home, penyewa→dashboard, admin→approvals
- **Guest access allowed** in `(pencari)` routes; protected routes require auth
- Firebase Auth uses `AsyncStorage` persistence; user data stored in Firestore `users` collection
- User type: `User { id, email, name, role: 'pencari'|'penyewa'|'admin', savedKos[], createdAt }`

### Data Architecture

- **Primary DB**: Firebase Firestore (collection: `kos`)
- **Image Storage**: Supabase Storage (bucket: `kos-images`)
- **Kos document**: `{ id, ownerId, name, address, location: GeoPoint, type: 'putra'|'putri'|'campur', priceMin, priceMax, facilities[], images[], status: 'pending'|'approved'|'rejected', ... }`
- **Service layer**: [services/kosService.ts](services/kosService.ts) - use functions like `getApprovedKos()`, `getKosByOwner()`, `getPendingKos()`
- **Client-side filtering**: Complex queries filtered in-memory (Firestore compound query limits)

### Icon System (Monicon)

- **Config**: [monicon.config.ts](monicon.config.ts) - lists icons as `'collection:icon-name'`
- **Auto-generation workflow**:
  1. Define facilities in [types/index.ts](types/index.ts) with `icon: 'material-symbols:bed'`
  2. Run `npm run icons` to regenerate [monicon.config.ts](monicon.config.ts) and [lib/facilityIcons.ts](lib/facilityIcons.ts)
  3. Imports are **static** (Metro bundler requirement) - no dynamic template literals
- **Add single icon**: `npm run add-icon material-symbols:wifi` (updates config + mapping)
- **Icon usage**: Import from `lib/facilityIcons.ts` - `const BedIcon = getFacilityIcon('material-symbols:bed')`
- **Collections used**: `material-symbols`, `ic`, `cil`, `mdi`, `streamline`

### Styling

- **Base**: NativeWind v4 classes (e.g., `className="bg-primary text-white"`)
- **Fonts**: Use utility classes - `font-medium`, `font-semibold`, `font-bold`, `font-extrabold`
- **Theme**: HSL CSS variables in [global.css](global.css) - `hsl(var(--primary))`
- **Text component**: [components/ui/text.tsx](components/ui/text.tsx) with variants (h1-h4, p, muted, lead)
- **Custom tab bar**: Animated capsule in [(pencari)/(tabs)/\_layout.tsx](<app/(pencari)/(tabs)/_layout.tsx>) using Reanimated

### Facilities

- **Two types**: `ROOM_FACILITIES` (bedroom features) and `COMMON_FACILITIES` (shared amenities)
- **Defined in**: [types/index.ts](types/index.ts) with labels and icon mappings
- **Access keys**: Use `ROOM_FACILITY_KEYS` and `COMMON_FACILITY_KEYS` for iteration
- **Example**: `ROOM_FACILITIES['Kasur'] = { label: 'Kasur', icon: 'material-symbols:bed' }`

## Common Workflows

### Development

```bash
npm run dev              # Start Expo dev server
npm run android          # Android with cache clear
npm run icons            # Regenerate icon config from types
npm run add-icon <name>  # Add single icon interactively
```

### Adding a New Facility

1. Add entry to `ROOM_FACILITIES` or `COMMON_FACILITIES` in [types/index.ts](types/index.ts)
2. Run `npm run icons` to update [monicon.config.ts](monicon.config.ts) and [lib/facilityIcons.ts](lib/facilityIcons.ts)
3. Icon auto-appears in facility selectors and kos cards

### Creating New UI Components

- Use @rn-primitives for accessible primitives (see [components/ui/](components/ui/))
- Extend with `cva` for variants (see [text.tsx](components/ui/text.tsx) pattern)
- Always support dark mode (`useColorScheme()` from nativewind)

### Adding a New Route

- Create file in `app/` folder (e.g., `app/(pencari)/search.tsx`)
- Protected routes: Add auth check in parent `_layout.tsx`
- Use `router.push()` or `router.replace()` from `expo-router`

### Image Upload Pattern

```typescript
// 1. Pick image with expo-image-picker
// 2. Upload to Supabase: uploadImage(uri, `kos/${kosId}/image.jpg`)
// 3. Store returned publicUrl in Firestore images[] array
```

## Things to Avoid

- ❌ Dynamic icon imports with template literals (Metro incompatible)
- ❌ Direct Firestore writes without using [kosService.ts](services/kosService.ts)
- ❌ Hard-coded colors - use theme variables or NativeWind classes
- ❌ Editing [lib/facilityIcons.ts](lib/facilityIcons.ts) manually (auto-generated)
- ❌ Complex Firestore compound queries (use client-side filtering in `getFilteredKos`)

## Key Files Reference

- [app/\_layout.tsx](app/_layout.tsx) - Auth routing logic
- [contexts/AuthContext.tsx](contexts/AuthContext.tsx) - User state management
- [services/kosService.ts](services/kosService.ts) - All Firestore operations
- [types/index.ts](types/index.ts) - Core types + facility definitions
- [lib/facilityIcons.ts](lib/facilityIcons.ts) - Icon mapping (DO NOT EDIT)
- [monicon.config.ts](monicon.config.ts) - Icon generation config
- [app/(pencari)/(tabs)/home.tsx](<app/(pencari)/(tabs)/home.tsx>) - Map + search UI example
