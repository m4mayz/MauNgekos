import { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, Alert, Pressable, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Kos, KosStatus, KosType } from '@/types';
import { getKosByOwner, deleteKos } from '@/services/kosService';
import {
  Plus,
  Home,
  MapPin,
  Edit,
  Trash2,
  LogOut,
  User,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

const KOS_TYPE_COLORS: Record<KosType, string> = {
  putra: '#3B82F6',
  putri: '#EC4899',
  campur: '#10B981',
};

const STATUS_COLORS: Record<KosStatus, string> = {
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
};

const STATUS_LABELS: Record<KosStatus, string> = {
  pending: 'Menunggu diverifikasi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [kosList, setKosList] = useState<Kos[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const loadKos = async () => {
    if (!user?.id) {
      console.log('[Dashboard] No user ID, skipping load');
      return;
    }

    console.log('[Dashboard] Loading kos for owner:', user.id);
    try {
      const data = await getKosByOwner(user.id);
      console.log('[Dashboard] Loaded kos:', data.length, 'items');
      setKosList(data);
    } catch (error) {
      console.error('[Dashboard] Error loading kos:', error);
      Alert.alert('Error', 'Gagal memuat data kos. Pastikan koneksi internet aktif.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadKos();
    }, [user?.id])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadKos();
  };

  const kosQuota = user?.kos_quota || 1;
  const canAddMore = kosList.length < kosQuota;

  const handleAddKos = () => {
    if (!canAddMore) {
      Alert.alert(
        'Kuota Tercapai',
        `Anda sudah mencapai kuota maksimal (${kosQuota} kos). Upgrade ke Premium untuk menambah lebih banyak kos!`,
        [
          { text: 'Nanti', style: 'cancel' },
          { text: 'Upgrade', onPress: () => console.log('TODO: Navigate to premium page') },
        ]
      );
      return;
    }
    router.push('/(penyewa)/kos/add');
  };

  const handleDelete = (kos: Kos) => {
    Alert.alert('Hapus Kos', `Apakah Anda yakin ingin menghapus "${kos.name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteKos(kos.id);
            setKosList((prev) => prev.filter((k) => k.id !== kos.id));
          } catch (error) {
            Alert.alert('Error', 'Gagal menghapus kos');
          }
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
            router.replace('/(pencari)/(tabs)/home');
          } catch (error) {
            Alert.alert('Error', 'Gagal keluar');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const iconColor = colorScheme === 'dark' ? '#14b8a6' : 'black';
  const mutedColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  const stats = {
    pending: kosList.filter((k) => k.status === 'pending').length,
    approved: kosList.filter((k) => k.status === 'approved').length,
    total: kosList.length,
  };

  const renderKosCard = ({ item: kos }: { item: Kos }) => (
    <View className="mb-3 overflow-hidden rounded-2xl border border-border bg-card">
      <Pressable
        onPress={() => router.push(`/(penyewa)/kos/${kos.id}/edit`)}
        className="active:opacity-70">
        <View className="p-4">
          {/* Header with badges */}
          <View className="mb-3 flex-row items-start justify-between">
            <View className="flex-1 flex-row gap-2">
              <Badge
                style={{
                  backgroundColor:
                    colorScheme === 'dark' ? KOS_TYPE_COLORS[kos.type] + '20' : undefined,
                  borderColor: KOS_TYPE_COLORS[kos.type],
                  borderWidth: 1,
                }}>
                <Text
                  className="font-semibold text-xs capitalize"
                  style={{ color: KOS_TYPE_COLORS[kos.type] }}>
                  {kos.type}
                </Text>
              </Badge>
              <Badge
                style={{
                  backgroundColor:
                    colorScheme === 'dark' ? STATUS_COLORS[kos.status] + '20' : undefined,
                  borderColor: STATUS_COLORS[kos.status],
                  borderWidth: 1,
                }}>
                <Text
                  className="font-semibold text-xs"
                  style={{ color: STATUS_COLORS[kos.status] }}>
                  {STATUS_LABELS[kos.status]}
                </Text>
              </Badge>
            </View>
            <View className="flex-row gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onPress={() => router.push(`/(penyewa)/kos/${kos.id}/edit`)}>
                <Edit size={16} color={iconColor} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onPress={() => handleDelete(kos)}>
                <Trash2 size={16} color="#EF4444" />
              </Button>
            </View>
          </View>

          {/* Title and Address */}
          <Text className="mb-2 font-bold text-lg">{kos.name}</Text>
          <View className="mb-3 flex-row items-center gap-1">
            <MapPin size={14} color={mutedColor} />
            <Text className="flex-1 text-sm text-muted-foreground" numberOfLines={1}>
              {kos.address}
            </Text>
          </View>

          <Separator className="mb-3" />

          {/* Price and Availability */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="mb-1 text-xs text-muted-foreground">Harga</Text>
              <Text className="font-bold text-primary">
                {formatPrice(kos.priceMin)}
                {kos.priceMin !== kos.priceMax && (
                  <Text className="text-sm"> - {formatPrice(kos.priceMax)}</Text>
                )}
              </Text>
            </View>
            <View className="items-end">
              <Text className="mb-1 text-xs text-muted-foreground">Ketersediaan</Text>
              <Text className="font-semibold">
                {kos.availableRooms}/{kos.totalRooms}
                <Text className="text-sm text-muted-foreground"> kamar</Text>
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-6 py-16">
      <Building2 size={64} color={mutedColor} />
      <Text className="mb-2 mt-4 font-bold text-xl text-foreground">Belum ada kos</Text>
      <Text className="mb-6 text-center text-muted-foreground">
        Tambahkan kos pertamamu dan mulai{'\n'}promosikan ke pencari kos
      </Text>
      <Button onPress={handleAddKos} size="lg">
        <Plus size={20} color={colorScheme === 'dark' ? 'hsl(0 0% 3.9%)' : '#fff'} />
        <Text className="ml-2 font-semibold text-primary-foreground">Tambah Kos</Text>
      </Button>
    </View>
  );

  const renderLoading = () => (
    <View className="gap-4 p-4">
      {[1, 2, 3].map((i) => (
        <View key={i} className="rounded-2xl border border-border p-4">
          <Skeleton className="mb-3 h-5 w-32" />
          <Skeleton className="mb-2 h-6 w-3/4" />
          <Skeleton className="mb-3 h-4 w-1/2" />
          <View className="flex-row justify-between">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Gradient Hero Header */}
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['#0d9488', '#0f766e', '#115e59']
            : ['#99f6e4', '#5eead4', '#2dd4bf']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 16 }}>
        {/* Header with Profile and Logout */}
        <View className="mb-4 flex-row items-center justify-between px-4">
          <Pressable
            onPress={() => router.push('/(penyewa)/profile')}
            className="flex-row items-center gap-3 active:opacity-70">
            <Avatar alt={user?.name || 'User'} className="h-12 w-12 border-2 border-white">
              <AvatarFallback>
                <Text className="font-bold text-primary">
                  {user?.name ? getInitials(user.name) : 'U'}
                </Text>
              </AvatarFallback>
            </Avatar>
            <View>
              <Text
                className={
                  colorScheme === 'dark' ? 'text-sm text-teal-200' : 'text-sm text-teal-700'
                }>
                Pemilik Kos
              </Text>
              <Text
                className={
                  colorScheme === 'dark' ? 'font-bold text-white' : 'font-bold text-teal-900'
                }>
                {user?.name}
              </Text>
            </View>
          </Pressable>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 bg-red-500/90"
            onPress={handleSignOut}
            disabled={signingOut}>
            {signingOut ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <LogOut size={20} color="#fff" />
            )}
          </Button>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-3 px-4 pb-4">
          <View className="flex-1 rounded-xl bg-white/90 p-3 dark:bg-white/10">
            <Clock size={20} color={colorScheme === 'dark' ? '#fbbf24' : '#f59e0b'} />
            <Text
              className="mb-1 mt-2 font-extrabold text-2xl"
              style={{ color: colorScheme === 'dark' ? '#fbbf24' : '#f59e0b' }}>
              {stats.pending}
            </Text>
            <Text
              className={
                colorScheme === 'dark' ? 'text-xs text-white/70' : 'text-xs text-teal-700'
              }>
              Menunggu
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-white/90 p-3 dark:bg-white/10">
            <CheckCircle size={20} color={colorScheme === 'dark' ? '#34d399' : '#10b981'} />
            <Text
              className="mb-1 mt-2 font-extrabold text-2xl"
              style={{ color: colorScheme === 'dark' ? '#34d399' : '#10b981' }}>
              {stats.approved}
            </Text>
            <Text
              className={
                colorScheme === 'dark' ? 'text-xs text-white/70' : 'text-xs text-teal-700'
              }>
              Aktif
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-white/90 p-3 dark:bg-white/10">
            <Building2 size={20} color={colorScheme === 'dark' ? '#14b8a6' : '#0d9488'} />
            <Text
              className="mb-1 mt-2 font-extrabold text-2xl"
              style={{ color: colorScheme === 'dark' ? '#14b8a6' : '#0d9488' }}>
              {stats.total}
            </Text>
            <Text
              className={
                colorScheme === 'dark' ? 'text-xs text-white/70' : 'text-xs text-teal-700'
              }>
              Total
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quota Banner */}
      <View className="mx-4 mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-semibold text-sm">Kuota Kos</Text>
            <Text className="text-xs text-muted-foreground">
              {kosList.length} dari {kosQuota} kos terpakai
            </Text>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Text className="font-bold text-primary">{kosQuota - kosList.length}</Text>
          </View>
        </View>
      </View>

      {/* Title Section */}
      <View className="mt-4 flex-row items-center justify-between px-4">
        <Text className="font-bold text-xl">Kos Saya</Text>
        {!loading && kosList.length > 0 && (
          <Button onPress={handleAddKos} variant="ghost" size="sm" disabled={!canAddMore}>
            <Plus size={16} color={canAddMore ? iconColor : mutedColor} />
            <Text className={canAddMore ? 'ml-1 text-sm' : 'ml-1 text-sm text-muted-foreground'}>
              Tambah
            </Text>
          </Button>
        )}
      </View>

      <Separator className="my-3" />

      {loading ? (
        renderLoading()
      ) : (
        <FlatList
          data={kosList}
          keyExtractor={(item) => item.id}
          renderItem={renderKosCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            flexGrow: 1,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}
    </View>
  );
}
