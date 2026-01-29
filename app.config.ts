import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'MauNgekos',
  slug: 'MauNgekos',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'MauNgekos',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    backgroundColor: '#1c877e',
    image: './assets/images/Horizontal-nobg.png',
    imageWidth: 150,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.maungekos.app',
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Kami memerlukan lokasi Anda untuk menampilkan kos terdekat.',
      NSLocationAlwaysUsageDescription:
        'Kami memerlukan lokasi Anda untuk menampilkan kos terdekat.',
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    package: 'com.maungekos.app',
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      },
    },
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.RECORD_AUDIO',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Izinkan MauNgekos mengakses lokasi Anda untuk menemukan kos terdekat.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Izinkan MauNgekos mengakses foto Anda untuk upload gambar.',
      },
    ],
    'expo-file-system',
    'expo-sqlite',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '9cd196b3-2d74-4acc-bc72-d03b76d80b83',
    },
    // Environment variables accessible via expo-constants
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.FIREBASE_APP_ID,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  },
});
