import {
  View,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  useSharedValue,
} from 'react-native-reanimated';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getSavedKos, unsaveKos } from '@/services/kosService';
import { Kos, KosType } from '@/types';
import { router, useFocusEffect } from 'expo-router';
import {
  Bookmark,
  MapPin,
  Home,
  Search,
  ArrowUpDown,
  Heart,
  ArrowDown,
  ArrowUp,
  Type,
} from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import IcBaselineBookmarkIcon from '@/components/icons/ic/baseline-bookmark';
import MaterialSymbolsLocationOnIcon from '@/components/icons/material-symbols/location-on';

const KOS_TYPE_COLORS: Record<KosType, string> = {
  putra: '#3B82F6',
  putri: '#EC4899',
  campur: '#10B981',
};

const KOS_TYPE_LABELS: Record<KosType, string> = {
  putra: 'Putra',
  putri: 'Putri',
  campur: 'Campur',
};

export default function FavoritesScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [savedKos, setSavedKos] = useState<Kos[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'name'>('price-low');
  const colorScheme = useColorScheme();
  const [containerWidth, setContainerWidth] = useState(0);

  // Animated sliding indicator
  const indicatorPosition = useSharedValue(0);

  useEffect(() => {
    const index = sortBy === 'price-low' ? 0 : sortBy === 'price-high' ? 1 : 2;
    if (containerWidth > 0) {
      const tabWidth = (containerWidth - 8) / 3; // 8px = 2 * 4px padding (p-1)
      indicatorPosition.value = withTiming(index * tabWidth, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [sortBy, containerWidth]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: indicatorPosition.value,
        },
      ],
    };
  });

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      // Force refresh from Firebase, bypassing cache
      const kos = await getSavedKos(user.id, true);
      console.log('[Favorites] Force refreshed saved kos count:', kos.length);
      setSavedKos(kos);
    } catch (error) {
      console.error('[Favorites] Error refreshing saved kos:', error);
      Alert.alert('Error', 'Gagal memuat kos favorit');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUnsave = async (kosId: string, event: any) => {
    event?.stopPropagation?.();
    if (!user) return;

    console.log('[Favorites] Unsaving kos:', kosId);

    // Optimistic update - remove from UI instantly
    const previousKos = savedKos;
    setSavedKos((prev) => prev.filter((kos) => kos.id !== kosId));

    try {
      await unsaveKos(user.id, kosId);
      console.log('[Favorites] Kos unsaved successfully');
    } catch (error) {
      console.error('[Favorites] Error unsaving kos:', error);
      // Rollback on error
      setSavedKos(previousKos);
      Alert.alert('Error', 'Gagal menghapus kos dari favorit');
    }
  };

  // Reload when screen comes into focus - always force refresh to ensure latest data
  useFocusEffect(
    useCallback(() => {
      if (!user) {
        console.log('[Favorites] No user logged in');
        setLoading(false);
        return;
      }

      console.log('[Favorites] 🔄 Screen focused, force refreshing saved kos for user:', user.id);
      setLoading(true);

      // Force refresh to ensure we have latest data after save/unsave
      getSavedKos(user.id, true)
        .then((kos) => {
          console.log('[Favorites] ✅ Successfully loaded', kos.length, 'saved kos');
          console.log(
            '[Favorites] 📋 Kos details:',
            kos.map((k) => ({ id: k.id, name: k.name, status: k.status }))
          );
          setSavedKos(kos);
        })
        .catch((error) => {
          console.error('[Favorites] ❌ Error loading saved kos:', error);
          Alert.alert('Error', 'Gagal memuat kos favorit');
        })
        .finally(() => {
          console.log('[Favorites] ⏹️ Loading finished');
          setLoading(false);
        });
    }, [user])
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const toggleSort = (sortType: 'price-low' | 'price-high' | 'name') => {
    setSortBy(sortType);
  };

  const getSortLabel = () => {
    if (sortBy === 'price-low') return 'Harga Terendah';
    if (sortBy === 'price-high') return 'Harga Tertinggi';
    return 'Nama A-Z';
  };

  const sortedKos = [...savedKos].sort((a, b) => {
    if (sortBy === 'price-low') return a.priceMin - b.priceMin;
    if (sortBy === 'price-high') return b.priceMin - a.priceMin;
    return a.name.localeCompare(b.name);
  });

  const iconColor = colorScheme === 'dark' ? '#14b8a6' : 'black';
  const mutedColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  // Guest user - show login prompt
  if (!user) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader icon={IcBaselineBookmarkIcon} title="Kos Disimpan" insets={insets} />

        {/* Empty State */}
        <View className="flex-1 items-center justify-center px-6 py-10">
          <View className="mb-6 items-center justify-center rounded-full bg-primary/10 p-6">
            <Bookmark size={48} color={iconColor} strokeWidth={1.5} />
          </View>
          <Text className="mb-2 font-bold text-lg text-foreground">Belum ada kos favorit</Text>
          <Text className="mb-6 max-w-[260px] text-center text-sm leading-relaxed text-muted-foreground">
            Masuk untuk menyimpan kos impianmu agar mudah ditemukan kembali
          </Text>
          <Button
            onPress={() => router.push('/(auth)/login')}
            className="rounded-lg bg-primary px-6 py-2.5">
            <Text className="font-semibold text-sm text-white">Masuk Sekarang</Text>
          </Button>
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader icon={IcBaselineBookmarkIcon} title="Kos Disimpan" insets={insets} />

        {/* Loading */}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#14b8a6" />
        </View>
      </View>
    );
  }

  // Empty state - logged in but no saved kos
  if (savedKos.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader icon={IcBaselineBookmarkIcon} title="Kos Disimpan" insets={insets} />

        {/* Empty State */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#14b8a6']}
            />
          }>
          <View className="flex-1 items-center justify-center px-6 py-10">
            <View className="mb-6 items-center justify-center rounded-full bg-primary/10 p-6">
              <Search size={48} color={iconColor} strokeWidth={1.5} />
            </View>
            <Text numberOfLines={1} className="mb-2 font-bold text-lg text-foreground">
              Belum ada kos favorit
            </Text>
            <Text className="mb-6 max-w-[260px] text-center text-sm leading-relaxed text-muted-foreground">
              Simpan kos impianmu di sini agar mudah ditemukan kembali saat kamu butuh
            </Text>
            <Button
              onPress={() => router.push('/(pencari)/(tabs)/home')}
              className="rounded-lg bg-primary px-6 py-2.5">
              <Text className="font-semibold text-sm text-white">Cari Kos Sekarang</Text>
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Has saved kos - show list
  return (
    <View className="flex-1 bg-background">
      <PageHeader icon={IcBaselineBookmarkIcon} title="Kos Disimpan" insets={insets} />

      {/* Sort Tabs */}
      <View className="bg-card/95 px-4 py-3">
        <View
          className="relative flex-row items-center rounded-xl bg-muted p-1"
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
          {/* Sliding Background Indicator */}
          {containerWidth > 0 && (
            <Animated.View
              style={[
                indicatorStyle,
                {
                  width: (containerWidth - 8) / 3,
                },
              ]}
              className="absolute bottom-1 left-1 top-1 rounded-lg bg-card shadow-sm"
            />
          )}

          {/* Tab Buttons */}
          <Pressable
            onPress={() => toggleSort('price-low')}
            className="z-10 flex-1 flex-col items-center gap-0.5 px-1 py-2">
            <ArrowDown
              size={16}
              color={sortBy === 'price-low' ? '#14b8a6' : mutedColor}
              strokeWidth={2.5}
            />
            <Text
              className={`text-center text-[11px] ${
                sortBy === 'price-low'
                  ? 'font-bold text-primary'
                  : 'font-bold text-muted-foreground'
              }`}>
              Harga Terendah
            </Text>
          </Pressable>

          <Pressable
            onPress={() => toggleSort('price-high')}
            className="z-10 flex-1 flex-col items-center gap-0.5 px-1 py-2">
            <ArrowUp
              size={16}
              color={sortBy === 'price-high' ? '#14b8a6' : mutedColor}
              strokeWidth={2.5}
            />
            <Text
              className={`text-center text-[11px] ${
                sortBy === 'price-high'
                  ? 'font-bold text-primary'
                  : 'font-bold text-muted-foreground'
              }`}>
              Harga Tertinggi
            </Text>
          </Pressable>

          <Pressable
            onPress={() => toggleSort('name')}
            className="z-10 flex-1 flex-col items-center gap-0.5 px-1 py-2">
            <Type size={16} color={sortBy === 'name' ? '#14b8a6' : mutedColor} strokeWidth={2.5} />
            <Text
              className={`text-center text-[11px] ${
                sortBy === 'name' ? 'font-bold text-primary' : 'font-bold text-muted-foreground'
              }`}>
              Nama A-Z
            </Text>
          </Pressable>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={sortedKos}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#14b8a6']} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-4" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/(pencari)/(tabs)/home', params: { kosId: item.id } })
            }
            className="flex-row gap-4 rounded-xl border border-border bg-card p-3 shadow-sm active:opacity-80">
            {/* Thumbnail */}
            <View className="relative shrink-0">
              <View className="h-20 w-20 overflow-hidden rounded-lg bg-muted">
                {item.images && item.images.length > 0 ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="h-full w-full items-center justify-center">
                    <Home size={32} className="text-muted-foreground/30" />
                  </View>
                )}
              </View>
              {/* Type Badge */}
              <View
                className="absolute bottom-1 right-1 rounded px-1.5 py-0.5"
                style={{ backgroundColor: `${KOS_TYPE_COLORS[item.type]}` }}>
                <Text className="font-medium text-[10px] text-white">
                  {KOS_TYPE_LABELS[item.type]}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View className="min-w-0 flex-1 justify-between">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text
                    className="font-semibold text-base leading-tight text-foreground"
                    numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-1">
                    <MaterialSymbolsLocationOnIcon height={14} width={14} color={mutedColor} />
                    <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={(e) => handleUnsave(item.id, e)}
                  className="shrink-0 p-1 active:opacity-70">
                  <Bookmark
                    size={24}
                    color={KOS_TYPE_COLORS[item.type]}
                    fill={KOS_TYPE_COLORS[item.type]}
                  />
                </Pressable>
              </View>

              <View className="mt-1 flex-row items-end justify-between">
                <View className="flex-col">
                  <Text className="font-bold text-[15px] text-primary">
                    {formatPrice(item.priceMin)}
                    <Text className="text-xs font-normal text-muted-foreground"> / bulan</Text>
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
