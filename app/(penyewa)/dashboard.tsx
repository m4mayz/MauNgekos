import { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, Alert, Pressable, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Kos, KosStatus, KosType } from '@/types';
import { getKosByOwner, deleteKos } from '@/services/kosService';
import { Plus, Home, MapPin, Edit, Trash2, LogOut, User, ChevronRight } from 'lucide-react-native';
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
  pending: 'Menunggu',
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
    if (!user?.id) return;
    try {
      const data = await getKosByOwner(user.id);
      setKosList(data);
    } catch (error) {
      console.error('Error loading kos:', error);
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
            router.replace('/(pencari)/home');
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

  const iconColor = colorScheme === 'dark' ? 'white' : 'black';
  const mutedColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  const renderKosCard = ({ item: kos }: { item: Kos }) => (
    <View className="mb-4">
      <Pressable
        onPress={() => router.push(`/(penyewa)/kos/${kos.id}/edit`)}
        className="active:opacity-70">
        <View className="flex-row items-start justify-between py-3">
          <View className="flex-1">
            <View className="mb-2 flex-row gap-2">
              <Badge style={{ backgroundColor: KOS_TYPE_COLORS[kos.type] }}>
                <Text className="text-xs capitalize text-white">{kos.type}</Text>
              </Badge>
              <Badge style={{ backgroundColor: STATUS_COLORS[kos.status] }}>
                <Text className="text-xs text-white">{STATUS_LABELS[kos.status]}</Text>
              </Badge>
            </View>
            <Text className="mb-1 font-bold text-lg">{kos.name}</Text>
            <View className="flex-row items-center gap-1">
              <MapPin size={14} color={mutedColor} />
              <Text className="flex-1 text-sm text-muted-foreground" numberOfLines={1}>
                {kos.address}
              </Text>
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="font-semibold text-primary">
                {formatPrice(kos.priceMin)}
                {kos.priceMin !== kos.priceMax && ` - ${formatPrice(kos.priceMax)}`}
                <Text className="font-normal text-muted-foreground">/bulan</Text>
              </Text>
              <Text className="text-sm text-muted-foreground">
                {kos.availableRooms}/{kos.totalRooms} tersedia
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onPress={() => router.push(`/(penyewa)/kos/${kos.id}/edit`)}>
              <Edit size={18} color={mutedColor} />
            </Button>
            <Button variant="ghost" size="icon" onPress={() => handleDelete(kos)}>
              <Trash2 size={18} color="#EF4444" />
            </Button>
          </View>
        </View>
      </Pressable>
      <Separator />
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-16">
      <Home size={64} color={mutedColor} />
      <Text className="mb-2 mt-4 font-semibold text-lg text-foreground">Belum ada kos</Text>
      <Text className="mb-6 text-center text-muted-foreground">
        Tambahkan kos pertamamu dan mulai{'\n'}promosikan ke pencari kos
      </Text>
      <Button onPress={() => router.push('/(penyewa)/kos/add')}>
        <Plus size={20} color={colorScheme === 'dark' ? 'hsl(0 0% 3.9%)' : '#fff'} />
        <Text className="ml-2 font-semibold text-primary-foreground">Tambah Kos</Text>
      </Button>
    </View>
  );

  const renderLoading = () => (
    <View className="gap-4 p-4">
      {[1, 2, 3].map((i) => (
        <View key={i} className="py-3">
          <Skeleton className="mb-3 h-6 w-24" />
          <Skeleton className="mb-2 h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header */}
      <View className="px-4 pb-4" style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.push('/(penyewa)/profile')}
            className="flex-row items-center gap-3 active:opacity-70">
            <Avatar alt={user?.name || 'User'} className="h-12 w-12">
              <AvatarFallback>
                <Text className="font-bold">{user?.name ? getInitials(user.name) : 'U'}</Text>
              </AvatarFallback>
            </Avatar>
            <View>
              <Text className="text-sm text-muted-foreground">Selamat datang,</Text>
              <Text className="font-semibold">{user?.name}</Text>
            </View>
          </Pressable>
          <View className="flex-row gap-1">
            <Button variant="ghost" size="icon" onPress={handleSignOut} disabled={signingOut}>
              {signingOut ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <LogOut size={22} color="#EF4444" />
              )}
            </Button>
          </View>
        </View>
      </View>

      <Separator />

      {/* Title Section */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="font-bold text-xl">Kos Saya</Text>
        <Text className="text-sm text-muted-foreground">{kosList.length} properti</Text>
      </View>

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
            flexGrow: 1,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}

      {/* FAB */}
      {kosList.length > 0 && (
        <Button
          className="absolute bottom-6 right-6 h-14 w-14 rounded-2xl shadow-lg shadow-black"
          onPress={() => router.push('/(penyewa)/kos/add')}>
          <Plus size={24} color="#fff" />
        </Button>
      )}
    </View>
  );
}
