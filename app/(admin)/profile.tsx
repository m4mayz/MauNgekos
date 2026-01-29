import { View, Alert, Pressable, Image } from 'react-native';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  LogOut,
  Phone,
  Mail,
  ChevronLeft,
  UserCog,
  Clock,
  CheckCircle,
  Activity,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function AdminProfileScreen() {
  const { user, signOut } = useAuth();
  const { colorScheme } = useColorScheme();

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
          headerShown: false,
        }}
      />

      {/* Hero Header with Gradient */}
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['#14b8a6', '#0d9488', '#0f766e']
            : ['#ccfbf1', '#99f6e4', '#5eead4']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="relative overflow-hidden pb-8 pt-12">
        {/* Decorative Elements */}
        <View className="absolute right-[-30] top-10 h-28 w-28 rounded-full bg-white/10" />
        <View className="absolute left-[-20] top-40 h-20 w-20 rounded-full bg-white/5" />

        {/* Back Button */}
        <View className="px-4">
          <Pressable
            onPress={() => router.back()}
            className="mb-6 h-10 w-10 items-center justify-center rounded-xl bg-white/20 active:bg-white/30">
            <ChevronLeft
              size={24}
              color={colorScheme === 'dark' ? '#fff' : '#0f766e'}
              strokeWidth={2.5}
            />
          </Pressable>

          {/* Profile Avatar & Info */}
          <View className="items-center">
            <View className="mb-3 overflow-hidden rounded-full border-4 border-white/30 shadow-2xl">
              <Avatar alt={user?.name || 'Admin'} className="h-24 w-24 bg-white">
                <AvatarFallback>
                  <Text className="font-extrabold text-2xl text-primary">
                    {user?.name ? getInitials(user.name) : 'AD'}
                  </Text>
                </AvatarFallback>
              </Avatar>
            </View>
            <Text className="font-extrabold text-xl text-teal-950 dark:text-white">
              {user?.name}
            </Text>
            <Text className="mt-0.5 text-xs text-teal-900 dark:text-teal-100">{user?.email}</Text>

            {/* Admin Badge */}
            <View className="mt-3 overflow-hidden rounded-xl border border-teal-800/20 bg-white/20 px-4 py-2 backdrop-blur-xl">
              <View className="flex-row items-center gap-2">
                <Image
                  source={require('@/assets/images/icon-no-bg1.png')}
                  className="h-6 w-6"
                  resizeMode="contain"
                />
                <Text className="font-bold text-sm text-teal-950 dark:text-white">
                  Administrator
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View className="-mt-4 flex-1 px-4">
        {/* Contact Information Card */}
        <View className="mb-4 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg">
          <View className="border-b border-border bg-muted/30 px-4 py-2.5">
            <Text className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Informasi Kontak
            </Text>
          </View>

          <View className="p-4">
            {/* Email */}
            <View className="mb-3 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Mail size={18} color="#14b8a6" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-[10px] text-muted-foreground">Email Address</Text>
                <Text className="mt-0.5 text-sm text-foreground">{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Admin Actions Card */}
        <View className="mb-4 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg">
          <View className="border-b border-border bg-muted/30 px-4 py-2.5">
            <Text className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Quick Actions
            </Text>
          </View>

          <View className="p-1.5">
            <Pressable
              onPress={() => router.push('/(admin)/approvals')}
              className="mb-1 flex-row items-center gap-3 rounded-xl px-2.5 py-3 active:bg-muted/50">
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: '#14b8a615' }}>
                <Clock size={18} color="#14b8a6" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-sm text-foreground">Review Submissions</Text>
                <Text className="mt-0.5 text-[10px] text-muted-foreground">
                  Manage pending kos approvals
                </Text>
              </View>
              <ChevronLeft
                size={18}
                color="#9CA3AF"
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </Pressable>

            <Pressable
              onPress={() => Alert.alert('Coming Soon', 'Fitur ini akan segera hadir')}
              className="mb-1 flex-row items-center gap-3 rounded-xl px-2.5 py-3 active:bg-muted/50">
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: '#10b98115' }}>
                <CheckCircle size={18} color="#10b981" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-sm text-foreground">Active Listings</Text>
                <Text className="mt-0.5 text-[10px] text-muted-foreground">
                  View all approved kos
                </Text>
              </View>
              <ChevronLeft
                size={18}
                color="#9CA3AF"
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </Pressable>

            <Pressable
              onPress={() => Alert.alert('Coming Soon', 'Fitur ini akan segera hadir')}
              className="flex-row items-center gap-3 rounded-xl px-2.5 py-3 active:bg-muted/50">
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: '#8b5cf615' }}>
                <Activity size={18} color="#8b5cf6" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-sm text-foreground">Platform Analytics</Text>
                <Text className="mt-0.5 text-[10px] text-muted-foreground">
                  View statistics & insights
                </Text>
              </View>
              <ChevronLeft
                size={18}
                color="#9CA3AF"
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </Pressable>
          </View>
        </View>

        {/* Sign Out Button */}
        <Pressable
          onPress={handleSignOut}
          className="mb-6 overflow-hidden rounded-2xl shadow-lg active:opacity-90">
          <LinearGradient
            colors={['#ef4444', '#dc2626', '#b91c1c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row items-center justify-center gap-2.5 px-6 py-3.5">
            <LogOut size={18} color="#fff" strokeWidth={2.5} />
            <Text className="font-bold text-sm text-white">Keluar dari Akun</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
