import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen
        name="approvals"
        options={{
          title: 'Kelola Persetujuan',
        }}
      />
      <Stack.Screen
        name="kos/[id]"
        options={{
          title: 'Detail Kos',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profil Admin',
        }}
      />
    </Stack>
  );
}
