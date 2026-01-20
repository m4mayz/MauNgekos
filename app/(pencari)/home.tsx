import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Kos, KosFilter, KosType } from '@/types';
import { getApprovedKos } from '@/services/kosService';
import { Search, SlidersHorizontal, X, Navigation, LogIn, User, MapPin } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Default location (Jakarta)
const DEFAULT_REGION: Region = {
  latitude: -6.2088,
  longitude: 106.8456,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const KOS_TYPE_COLORS: Record<KosType, string> = {
  putra: '#3B82F6',
  putri: '#EC4899',
  campur: '#10B981',
};

export default function HomeScreen() {
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [kosList, setKosList] = useState<Kos[]>([]);
  const [filteredKos, setFilteredKos] = useState<Kos[]>([]);
  const [selectedKos, setSelectedKos] = useState<Kos | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<KosFilter>({});
  const [loading, setLoading] = useState(true);

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const location = await Location.getCurrentPositionAsync({});
            const newRegion: Region = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
          } catch (error) {
            console.log('Location request failed, using default');
          }
        }
      } catch (error) {
        console.log('Permission request failed, using default');
      }
    })();
  }, []);

  // Load kos data
  useEffect(() => {
    loadKos();
  }, []);

  const loadKos = async () => {
    setLoading(true);
    try {
      const data = await getApprovedKos();
      setKosList(data);
      setFilteredKos(data);
    } catch (error) {
      console.error('Error loading kos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter kos based on search and filters
  useEffect(() => {
    let result = [...kosList];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (kos) => kos.name.toLowerCase().includes(query) || kos.address.toLowerCase().includes(query)
      );
    }

    if (filters.priceMin !== undefined) {
      result = result.filter((kos) => kos.priceMin >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      result = result.filter((kos) => kos.priceMax <= filters.priceMax!);
    }
    if (filters.type) {
      result = result.filter((kos) => kos.type === filters.type);
    }
    if (filters.hasAvailableRooms) {
      result = result.filter((kos) => kos.availableRooms > 0);
    }

    setFilteredKos(result);
  }, [searchQuery, filters, kosList]);

  const handleMarkerPress = (kos: Kos) => {
    setSelectedKos(kos);
  };

  const goToUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const newRegion: Region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.log('Could not get location');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedKos(null)}>
        {filteredKos.map((kos) => (
          <Marker
            key={kos.id}
            coordinate={{
              latitude: kos.location.latitude,
              longitude: kos.location.longitude,
            }}
            onPress={() => handleMarkerPress(kos)}>
            <View style={[styles.markerContainer, { backgroundColor: KOS_TYPE_COLORS[kos.type] }]}>
              <MapPin size={16} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Search Bar */}
      <View className="absolute left-4 right-4 top-12">
        <View className="flex-row gap-2">
          <View className="relative flex-1">
            <Search
              size={20}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Cari nama atau alamat kos..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-background/95 pl-11 shadow-lg"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onPress={() => setSearchQuery('')}>
                <X size={16} className="text-muted-foreground" />
              </Button>
            )}
          </View>
          <Button
            variant={showFilter ? 'default' : 'outline'}
            size="icon"
            className="bg-background shadow-lg"
            onPress={() => setShowFilter(!showFilter)}>
            <SlidersHorizontal
              size={20}
              className={showFilter ? 'text-primary-foreground' : 'text-foreground'}
            />
          </Button>
        </View>

        {/* Filter Options */}
        {showFilter && (
          <View className="mt-2 rounded-xl bg-background/95 p-4 shadow-lg">
            <Text className="mb-3 font-semibold">Tipe Kos</Text>
            <View className="mb-4 flex-row gap-2">
              {(['putra', 'putri', 'campur'] as KosType[]).map((type) => (
                <Pressable
                  key={type}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      type: prev.type === type ? undefined : type,
                    }))
                  }>
                  <Badge
                    variant={filters.type === type ? 'default' : 'outline'}
                    className="px-3 py-1">
                    <Text
                      className={
                        filters.type === type ? 'capitalize text-primary-foreground' : 'capitalize'
                      }>
                      {type}
                    </Text>
                  </Badge>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  hasAvailableRooms: !prev.hasAvailableRooms,
                }))
              }
              className="flex-row items-center gap-2">
              <View
                className={`h-5 w-5 rounded border ${
                  filters.hasAvailableRooms ? 'border-primary bg-primary' : 'border-border'
                }`}
              />
              <Text>Hanya kamar tersedia</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Guest Login Button */}
      {!user && (
        <Button
          variant="default"
          className="absolute right-20 top-12 flex-row gap-2 shadow-lg"
          onPress={() => router.push('/(auth)/login')}>
          <LogIn size={18} className="text-primary-foreground" />
          <Text className="font-medium text-primary-foreground">Masuk</Text>
        </Button>
      )}

      {/* User Profile Button (if logged in) */}
      {user && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-20 top-12 bg-background shadow-lg"
          onPress={() => router.push('/(pencari)/profile')}>
          <User size={20} className="text-foreground" />
        </Button>
      )}

      {/* My Location Button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute bottom-32 right-4 rounded-full bg-background shadow-lg"
        onPress={goToUserLocation}>
        <Navigation size={20} className="text-primary" />
      </Button>

      {/* Selected Kos Preview */}
      {selectedKos && (
        <Pressable
          className="absolute bottom-24 left-4 right-4"
          onPress={() => router.push(`/(pencari)/kos/${selectedKos.id}`)}>
          <View className="rounded-xl bg-background p-4 shadow-lg">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <View className="mb-1 flex-row items-center gap-2">
                  <Badge
                    style={{
                      backgroundColor: KOS_TYPE_COLORS[selectedKos.type],
                    }}>
                    <Text className="text-xs capitalize text-white">{selectedKos.type}</Text>
                  </Badge>
                  {selectedKos.availableRooms > 0 && (
                    <Badge variant="outline">
                      <Text className="text-xs">{selectedKos.availableRooms} kamar tersedia</Text>
                    </Badge>
                  )}
                </View>
                <Text className="text-lg font-bold" numberOfLines={1}>
                  {selectedKos.name}
                </Text>
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                  {selectedKos.address}
                </Text>
              </View>
              <Button variant="ghost" size="icon" onPress={() => setSelectedKos(null)}>
                <X size={20} className="text-muted-foreground" />
              </Button>
            </View>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="font-bold text-primary">
                {formatPrice(selectedKos.priceMin)} - {formatPrice(selectedKos.priceMax)}
                <Text className="font-normal text-muted-foreground">/bulan</Text>
              </Text>
              <Text className="text-sm text-primary">Lihat Detail →</Text>
            </View>
          </View>
        </Pressable>
      )}

      {/* Kos Count */}
      <View className="absolute bottom-4 left-4">
        <Badge variant="secondary" className="shadow">
          <Text className="text-xs">{filteredKos.length} kos ditemukan</Text>
        </Badge>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
