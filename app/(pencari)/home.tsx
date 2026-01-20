import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Kos, KosFilter, KosType } from '@/types';
import { getApprovedKos } from '@/services/kosService';
import { Search, SlidersHorizontal, X, Navigation, LogIn, User } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const KOS_TYPE_COLORS: Record<KosType, string> = {
  putra: '#3B82F6',
  putri: '#EC4899',
  campur: '#10B981',
};

export default function HomeScreen() {
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);
  const [kosList, setKosList] = useState<Kos[]>([]);
  const [filteredKos, setFilteredKos] = useState<Kos[]>([]);
  const [selectedKos, setSelectedKos] = useState<Kos | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<KosFilter>({});
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            });
          } catch (error) {
            // Location request failed, use default
            console.log('Location request failed, using default');
            setUserLocation({ lat: -6.2088, lng: 106.8456 });
          }
        } else {
          // Permission denied, use default
          setUserLocation({ lat: -6.2088, lng: 106.8456 });
        }
      } catch (error) {
        // Permission request failed, use default
        console.log('Permission request failed, using default');
        setUserLocation({ lat: -6.2088, lng: 106.8456 });
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Generate Leaflet map HTML
  const generateMapHTML = () => {
    const center = userLocation || { lat: -6.2088, lng: 106.8456 };
    const markers = filteredKos
      .map(
        (kos) => `
      {
        id: "${kos.id}",
        lat: ${kos.location.latitude},
        lng: ${kos.location.longitude},
        name: "${kos.name.replace(/"/g, '\\"')}",
        address: "${kos.address.replace(/"/g, '\\"')}",
        type: "${kos.type}",
        priceMin: ${kos.priceMin},
        priceMax: ${kos.priceMax},
        availableRooms: ${kos.availableRooms},
        color: "${KOS_TYPE_COLORS[kos.type]}"
      }
    `
      )
      .join(',');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { height: 100%; width: 100%; }
          .custom-marker {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .custom-marker svg {
            width: 16px;
            height: 16px;
            fill: white;
          }
          .leaflet-popup-content-wrapper {
            border-radius: 12px;
            padding: 0;
          }
          .leaflet-popup-content {
            margin: 0;
            min-width: 200px;
          }
          .popup-content {
            padding: 12px;
          }
          .popup-type {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            color: white;
            font-size: 11px;
            text-transform: capitalize;
            margin-bottom: 6px;
          }
          .popup-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 4px;
            color: #333;
          }
          .popup-address {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
          }
          .popup-price {
            font-weight: bold;
            color: #10B981;
            font-size: 13px;
          }
          .popup-rooms {
            font-size: 11px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const markers = [${markers}];
          
          const map = L.map('map', {
            zoomControl: false
          }).setView([${center.lat}, ${center.lng}], 14);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          L.control.zoom({ position: 'bottomright' }).addTo(map);

          markers.forEach(m => {
            const icon = L.divIcon({
              className: '',
              html: '<div class="custom-marker" style="background-color: ' + m.color + '"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"/><circle cx="12" cy="9" r="2.5"/></svg></div>',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            });

            const formatPrice = (price) => {
              return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(price);
            };

            const popupContent = 
              '<div class="popup-content">' +
                '<span class="popup-type" style="background-color: ' + m.color + '">' + m.type + '</span>' +
                '<div class="popup-name">' + m.name + '</div>' +
                '<div class="popup-address">' + m.address + '</div>' +
                '<div class="popup-price">' + formatPrice(m.priceMin) + ' - ' + formatPrice(m.priceMax) + '/bulan</div>' +
                '<div class="popup-rooms">' + m.availableRooms + ' kamar tersedia</div>' +
              '</div>';

            L.marker([m.lat, m.lng], { icon })
              .addTo(map)
              .bindPopup(popupContent)
              .on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_click', kos: m }));
              });
          });

          // User location marker
          ${
            userLocation
              ? `
            L.circleMarker([${userLocation.lat}, ${userLocation.lng}], {
              radius: 8,
              fillColor: '#4285F4',
              color: '#fff',
              weight: 3,
              opacity: 1,
              fillOpacity: 1
            }).addTo(map);
          `
              : ''
          }
        </script>
      </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'marker_click') {
        const kos = kosList.find((k) => k.id === data.kos.id);
        if (kos) {
          setSelectedKos(kos);
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map WebView */}
      {userLocation && (
        <WebView
          ref={webViewRef}
          source={{ html: generateMapHTML() }}
          style={styles.map}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      )}

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

      {/* Selected Kos Preview */}
      {selectedKos && (
        <Pressable
          className="absolute bottom-8 left-4 right-4"
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
});
