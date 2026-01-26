import { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Kos,
  KosFilter,
  KosType,
  ROOM_FACILITIES,
  COMMON_FACILITIES,
  ROOM_FACILITY_KEYS,
  COMMON_FACILITY_KEYS,
} from '@/types';
import { getApprovedKos } from '@/services/kosService';
import { KosDetailSheet } from '@/components/KosDetailSheet';
import {
  Search,
  X,
  User,
  DollarSign,
  Home,
  Sparkles,
  CheckCircle,
  Compass,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IcBaselineMyLocationIcon from '@/components/icons/ic/baseline-my-location';

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

// Dark mode map style - Modern & Sleek
const DARK_MAP_STYLE = [
  // Base map styling
  {
    elementType: 'geometry',
    stylers: [{ color: '#1a1f2e' }], // Darker base for better contrast
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0d1117' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8b92a5' }], // Softer label colors
  },
  // Administrative areas
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2dd4bf' }], // Teal accent for cities
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7dd3fc' }], // Light blue for neighborhoods
  },
  // Points of interest
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#252b3a' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b7280' }],
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }], // Hide business POIs for cleaner look
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1e3a2f' }], // Darker green for parks
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4ade80' }], // Bright green labels
  },
  // Roads
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2d3748' }], // Lighter roads for visibility
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a202c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }], // Hide road icons for cleaner look
  },
  // Highways - Make them stand out
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#475569' }], // Lighter highway
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e2e8f0' }], // Bright labels
  },
  // Arterial roads
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  // Local roads
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#252b3a' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  // Transit
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#fbbf24' }], // Yellow for transit stations
  },
  // Water - Make it stand out with teal
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0f172a' }], // Deep dark water
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#60a5fa' }], // Blue labels
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0f172a' }],
  },
  // Landscape
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#1a1f2e' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#1e2433' }],
  },
  // Buildings - subtle presence
  {
    featureType: 'poi.attraction',
    elementType: 'geometry',
    stylers: [{ color: '#2d3748' }],
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [kosList, setKosList] = useState<Kos[]>([]);
  const [filteredKos, setFilteredKos] = useState<Kos[]>([]);
  const [selectedKos, setSelectedKos] = useState<Kos | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<KosFilter>({});
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Separate state for dialog-based filters
  const [tempPriceMin, setTempPriceMin] = useState('');
  const [tempPriceMax, setTempPriceMax] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [activeTabValue, setActiveTabValue] = useState('room');

  const insets = useSafeAreaInsets();

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
      result = result.filter((kos) => kos.priceMax >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      result = result.filter((kos) => kos.priceMin <= filters.priceMax!);
    }
    if (filters.type) {
      result = result.filter((kos) => kos.type === filters.type);
    }
    if (filters.hasAvailableRooms) {
      result = result.filter((kos) => kos.availableRooms > 0);
    }
    if (filters.facilities && filters.facilities.length > 0) {
      result = result.filter((kos) =>
        filters.facilities!.every((facility) => kos.facilities.includes(facility))
      );
    }

    setFilteredKos(result);
  }, [searchQuery, filters, kosList]);

  const handleMarkerPress = (kos: Kos) => {
    setSelectedKos(kos);
    setSheetVisible(true);
  };

  const handleSheetClose = () => {
    setSheetVisible(false);
    setSelectedKos(null);
  };

  const goToUserLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Try to get last known position first (fastest)
        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          const newRegion: Region = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          mapRef.current?.animateToRegion(newRegion, 1000);
        }

        // Then get fresh current position with timeout
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Race between location and 5s timeout
        const timeoutPromise = new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Location timeout')), 5000);
        });

        try {
          const location = (await Promise.race([
            locationPromise,
            timeoutPromise,
          ])) as Location.LocationObject;

          const newRegion: Region = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          mapRef.current?.animateToRegion(newRegion, 1000);
        } catch (e) {
          // If timeout or error, we stick with lastKnown or just stop loading
          console.log('Using last known location or timeout occurred');
        }
      }
    } catch (error) {
      console.log('Could not get location', error);
      Alert.alert('Error', 'Gagal mendapatkan lokasi saat ini');
    } finally {
      setIsLocating(false);
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
    <GestureHandlerRootView style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        showsCompass={false}
        customMapStyle={colorScheme === 'dark' ? DARK_MAP_STYLE : []}
        onPress={() => setSelectedKos(null)}>
        {filteredKos.map((kos) => (
          <Marker
            key={kos.id}
            coordinate={{
              latitude: kos.location.latitude,
              longitude: kos.location.longitude,
            }}
            onPress={() => handleMarkerPress(kos)}>
            <View className="items-center">
              <View
                style={[styles.markerContainer, { backgroundColor: KOS_TYPE_COLORS[kos.type] }]}>
                <Home size={14} color="#fff" />
              </View>
              <View
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: '#fff',
                  transform: [{ rotate: '45deg' }],
                  borderBottomRightRadius: 3,
                  marginTop: -7,
                }}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView style={styles.overlay}>
        {/* Search Bar */}
        <View className="mx-4" style={{ paddingTop: insets.top + 10 }}>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input
                placeholder="Cari nama atau alamat kos..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                leftIcon={<Search size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />}
                rightIcon={
                  searchQuery ? (
                    <X size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />
                  ) : undefined
                }
                onRightIconPress={() => setSearchQuery('')}
                className="shadow-lg shadow-black"
              />
            </View>
            {!user && (
              <Button
                variant="default"
                size="icon"
                className="h-10 self-center shadow shadow-black"
                onPress={() => router.push('/(auth)/login')}>
                <Image source={require('@/assets/images/icon-no-bg1.png')} className="h-9 w-9" />
              </Button>
            )}
            {user && (
              <Button
                variant="outline"
                size="icon"
                className="bg-background shadow shadow-black"
                onPress={() => router.push('/(pencari)/profile')}>
                <User size={20} color="hsl(0, 0%, 3.9%)" />
              </Button>
            )}
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            paddingVertical: 4,
            paddingTop: 10,
          }}
          style={{ maxHeight: 60 }}
          className="">
          <View className="flex-row gap-2">
            {/* Price Filter */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant={filters.priceMin || filters.priceMax ? 'default' : 'outline'}
                  className="h-9 flex-row items-center gap-1 px-3">
                  <DollarSign
                    size={14}
                    color={
                      colorScheme === 'dark'
                        ? '#fff'
                        : filters.priceMin || filters.priceMax
                          ? '#fff'
                          : 'hsl(0, 0%, 3.9%)'
                    }
                  />
                  <Text className={colorScheme === 'dark' ? 'text-white' : ''}>Harga</Text>
                </Button>
              </DialogTrigger>
              <DialogContent className="min-w-[300px]">
                <DialogHeader>
                  <DialogTitle>Filter Harga</DialogTitle>
                  <DialogDescription>Tentukan rentang harga kos per bulan</DialogDescription>
                </DialogHeader>
                <View className="gap-4">
                  <View className="gap-3">
                    <Label>Harga Minimum (Rp)</Label>
                    <Input
                      placeholder="Contoh: 500000"
                      value={tempPriceMin}
                      onChangeText={setTempPriceMin}
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="gap-3">
                    <Label>Harga Maksimum (Rp)</Label>
                    <Input
                      placeholder="Contoh: 2000000"
                      value={tempPriceMax}
                      onChangeText={setTempPriceMax}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      onPress={() => {
                        setTempPriceMin('');
                        setTempPriceMax('');
                      }}>
                      <Text>Reset</Text>
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      onPress={() => {
                        setFilters((prev) => ({
                          ...prev,
                          priceMin: tempPriceMin ? parseInt(tempPriceMin) : undefined,
                          priceMax: tempPriceMax ? parseInt(tempPriceMax) : undefined,
                        }));
                      }}>
                      <Text>Terapkan</Text>
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Kos Type Filter */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant={filters.type ? 'default' : 'outline'}
                  className="h-9 flex-row items-center gap-1 px-3">
                  <Home
                    size={14}
                    color={
                      colorScheme === 'dark' ? '#fff' : filters.type ? '#fff' : 'hsl(0, 0%, 3.9%)'
                    }
                  />
                  <Text className={colorScheme === 'dark' ? 'text-white' : ''}>
                    {filters.type
                      ? filters.type.charAt(0).toUpperCase() + filters.type.slice(1)
                      : 'Tipe Kos'}
                  </Text>
                </Button>
              </DialogTrigger>
              <DialogContent className="min-w-[300px]">
                <DialogHeader>
                  <DialogTitle>Tipe Kos</DialogTitle>
                  <DialogDescription>Pilih tipe kos yang Anda cari</DialogDescription>
                </DialogHeader>
                <RadioGroup
                  value={filters.type || ''}
                  onValueChange={(value) => {
                    setFilters((prev) => ({
                      ...prev,
                      type: value as KosType,
                    }));
                  }}>
                  <View className="gap-3">
                    {(['putra', 'putri', 'campur'] as KosType[]).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setFilters((prev) => ({ ...prev, type }))}
                        className="flex-row items-center gap-3">
                        <RadioGroupItem value={type} />
                        <Label className="capitalize">{type}</Label>
                      </Pressable>
                    ))}
                  </View>
                </RadioGroup>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      onPress={() => {
                        setFilters((prev) => ({ ...prev, type: undefined }));
                      }}>
                      <Text>Reset</Text>
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>
                      <Text>Terapkan</Text>
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Facilities Filter */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant={selectedFacilities.length > 0 ? 'default' : 'outline'}
                  className="h-9 flex-row items-center gap-1 px-3">
                  <Sparkles
                    size={14}
                    color={
                      colorScheme === 'dark'
                        ? '#fff'
                        : selectedFacilities.length > 0
                          ? '#fff'
                          : 'hsl(0, 0%, 3.9%)'
                    }
                  />
                  <Text className={colorScheme === 'dark' ? 'text-white' : ''}>
                    Fasilitas
                    {selectedFacilities.length > 0 ? ` (${selectedFacilities.length})` : ''}
                  </Text>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[300px]">
                <DialogHeader>
                  <DialogTitle>Fasilitas Kos</DialogTitle>
                  <DialogDescription>Pilih fasilitas yang Anda butuhkan</DialogDescription>
                </DialogHeader>
                <Tabs value={activeTabValue} onValueChange={setActiveTabValue} className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="room" className="flex-1">
                      <Text>Kamar</Text>
                    </TabsTrigger>
                    <TabsTrigger value="common" className="flex-1">
                      <Text>Umum</Text>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="room" className="gap-3 pt-3">
                    <ScrollView style={{ maxHeight: 300 }}>
                      <View className="gap-3">
                        {ROOM_FACILITY_KEYS.map((facility) => (
                          <Pressable
                            key={facility}
                            onPress={() => {
                              setSelectedFacilities((prev) =>
                                prev.includes(facility)
                                  ? prev.filter((f) => f !== facility)
                                  : [...prev, facility]
                              );
                            }}
                            className="flex-row items-center gap-3">
                            <Checkbox
                              checked={selectedFacilities.includes(facility)}
                              onCheckedChange={(checked) => {
                                setSelectedFacilities((prev) =>
                                  checked ? [...prev, facility] : prev.filter((f) => f !== facility)
                                );
                              }}
                            />
                            <Label>{ROOM_FACILITIES[facility].label}</Label>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </TabsContent>
                  <TabsContent value="common" className="gap-3 pt-3">
                    <ScrollView style={{ maxHeight: 300 }}>
                      <View className="gap-3">
                        {COMMON_FACILITY_KEYS.map((facility) => (
                          <Pressable
                            key={facility}
                            onPress={() => {
                              setSelectedFacilities((prev) =>
                                prev.includes(facility)
                                  ? prev.filter((f) => f !== facility)
                                  : [...prev, facility]
                              );
                            }}
                            className="flex-row items-center gap-3">
                            <Checkbox
                              checked={selectedFacilities.includes(facility)}
                              onCheckedChange={(checked) => {
                                setSelectedFacilities((prev) =>
                                  checked ? [...prev, facility] : prev.filter((f) => f !== facility)
                                );
                              }}
                            />
                            <Label>{COMMON_FACILITIES[facility].label}</Label>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </TabsContent>
                </Tabs>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      onPress={() => {
                        setSelectedFacilities([]);
                      }}>
                      <Text>Reset</Text>
                    </Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button
                      onPress={() => {
                        setFilters((prev) => ({
                          ...prev,
                          facilities:
                            selectedFacilities.length > 0 ? selectedFacilities : undefined,
                        }));
                      }}>
                      <Text>Terapkan</Text>
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Available Rooms Toggle */}
            <Button
              variant={filters.hasAvailableRooms ? 'default' : 'outline'}
              className="h-9 flex-row items-center gap-1 px-3"
              onPress={() =>
                setFilters((prev) => ({
                  ...prev,
                  hasAvailableRooms: !prev.hasAvailableRooms,
                }))
              }>
              <CheckCircle
                size={14}
                color={
                  colorScheme === 'dark'
                    ? '#fff'
                    : filters.hasAvailableRooms
                      ? '#fff'
                      : 'hsl(0, 0%, 3.9%)'
                }
              />
              <Text className={colorScheme === 'dark' ? 'text-white' : ''}>Kamar Tersedia</Text>
            </Button>
          </View>
        </ScrollView>

        {/* My Location Button - Hidden when sheet is visible */}
        {!sheetVisible && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-[20px] right-4 h-12 w-12 rounded-2xl border-0 bg-background shadow-lg shadow-black dark:bg-[#000]"
            onPress={goToUserLocation}
            disabled={isLocating}>
            {isLocating ? (
              <ActivityIndicator
                size="small"
                color={colorScheme === 'dark' ? '#2dd4bf' : '#0d9488'}
              />
            ) : (
              <IcBaselineMyLocationIcon
                height={22}
                width={22}
                color={colorScheme === 'dark' ? '#2dd4bf' : '#0d9488'}
              />
            )}
          </Button>
        )}
      </SafeAreaView>

      {/* Kos Detail Bottom Sheet */}
      <KosDetailSheet kos={selectedKos} visible={sheetVisible} onClose={handleSheetClose} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  markerContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
