import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If user is logged in, redirect based on role
  if (user) {
    if (user.role === 'pencari') {
      return <Redirect href="/(pencari)/home" />;
    }
    if (user.role === 'penyewa') {
      return <Redirect href="/(penyewa)/dashboard" />;
    }
    if (user.role === 'admin') {
      return <Redirect href="/(admin)/approvals" />;
    }
  }

  // Guest users (not logged in) go to map/home
  return <Redirect href="/(pencari)/home" />;
}
