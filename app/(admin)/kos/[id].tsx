import { useState, useEffect, use } from 'react';
import { View, ScrollView, Image, Dimensions, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
  Users,
  DoorOpen,
  Sparkles,
  TextSearch,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const { colorScheme } = useColorScheme();
  const [kos, setKos] = useState<Kos | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const insets = useSafeAreaInsets();

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
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Image Skeleton */}
          <Skeleton style={{ width, height: 350 }} />

          {/* Content Skeleton */}
          <View className="px-4 pb-6 pt-4">
            {/* Type Badge Skeleton */}
            <Skeleton className="mb-3 h-7 w-20 rounded-xl" />

            {/* Title Skeleton */}
            <Skeleton className="mb-2 h-8 w-3/4 rounded-lg" />

            {/* Address Skeleton */}
            <Skeleton className="mb-1 h-5 w-full rounded-lg" />
            <Skeleton className="mb-4 h-5 w-2/3 rounded-lg" />

            {/* Price Card Skeleton */}
            <Skeleton className="mb-5 h-20 w-full rounded-2xl" />

            {/* Room Stats Skeleton */}
            <View className="mb-5 flex-row gap-3">
              <Skeleton className="h-28 flex-1 rounded-2xl" />
              <Skeleton className="h-28 flex-1 rounded-2xl" />
            </View>

            {/* Description Skeleton */}
            <Skeleton className="mb-2 h-6 w-32 rounded-lg" />
            <Skeleton className="mb-1 h-4 w-full rounded-lg" />
            <Skeleton className="mb-1 h-4 w-full rounded-lg" />
            <Skeleton className="mb-5 h-4 w-3/4 rounded-lg" />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!kos) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background p-4"
        style={{ paddingTop: insets.top + 20 }}>
        <Stack.Screen options={{ title: 'Detail Kos' }} />
        <Home size={48} className="mb-4 text-muted-foreground" />
        <Text className="font-semibold text-lg">Kos tidak ditemukan</Text>
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
          headerShown: false,
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Gallery with Glassmorphism Overlay */}
        <View className="relative">
          {kos.images && kos.images.length > 0 ? (
            <>
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
                    style={{ width, height: 350 }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>

              {/* Gradient Overlay at Bottom */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                className="absolute bottom-0 left-0 right-0 h-32"
              />
            </>
          ) : (
            <View style={{ width, height: 350 }} className="items-center justify-center bg-muted">
              <Home size={64} className="text-muted-foreground" />
              <Text className="mt-2 text-muted-foreground">Tidak ada foto</Text>
            </View>
          )}

          {/* Back Button - Floating */}
          <View className="absolute left-4 top-12">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-black/30 backdrop-blur-xl active:bg-black/40">
              <ChevronLeft size={24} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Image Indicator */}
          {kos.images && kos.images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
              {kos.images.map((_, index) => (
                <View
                  key={index}
                  className={`h-1.5 rounded-full ${
                    index === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </View>
          )}

          {/* Status Badge - Floating */}
          <View className="absolute right-4 top-12">
            <View
              className="overflow-hidden rounded-xl border border-white/20 px-3 py-2 backdrop-blur-xl"
              style={{ backgroundColor: STATUS_CONFIG[kos.status].color + '50' }}>
              <View className="flex-row items-center gap-1.5">
                <StatusIcon size={14} color="#fff" strokeWidth={2.5} />
                <Text className="font-bold text-xs text-white">
                  {STATUS_CONFIG[kos.status].label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View className="px-4 pb-6 pt-4">
          {/* Type Badge */}
          <View className="mb-3 flex-row gap-2">
            <View
              className="overflow-hidden rounded-xl px-3 py-1.5"
              style={{ backgroundColor: KOS_TYPE_COLORS[kos.type] }}>
              <Text className="font-bold text-xs capitalize text-white">{kos.type}</Text>
            </View>
          </View>

          {/* Name & Address */}
          <Text className="mb-2 font-extrabold text-2xl text-foreground">{kos.name}</Text>
          <View className="mb-1 flex-row items-start gap-2">
            <MapPin size={18} color="#14b8a6" strokeWidth={2.5} style={{ marginTop: 2 }} />
            <Text className="flex-1 text-sm leading-relaxed text-muted-foreground">
              {kos.address}
            </Text>
          </View>
          {kos.ownerName && (
            <View className="mb-4 flex-row items-center gap-1.5">
              <Users size={16} color="#9ca3af" strokeWidth={2} />
              <Text className="text-xs text-muted-foreground">Pemilik: {kos.ownerName}</Text>
            </View>
          )}

          {/* Price Card - Elevated */}
          <View className="mb-5 overflow-hidden rounded-2xl border border-primary/20 shadow-lg">
            <LinearGradient
              colors={colorScheme === 'dark' ? ['#14b8a6', '#0d9488'] : ['#ccfbf1', '#99f6e4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-4">
              <View className="flex-row items-center gap-2">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/30">
                  <Text className="text-xl">💰</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-[10px] uppercase tracking-wide text-teal-900 dark:text-teal-100">
                    Harga per Bulan
                  </Text>
                  <Text className="font-extrabold text-xl text-teal-950 dark:text-white">
                    {formatPrice(kos.priceMin)}
                    {kos.priceMin !== kos.priceMax && (
                      <Text className="text-base"> - {formatPrice(kos.priceMax)}</Text>
                    )}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Room Stats - Card Grid */}
          <View className="mb-5 flex-row gap-3">
            <View className="flex-1 overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-md">
              <View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <DoorOpen size={20} color="#a855f7" strokeWidth={2.5} />
              </View>
              <Text className="font-extrabold text-2xl text-foreground">{kos.totalRooms}</Text>
              <Text className="font-medium text-[10px] uppercase tracking-wide text-muted-foreground">
                Total Kamar
              </Text>
            </View>

            <View className="flex-1 overflow-hidden rounded-2xl border border-green-500/20 bg-card p-4 shadow-md">
              <View className="mb-2 h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                <CheckCircle size={20} color="#10b981" strokeWidth={2.5} />
              </View>
              <Text className="font-extrabold text-2xl text-green-600 dark:text-green-400">
                {kos.availableRooms}
              </Text>
              <Text className="font-medium text-[10px] uppercase tracking-wide text-muted-foreground">
                Tersedia
              </Text>
            </View>
          </View>

          {/* Description Section */}
          {kos.description && (
            <View className="mb-5 overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-md">
              <View className="mb-3 flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <TextSearch size={16} color="#14b8a6" strokeWidth={2.5} />
                </View>
                <Text className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                  Deskripsi
                </Text>
              </View>
              <Text className="text-sm leading-relaxed text-muted-foreground">
                {kos.description}
              </Text>
            </View>
          )}

          {/* Facilities Section */}
          <View className="mb-6 overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-md">
            <View className="mb-3 flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles size={16} color="#14b8a6" strokeWidth={2.5} />
              </View>
              <Text className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                Fasilitas
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {kos.facilities.map((facility, index) => (
                <View
                  key={index}
                  className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2">
                  <Text numberOfLines={1} className="font-medium text-xs text-foreground">
                    {facility}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons - Fixed Bottom (only for pending) */}
      {kos.status === 'pending' && (
        <View
          className="border-t border-border/50 bg-background/95 px-4 py-4 backdrop-blur-xl"
          style={{ paddingBottom: insets.bottom + 12 }}>
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleReject}
              disabled={processing}
              className="flex-1 overflow-hidden rounded-2xl shadow-lg active:opacity-90">
              <LinearGradient
                colors={['#ef4444', '#dc2626', '#b91c1c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center justify-center gap-2 py-3.5">
                <X size={20} color="#fff" strokeWidth={2.5} />
                <Text className="font-bold text-sm text-white">Tolak</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleApprove}
              disabled={processing}
              className="flex-1 overflow-hidden rounded-2xl shadow-lg active:opacity-90">
              <LinearGradient
                colors={['#10b981', '#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center justify-center gap-2 py-3.5">
                <Check size={20} color="#fff" strokeWidth={2.5} />
                <Text className="font-bold text-sm text-white">Setujui</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
