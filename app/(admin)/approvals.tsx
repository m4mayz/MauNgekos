import { useState, useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, Alert, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Kos, KosStatus, KosType } from '@/types';
import { getPendingKos, getApprovedKos, updateKosStatus } from '@/services/kosService';
import { Home, MapPin, Check, X, LogOut, User, Clock, CheckCircle } from 'lucide-react-native';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const KOS_TYPE_COLORS: Record<KosType, string> = {
  putra: '#3B82F6',
  putri: '#EC4899',
  campur: '#10B981',
};

export default function ApprovalsScreen() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingList, setPendingList] = useState<Kos[]>([]);
  const [approvedList, setApprovedList] = useState<Kos[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [pending, approved] = await Promise.all([getPendingKos(), getApprovedKos()]);
      setPendingList(pending);
      setApprovedList(approved);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
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
      className="mb-4 rounded-xl bg-card p-4 shadow-sm"
      onPress={() => router.push(`/(admin)/kos/${kos.id}`)}>
      <View className="mb-3 flex-row gap-2">
        <Badge style={{ backgroundColor: KOS_TYPE_COLORS[kos.type] }}>
          <Text className="text-xs capitalize text-white">{kos.type}</Text>
        </Badge>
        <Badge variant="outline" className="border-yellow-500">
          <Clock size={12} className="mr-1 text-yellow-500" />
          <Text className="text-xs text-yellow-500">Menunggu</Text>
        </Badge>
      </View>

      <Text className="mb-1 text-lg font-bold">{kos.name}</Text>
      <View className="mb-1 flex-row items-center gap-1">
        <MapPin size={14} className="text-muted-foreground" />
        <Text className="flex-1 text-sm text-muted-foreground" numberOfLines={1}>
          {kos.address}
        </Text>
      </View>
      {kos.ownerName && (
        <Text className="mb-2 text-sm text-muted-foreground">Oleh: {kos.ownerName}</Text>
      )}

      <View className="flex-row items-center justify-between border-t border-border pt-3">
        <Text className="font-semibold text-primary">
          {formatPrice(kos.priceMin)}
          {kos.priceMin !== kos.priceMax && ` - ${formatPrice(kos.priceMax)}`}
        </Text>
        <View className="flex-row gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="flex-row gap-1"
            onPress={() => handleReject(kos)}>
            <X size={16} className="text-destructive-foreground" />
            <Text className="text-destructive-foreground">Tolak</Text>
          </Button>
          <Button size="sm" className="flex-row gap-1" onPress={() => handleApprove(kos)}>
            <Check size={16} className="text-primary-foreground" />
            <Text className="text-primary-foreground">Setujui</Text>
          </Button>
        </View>
      </View>
    </Pressable>
  );

  const renderApprovedCard = ({ item: kos }: { item: Kos }) => (
    <Pressable
      className="mb-4 rounded-xl bg-card p-4 shadow-sm"
      onPress={() => router.push(`/(admin)/kos/${kos.id}`)}>
      <View className="mb-3 flex-row gap-2">
        <Badge style={{ backgroundColor: KOS_TYPE_COLORS[kos.type] }}>
          <Text className="text-xs capitalize text-white">{kos.type}</Text>
        </Badge>
        <Badge variant="outline" className="border-green-500">
          <CheckCircle size={12} className="mr-1 text-green-500" />
          <Text className="text-xs text-green-500">Disetujui</Text>
        </Badge>
      </View>

      <Text className="mb-1 text-lg font-bold">{kos.name}</Text>
      <View className="mb-2 flex-row items-center gap-1">
        <MapPin size={14} className="text-muted-foreground" />
        <Text className="flex-1 text-sm text-muted-foreground" numberOfLines={1}>
          {kos.address}
        </Text>
      </View>

      <View className="flex-row items-center justify-between border-t border-border pt-2">
        <Text className="font-semibold text-primary">{formatPrice(kos.priceMin)}</Text>
        <Text className="text-sm text-muted-foreground">
          {kos.availableRooms}/{kos.totalRooms} tersedia
        </Text>
      </View>
    </Pressable>
  );

  const renderEmpty = (type: 'pending' | 'approved') => (
    <View className="flex-1 items-center justify-center py-16">
      {type === 'pending' ? (
        <>
          <Clock size={64} className="mb-4 text-muted-foreground" />
          <Text className="mb-2 text-lg font-semibold text-foreground">Tidak ada kos menunggu</Text>
          <Text className="text-center text-muted-foreground">
            Semua pengajuan kos sudah diproses
          </Text>
        </>
      ) : (
        <>
          <Home size={64} className="mb-4 text-muted-foreground" />
          <Text className="mb-2 text-lg font-semibold text-foreground">
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
      {/* Header Actions */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <View>
          <Text className="text-sm text-muted-foreground">Admin</Text>
          <Text className="font-semibold">{user?.name}</Text>
        </View>
        <View className="flex-row gap-2">
          <Button variant="ghost" size="icon" onPress={() => router.push('/(admin)/profile')}>
            <User size={22} className="text-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onPress={handleSignOut}>
            <LogOut size={22} className="text-destructive" />
          </Button>
        </View>
      </View>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="pending" className="flex-1">
            <Text>Menunggu ({pendingList.length})</Text>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex-1">
            <Text>Disetujui ({approvedList.length})</Text>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="flex-1">
          {loading ? (
            renderLoading()
          ) : (
            <FlatList
              data={pendingList}
              keyExtractor={(item) => item.id}
              renderItem={renderPendingCard}
              ListEmptyComponent={renderEmpty('pending')}
              contentContainerStyle={{ padding: 16, flexGrow: 1 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            />
          )}
        </TabsContent>

        <TabsContent value="approved" className="flex-1">
          {loading ? (
            renderLoading()
          ) : (
            <FlatList
              data={approvedList}
              keyExtractor={(item) => item.id}
              renderItem={renderApprovedCard}
              ListEmptyComponent={renderEmpty('approved')}
              contentContainerStyle={{ padding: 16, flexGrow: 1 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            />
          )}
        </TabsContent>
      </Tabs>
    </View>
  );
}
