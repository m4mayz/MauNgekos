import { View, Alert, ScrollView, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  LogOut,
  User,
  Phone,
  Mail,
  ChevronRight,
  Settings,
  HelpCircle,
  Info,
  Edit,
  UserCircle,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

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
        <Icon size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
        <Text className="flex-1 text-base">{title}</Text>
        <ChevronRight size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      </Pressable>
      <Separator />
    </>
  );

  // Guest State - User not logged in
  if (!user) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 items-center justify-center px-10">
            {/* Logo MauNgekos */}
            <Image
              source={require('@/assets/images/Horizontal-nobg.png')}
              className="mb-20 h-24 w-full"
              resizeMode="contain"
              tintColor={colorScheme === 'dark' ? '#fff' : 'hsl(175 66% 32%)'}
            />

            {/* Welcome Message */}
            <Text className="mb-8 text-center text-muted-foreground">
              Login untuk mengakses fitur lengkap dan menyimpan kos favorit Anda
            </Text>

            {/* Benefits List */}
            <View className="mb-10 w-full gap-3">
              <View className="flex-row items-start gap-3">
                <View className="mt-1 h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Text className="font-bold text-xs text-white">✓</Text>
                </View>
                <Text className="flex-1 text-foreground">Simpan dan kelola kos favorit Anda</Text>
              </View>

              <View className="flex-row items-start gap-3">
                <View className="mt-1 h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Text className="font-bold text-xs text-white">✓</Text>
                </View>
                <Text className="flex-1 text-foreground">Chat whatsapp dengan pemilik kos</Text>
              </View>
            </View>

            {/* Action Button */}
            <View className="w-full">
              <Button onPress={() => router.push('/(auth)/login')} size="lg">
                <Text>Masuk</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Logged In State
  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="items-center px-6 pb-5" style={{ paddingTop: insets.top + 20 }}>
          <Avatar alt={user.name || 'User'} className="mb-4 h-24 w-24">
            <AvatarFallback>
              <Text className="font-bold text-2xl">{user.name ? getInitials(user.name) : 'U'}</Text>
            </AvatarFallback>
          </Avatar>
          <Text className="font-bold text-xl text-foreground">{user.name}</Text>
        </View>

        {/* Contact Information */}
        <View className="px-4 py-2">
          <Separator className="mb-4" />

          <Text className="mb-3 px-1 font-semibold text-sm text-muted-foreground">
            INFORMASI KONTAK
          </Text>

          <View className="flex-row items-center gap-3 py-4">
            <Mail size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Email</Text>
              <Text className="text-base">{user.email}</Text>
            </View>
          </View>
          <Separator />

          {user.phone && (
            <>
              <View className="flex-row items-center gap-3 py-4">
                <Phone size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
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
              // TODO: Navigate to edit profile
              Alert.alert('Coming Soon', 'Fitur edit profil akan segera hadir');
            }}
          />

          <MenuItem
            icon={Settings}
            title="Pengaturan"
            onPress={() => {
              // TODO: Navigate to settings
              Alert.alert('Coming Soon', 'Fitur pengaturan akan segera hadir');
            }}
          />

          <MenuItem
            icon={Info}
            title="Tentang Aplikasi"
            onPress={() => {
              // TODO: Navigate to about
              Alert.alert('MauNgekos', 'Versi 1.0.0\n\nAplikasi pencarian kos terbaik');
            }}
          />

          <MenuItem
            icon={HelpCircle}
            title="Bantuan & Dukungan"
            onPress={() => {
              // TODO: Navigate to help
              Alert.alert('Bantuan', 'Hubungi kami di support@maungekos.com');
            }}
          />
        </View>

        {/* Sign Out Button */}
        <View className="mb-8 mt-4 px-4">
          <Button variant="destructive" onPress={handleSignOut} className="flex-row gap-2">
            <LogOut size={20} className="text-destructive-foreground" />
            <Text className="font-semibold text-destructive-foreground">Keluar</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
