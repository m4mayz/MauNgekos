import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LogOut, Phone, Mail, ChevronLeft } from 'lucide-react-native';
import { Stack } from 'expo-router';

export default function PenyewaProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Button variant="ghost" size="icon" onPress={() => router.back()}>
              <ChevronLeft size={24} className="text-foreground" />
            </Button>
          ),
        }}
      />

      {/* Profile Header */}
      <View className="items-center bg-card px-4 py-8">
        <Avatar alt={user?.name || 'User'} className="mb-4 h-24 w-24">
          <AvatarFallback>
            <Text className="text-2xl font-bold">{user?.name ? getInitials(user.name) : 'U'}</Text>
          </AvatarFallback>
        </Avatar>
        <Text className="text-xl font-bold text-foreground">{user?.name}</Text>
        <Text className="mt-1 capitalize text-muted-foreground">Pemilik Kos</Text>
      </View>

      <Separator />

      {/* Info Items */}
      <View className="gap-4 p-4">
        <View className="flex-row items-center gap-4 rounded-xl bg-card p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Mail size={20} className="text-primary" />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-muted-foreground">Email</Text>
            <Text className="font-medium">{user?.email}</Text>
          </View>
        </View>

        {user?.phone && (
          <View className="flex-row items-center gap-4 rounded-xl bg-card p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Phone size={20} className="text-primary" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Telepon</Text>
              <Text className="font-medium">{user.phone}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Sign Out Button */}
      <View className="mb-8 mt-auto px-4">
        <Button variant="destructive" onPress={handleSignOut} className="flex-row gap-2">
          <LogOut size={20} className="text-destructive-foreground" />
          <Text className="font-semibold text-destructive-foreground">Keluar</Text>
        </Button>
      </View>
    </View>
  );
}
