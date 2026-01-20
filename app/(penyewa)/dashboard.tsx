import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, Alert, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Kos, KosStatus, KosType } from '@/types';
import { getKosByOwner, deleteKos } from '@/services/kosService';
import { Plus, Home, MapPin, Edit, Trash2, LogOut, User } from 'lucide-react-native';

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
  const [kosList, setKosList] = useState<Kos[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
          await signOut();
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

  const renderKosCard = ({ item: kos }: { item: Kos }) => (
    <View className="mb-4 rounded-xl bg-card p-4 shadow-sm">
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-row gap-2">
          <Badge style={{ backgroundColor: KOS_TYPE_COLORS[kos.type] }}>
            <Text className="text-xs capitalize text-white">{kos.type}</Text>
          </Badge>
          <Badge style={{ backgroundColor: STATUS_COLORS[kos.status] }}>
            <Text className="text-xs text-white">{STATUS_LABELS[kos.status]}</Text>
          </Badge>
        </View>
        <View className="flex-row gap-1">
          <Button
            variant="ghost"
            size="icon"
            onPress={() => router.push(`/(penyewa)/kos/${kos.id}/edit`)}>
            <Edit size={18} className="text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onPress={() => handleDelete(kos)}>
            <Trash2 size={18} className="text-destructive" />
          </Button>
        </View>
      </View>

      <Text className="mb-1 text-lg font-bold">{kos.name}</Text>
      <View className="mb-2 flex-row items-center gap-1">
        <MapPin size={14} className="text-muted-foreground" />
        <Text className="flex-1 text-sm text-muted-foreground" numberOfLines={1}>
          {kos.address}
        </Text>
      </View>

      <View className="flex-row items-center justify-between border-t border-border pt-2">
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
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-16">
      <Home size={64} className="mb-4 text-muted-foreground" />
      <Text className="mb-2 text-lg font-semibold text-foreground">Belum ada kos</Text>
      <Text className="mb-6 text-center text-muted-foreground">
        Tambahkan kos pertamamu dan mulai{'\n'}promosikan ke pencari kos
      </Text>
      <Button onPress={() => router.push('/(penyewa)/kos/add')}>
        <Plus size={20} className="mr-2 text-primary-foreground" />
        <Text className="font-semibold text-primary-foreground">Tambah Kos</Text>
      </Button>
    </View>
  );

  const renderLoading = () => (
    <View className="gap-4 p-4">
      {[1, 2, 3].map((i) => (
        <View key={i} className="rounded-xl bg-card p-4">
          <Skeleton className="mb-3 h-6 w-20" />
          <Skeleton className="mb-2 h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header Actions */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <View>
          <Text className="text-sm text-muted-foreground">Selamat datang,</Text>
          <Text className="font-semibold">{user?.name}</Text>
        </View>
        <View className="flex-row gap-2">
          <Button variant="ghost" size="icon" onPress={() => router.push('/(penyewa)/profile')}>
            <User size={22} className="text-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onPress={handleSignOut}>
            <LogOut size={22} className="text-destructive" />
          </Button>
        </View>
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
            padding: 16,
            flexGrow: 1,
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      )}

      {/* FAB */}
      {kosList.length > 0 && (
        <Button
          className="absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          onPress={() => router.push('/(penyewa)/kos/add')}>
          <Plus size={24} className="text-primary-foreground" />
        </Button>
      )}
    </View>
  );
}
