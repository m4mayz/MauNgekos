import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Pressable, SafeAreaView, ScrollView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Kos, KosFilter, KosType, ROOM_FACILITIES, COMMON_FACILITIES } from '@/types';
import { getApprovedKos } from '@/services/kosService';
import {
  Search,
  X,
  Navigation,
  LogIn,
  User,
  MapPin,
  DollarSign,
  Home,
  Sparkles,
  CheckCircle,
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

// Dark mode map style
const DARK_MAP_STYLE = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
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
            <View style={[styles.markerContainer, { backgroundColor: KOS_TYPE_COLORS[kos.type] }]}>
              <MapPin size={16} color="#fff" />
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
                leftIcon={<Search size={20} color="#fff" />}
                rightIcon={searchQuery ? <X size={20} color="#fff" /> : undefined}
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
                <LogIn size={20} color="hsl(0, 0%, 98%)" />
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
                  className="h-9 flex-row items-center gap-1 px-3 shadow-sm shadow-black">
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
                    <Label>Harga Minimum</Label>
                    <Input
                      placeholder="Contoh: 500000"
                      value={tempPriceMin}
                      onChangeText={setTempPriceMin}
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="gap-3">
                    <Label>Harga Maksimum</Label>
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
                  className="h-9 flex-row items-center gap-1 px-3 shadow-sm shadow-black">
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
                  className="h-9 flex-row items-center gap-1 px-3 shadow-sm shadow-black">
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
                        {ROOM_FACILITIES.map((facility) => (
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
                            <Label>{facility}</Label>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </TabsContent>
                  <TabsContent value="common" className="gap-3 pt-3">
                    <ScrollView style={{ maxHeight: 300 }}>
                      <View className="gap-3">
                        {COMMON_FACILITIES.map((facility) => (
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
                            <Label>{facility}</Label>
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
              className="h-9 flex-row items-center gap-1 px-3 shadow-sm shadow-black"
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

        {/* My Location Button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-32 right-4 rounded-full bg-background shadow-lg"
          onPress={goToUserLocation}>
          <Navigation size={20} color="hsl(175, 66%, 32%)" />
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
                  <Text className="font-bold text-lg" numberOfLines={1}>
                    {selectedKos.name}
                  </Text>
                  <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                    {selectedKos.address}
                  </Text>
                </View>
                <Button variant="ghost" size="icon" onPress={() => setSelectedKos(null)}>
                  <X size={20} color="hsl(0, 0%, 45%)" />
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
      </SafeAreaView>
    </View>
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
