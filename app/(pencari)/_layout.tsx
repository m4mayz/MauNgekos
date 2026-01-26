import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { PortalHost } from '@rn-primitives/portal';

export default function PencariLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
          },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <PortalHost />
    </>
  );
}
