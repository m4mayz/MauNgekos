import { View, Alert, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
  Building2,
  Award,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PenyewaProfileScreen() {
  const { user, signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const iconColor = colorScheme === 'dark' ? '#14b8a6' : 'black';
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
            router.replace('/(pencari)/(tabs)/home');
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
      <Pressable onPress={onPress} className="flex-row items-center gap-3 p-4 active:opacity-70">
        <Icon size={20} color={iconColor} />
        <Text className="flex-1 font-medium">{title}</Text>
        <ChevronRight size={18} color={mutedColor} />
      </Pressable>
      <Separator />
    </>
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gradient Hero Header */}
        <LinearGradient
          colors={
            colorScheme === 'dark'
              ? ['#0d9488', '#0f766e', '#115e59']
              : ['#99f6e4', '#5eead4', '#2dd4bf']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 12 }}>
          {/* Back Button */}
          <View className="px-2 pb-3">
            <Button variant="ghost" size="icon" onPress={() => router.back()}>
              <ChevronLeft size={24} color={colorScheme === 'dark' ? '#fff' : '#0f766e'} />
            </Button>
          </View>

          {/* Profile Header with Avatar */}
          <View className="items-center px-6 pb-8">
            <View className="mb-4 rounded-full border-4 border-white shadow-lg shadow-black/20">
              <Avatar alt={user?.name || 'User'} className="h-28 w-28">
                <AvatarFallback>
                  <Text className="font-bold text-3xl text-primary">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </Text>
                </AvatarFallback>
              </Avatar>
            </View>
            <Text
              className={
                colorScheme === 'dark'
                  ? 'font-bold text-2xl text-white'
                  : 'font-bold text-2xl text-teal-900'
              }>
              {user?.name}
            </Text>
            <View className="mt-2 rounded-full bg-white/90 px-4 py-1.5 dark:bg-white/10">
              <Text
                className={
                  colorScheme === 'dark' ? 'text-sm text-white/90' : 'text-sm text-teal-700'
                }>
                🏠 Pemilik Kos
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quota Card */}
        <View className="-mt-6 px-4">
          <View className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/10">
            <View className="p-4">
              <View className="mb-3 flex-row items-center gap-2">
                <View className="rounded-full bg-primary/10 p-2">
                  <Building2 size={20} color="#14b8a6" />
                </View>
                <Text className="font-bold text-lg">Kuota Kos</Text>
              </View>
              <View className="flex-row items-end gap-2">
                <Text className="font-extrabold text-4xl text-primary">{user?.kos_quota || 1}</Text>
                <Text className="mb-2 text-muted-foreground">kos tersedia</Text>
              </View>
              <View className="mt-3 rounded-xl bg-primary/5 p-3">
                <Text className="text-center text-xs text-muted-foreground">
                  💎 Upgrade ke Premium untuk kuota tak terbatas
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View className="mt-4 px-4">
          <Text className="mb-3 px-1 font-semibold text-sm text-muted-foreground">
            INFORMASI KONTAK
          </Text>

          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            <View className="flex-row items-center gap-3 p-4">
              <View className="rounded-full bg-primary/10 p-2.5">
                <Mail size={20} color="#14b8a6" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted-foreground">Email</Text>
                <Text className="font-medium">{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View className="mt-4 px-4">
          <Text className="mb-3 px-1 font-semibold text-sm text-muted-foreground">PENGATURAN</Text>

          <View className="overflow-hidden rounded-2xl border border-border bg-card">
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
        </View>

        {/* Sign Out Button */}
        <View className="mb-8 mt-6 px-4">
          <Button
            variant="destructive"
            onPress={handleSignOut}
            disabled={loading}
            size="lg"
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
