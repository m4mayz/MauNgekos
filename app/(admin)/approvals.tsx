import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, Alert, Pressable, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Kos, KosStatus, KosType } from '@/types';
import { getPendingKos, getApprovedKos, updateKosStatus } from '@/services/kosService';
import {
  Home,
  MapPin,
  Check,
  X,
  LogOut,
  User,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  Activity,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KOS_TYPE_COLORS: Record<KosType, string> = {
  putra: '#3B82F6',
  putri: '#EC4899',
  campur: '#10B981',
};

export default function ApprovalsScreen() {
  const { user, signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingList, setPendingList] = useState<Kos[]>([]);
  const [approvedList, setApprovedList] = useState<Kos[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const iconColor = colorScheme === 'dark' ? '#14b8a6' : 'black';
  const mutedColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  const loadData = async (forceRefresh: boolean = false) => {
    try {
      const [pending, approved] = await Promise.all([
        getPendingKos(forceRefresh),
        getApprovedKos(forceRefresh),
      ]);
      setPendingList(pending);
      setApprovedList(approved);
      if (forceRefresh) {
        console.log(
          '[Admin] Force refreshed - pending:',
          pending.length,
          'approved:',
          approved.length
        );
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData(true); // Force refresh to get fresh data from Firebase
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true); // Force refresh from Firebase
  };

  const handleApprove = (kos: Kos) => {
    Alert.alert(
      'Setujui Kos',
      `Apakah Anda yakin ingin menyetujui "${kos.name}"? Kos akan muncul di peta.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setujui',
          onPress: async () => {
            try {
              await updateKosStatus(kos.id, 'approved');
              setPendingList((prev) => prev.filter((k) => k.id !== kos.id));
              setApprovedList((prev) => [{ ...kos, status: 'approved' }, ...prev]);
              Alert.alert('Berhasil', 'Kos berhasil disetujui');
            } catch (error) {
              Alert.alert('Error', 'Gagal menyetujui kos');
            }
          },
        },
      ]
    );
  };

  const handleReject = (kos: Kos) => {
    Alert.alert('Tolak Kos', `Apakah Anda yakin ingin menolak "${kos.name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Tolak',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateKosStatus(kos.id, 'rejected');
            setPendingList((prev) => prev.filter((k) => k.id !== kos.id));
            Alert.alert('Berhasil', 'Kos berhasil ditolak');
          } catch (error) {
            Alert.alert('Error', 'Gagal menolak kos');
          }
        },
      },
    ]);
  };

  const handleRevoke = (kos: Kos) => {
    Alert.alert(
      'Cabut Persetujuan',
      `Apakah Anda yakin ingin mencabut persetujuan "${kos.name}"? Kos akan dihapus dari map.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Cabut',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateKosStatus(kos.id, 'rejected');
              setApprovedList((prev) => prev.filter((k) => k.id !== kos.id));
              Alert.alert('Berhasil', 'Persetujuan kos berhasil dicabut');
            } catch (error) {
              Alert.alert('Error', 'Gagal mencabut persetujuan');
            }
          },
        },
      ]
    );
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

  const renderPendingCard = ({ item: kos }: { item: Kos }) => (
    <Pressable
      className="mb-3 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-card shadow-lg active:opacity-90"
      onPress={() => router.push(`/(admin)/kos/${kos.id}`)}>
      <View className="p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row gap-2">
            <View
              className="overflow-hidden rounded-lg"
              style={{ backgroundColor: KOS_TYPE_COLORS[kos.type] + '20' }}>
              <Badge style={{ backgroundColor: KOS_TYPE_COLORS[kos.type], borderRadius: 8 }}>
                <Text className="font-bold text-xs capitalize text-white">{kos.type}</Text>
              </Badge>
            </View>
            <View className="overflow-hidden rounded-lg bg-primary/10">
              <Badge
                className="flex-row items-center gap-1 border-0 bg-primary"
                style={{ borderRadius: 8 }}>
                <Clock size={12} color="#fff" strokeWidth={2.5} />
                <Text className="font-bold text-xs text-white">Review</Text>
              </Badge>
            </View>
          </View>
        </View>

        <Text className="mb-2 font-extrabold text-lg text-foreground">{kos.name}</Text>
        <View className="mb-1 flex-row items-center gap-1.5">
          <MapPin size={14} color="#14b8a6" strokeWidth={2.5} />
          <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
            {kos.address}
          </Text>
        </View>
        {kos.ownerName && (
          <Text className="mb-3 text-xs text-muted-foreground">👤 {kos.ownerName}</Text>
        )}

        <View className="flex-row items-center justify-between border-t border-border/50 pt-3">
          <View>
            <Text className="mb-0.5 font-medium text-[10px] uppercase tracking-wide text-muted-foreground">
              Harga/Bulan
            </Text>
            <Text className="font-extrabold text-base text-primary dark:text-primary">
              {formatPrice(kos.priceMin)}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleReject(kos);
              }}
              className="h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 active:bg-red-500/20">
              <X size={18} color="#ef4444" strokeWidth={2.5} />
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleApprove(kos);
              }}
              className="h-9 w-9 items-center justify-center rounded-xl bg-green-500/10 active:bg-green-500/20">
              <Check size={18} color="#10b981" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const renderApprovedCard = ({ item: kos }: { item: Kos }) => (
    <Pressable
      className="mb-3 overflow-hidden rounded-2xl border border-green-500/20 bg-card shadow-md active:opacity-90"
      onPress={() => router.push(`/(admin)/kos/${kos.id}`)}>
      <View className="p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row gap-2">
            <View
              className="overflow-hidden rounded-lg"
              style={{ backgroundColor: KOS_TYPE_COLORS[kos.type] + '20' }}>
              <Badge style={{ backgroundColor: KOS_TYPE_COLORS[kos.type], borderRadius: 8 }}>
                <Text className="font-bold text-xs capitalize text-white">{kos.type}</Text>
              </Badge>
            </View>
            <View className="overflow-hidden rounded-lg bg-green-500/10">
              <Badge
                className="flex-row items-center gap-1 border-0 bg-green-500"
                style={{ borderRadius: 8 }}>
                <CheckCircle size={12} color="#fff" strokeWidth={2.5} />
                <Text className="font-bold text-xs text-white">Active</Text>
              </Badge>
            </View>
          </View>

          {/* Revoke Button */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleRevoke(kos);
            }}
            className="h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 active:bg-red-500/20">
            <XCircle size={18} color="#ef4444" strokeWidth={2.5} />
          </Pressable>
        </View>

        <Text className="mb-2 font-extrabold text-lg text-foreground">{kos.name}</Text>
        <View className="mb-3 flex-row items-center gap-1.5">
          <MapPin size={14} color="#10b981" strokeWidth={2.5} />
          <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
            {kos.address}
          </Text>
        </View>

        <View className="flex-row items-center justify-between rounded-xl bg-green-500/5 p-3">
          <View>
            <Text className="mb-0.5 font-medium text-[10px] uppercase tracking-wide text-muted-foreground">
              Harga/Bulan
            </Text>
            <Text className="font-extrabold text-base text-green-600 dark:text-green-400">
              {formatPrice(kos.priceMin)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-medium text-[10px] uppercase tracking-wide text-muted-foreground">
              Ketersediaan
            </Text>
            <Text className="font-bold text-sm text-foreground">
              {kos.availableRooms}/{kos.totalRooms} kamar
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  const renderEmpty = (type: 'pending' | 'approved') => (
    <View className="flex-1 items-center justify-center py-16">
      {type === 'pending' ? (
        <>
          <Clock size={64} color={iconColor} />
          <Text className="mb-2 mt-8 font-semibold text-lg text-foreground">
            Tidak ada kos menunggu
          </Text>
          <Text className="text-center text-muted-foreground">
            Semua pengajuan kos sudah diproses
          </Text>
        </>
      ) : (
        <>
          <Home size={64} color={iconColor} />
          <Text className="mb-2 mt-8 font-semibold text-lg text-foreground">
            Belum ada kos disetujui
          </Text>
          <Text className="text-center text-muted-foreground">
            Kos yang disetujui akan muncul di sini
          </Text>
        </>
      )}
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
      {/* Hero Header with Gradient */}
      <LinearGradient
        colors={
          colorScheme === 'dark'
            ? ['#0d9488', '#0f766e', '#115e59']
            : ['#99f6e4', '#5eead4', '#2dd4bf']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="relative overflow-hidden pb-6 pt-12"
        style={{ paddingTop: insets.top + 20 }}>
        {/* Decorative Elements */}
        <View className="absolute right-[-30] top-10 h-32 w-32 rounded-full bg-white/10" />
        <View className="absolute left-[-20] top-40 h-24 w-24 rounded-full bg-white/5" />
        <View className="absolute right-20 top-60 h-16 w-16 rounded-full bg-white/10" />

        {/* Header Content */}
        <View className="px-4">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl">
                <Image
                  source={require('@/assets/images/icon-no-bg1.png')}
                  className="h-10 w-10"
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text className="font-medium text-xs text-teal-900 dark:text-teal-100">
                  Admin Dashboard
                </Text>
                <Text className="font-extrabold text-lg text-teal-950 dark:text-white">
                  {user?.name}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => router.push('/(admin)/profile')}
                className="h-10 w-10 items-center justify-center rounded-xl bg-white/20 active:bg-white/30">
                <User
                  size={20}
                  color={colorScheme === 'dark' ? '#fff' : '#0f766e'}
                  strokeWidth={2.5}
                />
              </Pressable>
              <Pressable
                onPress={handleSignOut}
                className="h-10 w-10 items-center justify-center rounded-xl bg-red-500/90 active:bg-red-500">
                <LogOut size={20} color="#fff" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {/* Stats Cards */}
          <View className="flex-row gap-3">
            {/* Pending Stats */}
            <View className="flex-1 overflow-hidden rounded-2xl border border-teal-800/10 bg-white/20 p-3.5 backdrop-blur-xl">
              <View className="mb-1.5 h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Clock size={16} color="#fff" strokeWidth={2.5} />
              </View>
              <Text className="font-extrabold text-2xl text-teal-950 dark:text-white">
                {pendingList.length}
              </Text>
              <Text className="font-medium text-[10px] uppercase tracking-wide text-teal-900 dark:text-teal-100">
                Pending Review
              </Text>
            </View>

            {/* Approved Stats */}
            <View className="flex-1 overflow-hidden rounded-2xl border border-teal-800/10 bg-white/20 p-3.5 backdrop-blur-xl">
              <View className="mb-1.5 h-8 w-8 items-center justify-center rounded-lg bg-green-500">
                <CheckCircle size={16} color="#fff" strokeWidth={2.5} />
              </View>
              <Text className="font-extrabold text-2xl text-teal-950 dark:text-white">
                {approvedList.length}
              </Text>
              <Text className="font-medium text-[10px] uppercase tracking-wide text-teal-900 dark:text-teal-100">
                Active Listings
              </Text>
            </View>

            {/* Total Stats */}
            <View className="flex-1 overflow-hidden rounded-2xl border border-teal-800/10 bg-white/20 p-3.5 backdrop-blur-xl">
              <View className="mb-1.5 h-8 w-8 items-center justify-center rounded-lg bg-purple-500">
                <BarChart3 size={16} color="#fff" strokeWidth={2.5} />
              </View>
              <Text className="font-extrabold text-2xl text-teal-950 dark:text-white">
                {pendingList.length + approvedList.length}
              </Text>
              <Text className="font-medium text-[10px] uppercase tracking-wide text-teal-900 dark:text-teal-100">
                Total Kos
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs Section */}
      <View className="-mt-4 flex-1 px-4">
        {/* Custom Tab Selector */}
        <View className="mb-4 overflow-hidden rounded-2xl border border-border/50 bg-card p-1 shadow-lg">
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setActiveTab('pending')}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl px-3 py-2.5 ${
                activeTab === 'pending' ? 'bg-primary' : ''
              }`}>
              <Clock
                size={14}
                color={activeTab === 'pending' ? '#fff' : '#666'}
                strokeWidth={2.5}
              />
              <Text
                className={`text-sm ${activeTab === 'pending' ? 'font-bold text-white' : 'text-foreground'}`}>
                Review ({pendingList.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('approved')}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl px-3 py-2.5 ${
                activeTab === 'approved' ? 'bg-primary' : ''
              }`}>
              <CheckCircle
                size={14}
                color={activeTab === 'approved' ? '#fff' : '#666'}
                strokeWidth={2.5}
              />
              <Text
                className={`text-sm ${activeTab === 'approved' ? 'font-bold text-white' : 'text-foreground'}`}>
                Active ({approvedList.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === 'pending' ? (
          loading ? (
            renderLoading()
          ) : (
            <FlatList
              data={pendingList}
              keyExtractor={(item) => item.id}
              renderItem={renderPendingCard}
              ListEmptyComponent={renderEmpty('pending')}
              contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            />
          )
        ) : loading ? (
          renderLoading()
        ) : (
          <FlatList
            data={approvedList}
            keyExtractor={(item) => item.id}
            renderItem={renderApprovedCard}
            ListEmptyComponent={renderEmpty('approved')}
            contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          />
        )}
      </View>
    </View>
  );
}
