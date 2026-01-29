import { View, Alert, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getSavedKos } from '@/services/kosService';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/PageHeader';
import { LinearGradient } from 'expo-linear-gradient';
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
  Bookmark,
  Shield,
  Bell,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [savedKosCount, setSavedKosCount] = useState(0);

  // Load saved kos count when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (user) {
        console.log('[Profile] Loading saved kos count...');
        getSavedKos(user.id)
          .then((kos) => {
            console.log('[Profile] Saved kos count:', kos.length);
            setSavedKosCount(kos.length);
          })
          .catch((error) => {
            console.error('[Profile] Error loading saved kos count:', error);
          });
      } else {
        setSavedKosCount(0);
      }
    }, [user])
  );

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
      <Pressable onPress={onPress} className="flex-row items-center gap-3 py-4 active:opacity-70">
        <Icon size={20} color={colorScheme === 'dark' ? '#14b8a6' : 'black'} />
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
        <LinearGradient
          colors={
            colorScheme === 'dark'
              ? ['#0a3d3d', '#0f1a1a', '#000000']
              : ['#e0f2f1', '#b2dfdb', '#80cbc4']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View className="flex-1 items-center justify-center px-8 py-8">
              {/* Decorative Circle Background */}
              <View className="absolute right-[-60] top-20 h-40 w-40 rounded-full bg-primary/5" />
              <View className="absolute left-[-40] top-60 h-28 w-28 rounded-full bg-primary/10" />

              {/* Logo with Glass Effect */}
              <View className="mb-8 overflow-hidden rounded-3xl border border-primary/10 bg-card/50 p-6 backdrop-blur-xl">
                <Image
                  source={require('@/assets/images/Horizontal-nobg.png')}
                  className="h-16 w-40"
                  resizeMode="contain"
                  tintColor={colorScheme === 'dark' ? '#fff' : 'hsl(175 66% 32%)'}
                />
              </View>

              {/* Welcome Message */}
              <Text className="mb-2 text-center font-extrabold text-xl text-foreground">
                Selamat Datang!
              </Text>
              <Text className="mb-10 max-w-[280px] text-center text-sm leading-relaxed text-muted-foreground">
                Login untuk mengakses fitur lengkap dan menyimpan kos favorit Anda
              </Text>

              {/* Benefits Grid */}
              <View className="mb-10 w-full gap-3">
                <View className="flex-row gap-3">
                  {/* Benefit Card 1 */}
                  <View className="flex-1 overflow-hidden rounded-2xl border border-primary/20 bg-card p-4">
                    <View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Bookmark size={20} color="#14b8a6" strokeWidth={2} />
                    </View>
                    <Text className="font-bold text-xs text-foreground">Simpan Favorit</Text>
                    <Text className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      Kelola kos impian Anda
                    </Text>
                  </View>

                  {/* Benefit Card 2 */}
                  <View className="flex-1 overflow-hidden rounded-2xl border border-primary/20 bg-card p-4">
                    <View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Phone size={20} color="#14b8a6" strokeWidth={2} />
                    </View>
                    <Text className="font-bold text-xs text-foreground">Chat Langsung</Text>
                    <Text className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      Hubungi pemilik kos
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3">
                  {/* Benefit Card 3 */}
                  <View className="flex-1 overflow-hidden rounded-2xl border border-primary/20 bg-card p-4">
                    <View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Shield size={20} color="#14b8a6" strokeWidth={2} />
                    </View>
                    <Text className="font-bold text-xs text-foreground">Data Aman</Text>
                    <Text className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      Privasi terjamin
                    </Text>
                  </View>

                  {/* Benefit Card 4 */}
                  <View className="flex-1 overflow-hidden rounded-2xl border border-primary/20 bg-card p-4">
                    <View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Bell size={20} color="#14b8a6" strokeWidth={2} />
                    </View>
                    <Text className="font-bold text-xs text-foreground">Notifikasi</Text>
                    <Text className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                      Update terbaru
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Button with Gradient */}
              <View className="w-full">
                <Pressable
                  onPress={() => router.push('/(auth)/login')}
                  className="overflow-hidden rounded-2xl shadow-lg active:opacity-90">
                  <LinearGradient
                    colors={['#14b8a6', '#0d9488', '#0f766e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="px-8 py-3.5">
                    <Text className="text-center font-bold text-sm text-white">Masuk Sekarang</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  // Logged In State
  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Header with Gradient */}
        <LinearGradient
          colors={['#14b8a6', '#0d9488', '#0a3d3d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="relative overflow-hidden pb-8 pt-12">
          {/* Decorative Elements */}
          <View className="absolute right-[-30] top-10 h-28 w-28 rounded-full bg-white/10" />
          <View className="absolute left-[-20] top-40 h-20 w-20 rounded-full bg-white/5" />

          {/* Profile Avatar & Name */}
          <View className="items-center px-6">
            <View className="mb-3 overflow-hidden rounded-full border-4 border-white/30 shadow-2xl">
              <Avatar alt={user.name || 'User'} className="h-24 w-24 bg-white">
                <AvatarFallback>
                  <Text className="font-extrabold text-2xl text-primary">
                    {user.name ? getInitials(user.name) : 'U'}
                  </Text>
                </AvatarFallback>
              </Avatar>
            </View>
            <Text numberOfLines={1} className="font-extrabold text-xl text-white">
              {user.name}
            </Text>
            <Text className="mt-0.5 text-xs text-white/80">{user.email}</Text>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View className="-mt-5 px-4">
          {/* Quick Stats Cards */}
          <View className="mb-5 flex-row gap-2.5">
            <View className="flex-1 overflow-hidden rounded-2xl border border-border bg-card p-3.5 shadow-sm">
              <View className="mb-1.5 h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Bookmark size={18} color="#14b8a6" strokeWidth={2.5} />
              </View>
              <Text className="font-bold text-xl text-foreground">{savedKosCount}</Text>
              <Text className="text-[10px] text-muted-foreground">Kos Disimpan</Text>
            </View>

            <View className="flex-1 overflow-hidden rounded-2xl border border-border bg-card p-3.5 shadow-sm">
              <View className="mb-1.5 h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <UserCircle size={18} color="#14b8a6" strokeWidth={2.5} />
              </View>
              <Text className="font-bold text-xl text-foreground">Pencari</Text>
              <Text className="text-[10px] text-muted-foreground">Status Akun</Text>
            </View>
          </View>

          {/* Contact Information Card */}
          <View className="mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <View className="border-b border-border bg-muted/30 px-4 py-2.5">
              <Text className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Informasi Kontak
              </Text>
            </View>

            <View className="p-4">
              {/* Email */}
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Mail size={18} color="#14b8a6" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-[10px] text-muted-foreground">
                    Email Address
                  </Text>
                  <Text className="mt-0.5 text-sm text-foreground">{user.email}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Settings Menu */}
          <View className="mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <View className="border-b border-border bg-muted/30 px-4 py-2.5">
              <Text className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Pengaturan Akun
              </Text>
            </View>

            <View className="p-1.5">
              <MenuItemModern
                icon={Edit}
                title="Edit Profil"
                subtitle="Ubah informasi pribadi"
                onPress={() => Alert.alert('Coming Soon', 'Fitur edit profil akan segera hadir')}
                iconColor="#14b8a6"
              />
            </View>
          </View>

          {/* Support Menu */}
          <View className="mb-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <View className="border-b border-border bg-muted/30 px-4 py-2.5">
              <Text className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Bantuan & Informasi
              </Text>
            </View>

            <View className="p-1.5">
              <MenuItemModern
                icon={Info}
                title="Tentang Aplikasi"
                subtitle="MauNgekos v1.0.0"
                onPress={() =>
                  Alert.alert('MauNgekos', 'Versi 1.0.0\n\nAplikasi pencarian kos terbaik')
                }
                iconColor="#8b5cf6"
              />

              <MenuItemModern
                icon={HelpCircle}
                title="Bantuan & Dukungan"
                subtitle="Hubungi customer service"
                onPress={() => Alert.alert('Bantuan', 'Hubungi kami di support@maungekos.com')}
                iconColor="#06b6d4"
                showChevron={false}
              />
            </View>
          </View>

          {/* Sign Out Button */}
          <Pressable
            onPress={handleSignOut}
            disabled={loading}
            className="mb-6 overflow-hidden rounded-2xl shadow-lg active:opacity-90">
            <LinearGradient
              colors={['#ef4444', '#dc2626', '#b91c1c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-row items-center justify-center gap-2.5 px-6 py-3.5">
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <LogOut size={18} color="#fff" strokeWidth={2.5} />
                  <Text numberOfLines={1} className="font-bold text-sm text-white">
                    Keluar dari Akun
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// Modern Menu Item Component
const MenuItemModern = ({
  icon: Icon,
  title,
  subtitle,
  onPress,
  iconColor = '#14b8a6',
  showChevron = true,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
  iconColor?: string;
  showChevron?: boolean;
}) => {
  const { colorScheme } = useColorScheme();

  return (
    <Pressable
      onPress={onPress}
      className="mb-1 flex-row items-center gap-3 rounded-xl px-2.5 py-3 active:bg-muted/50">
      <View
        className="h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${iconColor}15` }}>
        <Icon size={18} color={iconColor} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-sm text-foreground">{title}</Text>
        <Text className="mt-0.5 text-[10px] text-muted-foreground">{subtitle}</Text>
      </View>
      {showChevron && (
        <ChevronRight size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
      )}
    </Pressable>
  );
};
