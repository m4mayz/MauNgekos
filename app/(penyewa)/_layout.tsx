import { Stack } from 'expo-router';

export default function PenyewaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Kos Saya',
        }}
      />
      <Stack.Screen
        name="kos/add"
        options={{
          title: 'Tambah Kos',
        }}
      />
      <Stack.Screen
        name="kos/[id]/edit"
        options={{
          title: 'Edit Kos',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profil',
        }}
      />
    </Stack>
  );
}
