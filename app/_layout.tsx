import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inPenyewaGroup = segments[0] === '(penyewa)';
    const inAdminGroup = segments[0] === '(admin)';

    // Only redirect if trying to access protected routes without auth
    if (!user && (inPenyewaGroup || inAdminGroup)) {
      // User is not signed in but trying to access protected routes
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // User is signed in but still in auth group, redirect based on role
      if (user.role === 'pencari') {
        router.replace('/(pencari)/home');
      } else if (user.role === 'penyewa') {
        router.replace('/(penyewa)/dashboard');
      } else if (user.role === 'admin') {
        router.replace('/(admin)/approvals');
      }
    }
    // Guest users can stay in (pencari) group without redirect
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Slot />
      <PortalHost />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
