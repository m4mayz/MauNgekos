import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function PenyewaLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#09090b' : '#fff',
        },
      }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="kos/add" />
      <Stack.Screen name="kos/[id]/edit" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
