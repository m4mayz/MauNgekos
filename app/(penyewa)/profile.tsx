import { View, Alert, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  LogOut,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  Info,
  Edit,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PenyewaProfileScreen() {
  const { user, signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const iconColor = colorScheme === 'dark' ? 'white' : 'black';
  const mutedColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  const handleSignOut = () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await signOut();
            router.replace('/(pencari)/home');
          } catch (error) {
            Alert.alert('Error', 'Gagal keluar');
          } finally {
            setLoading(false);
          }
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

  // Menu item component
  const MenuItem = ({
    icon: Icon,
    title,
    onPress,
  }: {
    icon: any;
    title: string;
    onPress: () => void;
  }) => (
    <>
      <Pressable onPress={onPress} className="flex-row items-center gap-3 py-4 active:opacity-70">
        <Icon size={20} color={iconColor} />
        <Text className="flex-1 text-base">{title}</Text>
        <ChevronRight size={18} color={mutedColor} />
      </Pressable>
      <Separator />
    </>
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View className="flex-row items-center gap-2 px-2" style={{ paddingTop: insets.top + 10 }}>
          <Button variant="ghost" size="icon" onPress={() => router.back()}>
            <ChevronLeft size={24} color={iconColor} />
          </Button>
          <Text className="font-semibold text-lg">Profil</Text>
        </View>

        {/* Profile Header */}
        <View className="items-center px-6 py-8">
          <Avatar alt={user?.name || 'User'} className="mb-4 h-24 w-24">
            <AvatarFallback>
              <Text className="font-bold text-2xl">
                {user?.name ? getInitials(user.name) : 'U'}
              </Text>
            </AvatarFallback>
          </Avatar>
          <Text className="font-bold text-xl text-foreground">{user?.name}</Text>
          <Text className="mt-1 text-muted-foreground">Pemilik Kos</Text>
        </View>

        {/* Contact Information */}
        <View className="px-4 py-2">
          <Separator className="mb-4" />

          <Text className="mb-3 px-1 font-semibold text-sm text-muted-foreground">
            INFORMASI KONTAK
          </Text>

          <View className="flex-row items-center gap-3 py-4">
            <Mail size={20} color={iconColor} />
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Email</Text>
              <Text className="text-base">{user?.email}</Text>
            </View>
          </View>
          <Separator />

          {user?.phone && (
            <>
              <View className="flex-row items-center gap-3 py-4">
                <Phone size={20} color={iconColor} />
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground">Telepon</Text>
                  <Text className="text-base">{user.phone}</Text>
                </View>
              </View>
              <Separator />
            </>
          )}
        </View>

        {/* Menu Section */}
        <View className="px-4 py-2">
          <Text className="mb-3 px-1 font-semibold text-sm text-muted-foreground">PENGATURAN</Text>

          <MenuItem
            icon={Edit}
            title="Edit Profil"
            onPress={() => {
              Alert.alert('Coming Soon', 'Fitur edit profil akan segera hadir');
            }}
          />

          <MenuItem
            icon={Settings}
            title="Pengaturan"
            onPress={() => {
              Alert.alert('Coming Soon', 'Fitur pengaturan akan segera hadir');
            }}
          />

          <MenuItem
            icon={Info}
            title="Tentang Aplikasi"
            onPress={() => {
              Alert.alert('MauNgekos', 'Versi 1.0.0\n\nAplikasi pencarian kos terbaik');
            }}
          />

          <MenuItem
            icon={HelpCircle}
            title="Bantuan & Dukungan"
            onPress={() => {
              Alert.alert('Bantuan', 'Hubungi kami di support@maungekos.com');
            }}
          />
        </View>

        {/* Sign Out Button */}
        <View className="mb-8 mt-4 px-4">
          <Button
            variant="destructive"
            onPress={handleSignOut}
            disabled={loading}
            className="flex-row gap-2">
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <LogOut size={20} color="#fff" />
                <Text className="font-semibold text-destructive-foreground">Keluar</Text>
              </>
            )}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
