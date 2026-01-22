import { Tabs } from 'expo-router';
import { MapPin, User, Heart } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PortalHost } from '@rn-primitives/portal';

export default function PencariLayout() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colorScheme === 'dark' ? '#fff' : '#000',
          tabBarInactiveTintColor: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280',
          tabBarStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
            borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
            height: 70 + insets.bottom,
          },
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
          },
          headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Peta',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorit',
            tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="kos/[id]"
          options={{
            href: null,
            title: 'Detail Kos',
          }}
        />
      </Tabs>
      <PortalHost />
    </>
  );
}
