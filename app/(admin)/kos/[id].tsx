import { useState, useEffect } from 'react';
import { View, ScrollView, Image, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Kos, KosType, KosStatus } from '@/types';
import { getKosById, updateKosStatus } from '@/services/kosService';
import {
  MapPin,
  ChevronLeft,
  Home,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const KOS_TYPE_COLORS: Record<KosType, string> = {
  putra: '#3B82F6',
  putri: '#EC4899',
  campur: '#10B981',
};

const STATUS_CONFIG: Record<KosStatus, { color: string; label: string; icon: typeof Clock }> = {
  pending: { color: '#F59E0B', label: 'Menunggu', icon: Clock },
  approved: { color: '#10B981', label: 'Disetujui', icon: CheckCircle },
  rejected: { color: '#EF4444', label: 'Ditolak', icon: XCircle },
};

export default function AdminKosDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [kos, setKos] = useState<Kos | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadKos();
    }
  }, [id]);

  const loadKos = async () => {
    setLoading(true);
    try {
      const data = await getKosById(id!);
      setKos(data);
    } catch (error) {
      console.error('Error loading kos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (!kos) return;
    Alert.alert('Setujui Kos', `Apakah Anda yakin ingin menyetujui "${kos.name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Setujui',
        onPress: async () => {
          setProcessing(true);
          try {
            await updateKosStatus(kos.id, 'approved');
            setKos({ ...kos, status: 'approved' });
            Alert.alert('Berhasil', 'Kos berhasil disetujui');
          } catch (error) {
            Alert.alert('Error', 'Gagal menyetujui kos');
          } finally {
            setProcessing(false);
          }
        },
      },
    ]);
  };

  const handleReject = () => {
    if (!kos) return;
    Alert.alert('Tolak Kos', `Apakah Anda yakin ingin menolak "${kos.name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Tolak',
        style: 'destructive',
        onPress: async () => {
          setProcessing(true);
          try {
            await updateKosStatus(kos.id, 'rejected');
            setKos({ ...kos, status: 'rejected' });
            Alert.alert('Berhasil', 'Kos berhasil ditolak');
          } catch (error) {
            Alert.alert('Error', 'Gagal menolak kos');
          } finally {
            setProcessing(false);
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

  if (loading) {
    return (
      <View className="flex-1 bg-background p-4">
        <Stack.Screen
          options={{
            title: 'Detail Kos',
            headerLeft: () => (
              <Button variant="ghost" size="icon" onPress={() => router.back()}>
                <ChevronLeft size={24} className="text-foreground" />
              </Button>
            ),
          }}
        />
        <Skeleton className="mb-4 h-64 w-full rounded-xl" />
        <Skeleton className="mb-2 h-8 w-3/4" />
        <Skeleton className="mb-4 h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </View>
    );
  }

  if (!kos) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-4">
        <Stack.Screen options={{ title: 'Detail Kos' }} />
        <Home size={48} className="mb-4 text-muted-foreground" />
        <Text className="text-lg font-semibold">Kos tidak ditemukan</Text>
        <Button variant="outline" className="mt-4" onPress={() => router.back()}>
          <Text>Kembali</Text>
        </Button>
      </View>
    );
  }

  const StatusIcon = STATUS_CONFIG[kos.status].icon;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerLeft: () => (
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full"
              onPress={() => router.back()}>
              <ChevronLeft size={24} className="text-foreground" />
            </Button>
          ),
        }}
      />

      <ScrollView className="flex-1">
        {/* Image Gallery */}
        <View className="relative">
          {kos.images && kos.images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}>
              {kos.images.map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={{ width, height: 300 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={{ width, height: 300 }} className="items-center justify-center bg-muted">
              <Home size={64} className="text-muted-foreground" />
              <Text className="mt-2 text-muted-foreground">Tidak ada foto</Text>
            </View>
          )}

          {kos.images && kos.images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
              {kos.images.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View className="p-4">
          {/* Status & Type */}
          <View className="mb-3 flex-row gap-2">
            <Badge style={{ backgroundColor: KOS_TYPE_COLORS[kos.type] }}>
              <Text className="capitalize text-white">{kos.type}</Text>
            </Badge>
            <Badge style={{ backgroundColor: STATUS_CONFIG[kos.status].color }}>
              <StatusIcon size={14} color="#fff" className="mr-1" />
              <Text className="text-white">{STATUS_CONFIG[kos.status].label}</Text>
            </Badge>
          </View>

          {/* Name & Address */}
          <Text className="mb-1 text-2xl font-bold text-foreground">{kos.name}</Text>
          <View className="mb-2 flex-row items-center gap-1">
            <MapPin size={16} className="text-muted-foreground" />
            <Text className="flex-1 text-muted-foreground">{kos.address}</Text>
          </View>
          {kos.ownerName && (
            <Text className="mb-4 text-muted-foreground">Pemilik: {kos.ownerName}</Text>
          )}

          {/* Price */}
          <View className="mb-4 rounded-xl bg-primary/5 p-4">
            <Text className="mb-1 text-sm text-muted-foreground">Harga per bulan</Text>
            <Text className="text-2xl font-bold text-primary">
              {formatPrice(kos.priceMin)}
              {kos.priceMin !== kos.priceMax && <Text> - {formatPrice(kos.priceMax)}</Text>}
            </Text>
          </View>

          <Separator className="my-4" />

          {/* Room Info */}
          <Text className="mb-3 text-lg font-semibold">Informasi Kamar</Text>
          <View className="mb-4 flex-row gap-4">
            <View className="flex-1 rounded-xl bg-card p-4">
              <Text className="text-center text-2xl font-bold">{kos.totalRooms}</Text>
              <Text className="text-center text-sm text-muted-foreground">Total Kamar</Text>
            </View>
            <View className="flex-1 rounded-xl bg-card p-4">
              <Text className="text-center text-2xl font-bold text-green-500">
                {kos.availableRooms}
              </Text>
              <Text className="text-center text-sm text-muted-foreground">Tersedia</Text>
            </View>
          </View>

          <Separator className="my-4" />

          {/* Description */}
          {kos.description && (
            <>
              <Text className="mb-2 text-lg font-semibold">Deskripsi</Text>
              <Text className="mb-4 text-muted-foreground">{kos.description}</Text>
              <Separator className="my-4" />
            </>
          )}

          {/* Facilities */}
          <Text className="mb-3 text-lg font-semibold">Fasilitas</Text>
          <View className="mb-8 flex-row flex-wrap gap-2">
            {kos.facilities.map((facility, index) => (
              <View key={index} className="rounded-lg bg-card px-3 py-2">
                <Text className="text-sm">{facility}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons (only for pending) */}
      {kos.status === 'pending' && (
        <View className="border-t border-border bg-background p-4">
          <View className="flex-row gap-3">
            <Button
              variant="destructive"
              className="flex-1 flex-row gap-2"
              onPress={handleReject}
              disabled={processing}>
              <X size={20} className="text-destructive-foreground" />
              <Text className="font-semibold text-destructive-foreground">Tolak</Text>
            </Button>
            <Button className="flex-1 flex-row gap-2" onPress={handleApprove} disabled={processing}>
              <Check size={20} className="text-primary-foreground" />
              <Text className="font-semibold text-primary-foreground">Setujui</Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
