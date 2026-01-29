import { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  KosType,
  ROOM_FACILITIES,
  COMMON_FACILITIES,
  ROOM_FACILITY_KEYS,
  COMMON_FACILITY_KEYS,
} from '@/types';
import { submitKosFromDraft, createGeoPoint, getKosByOwner } from '@/services/kosService';
import { saveDraft, getDraft, KosDraft } from '@/services/draftService';
import { uploadImage } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import {
  X,
  MapPin,
  Home,
  Plus,
  ChevronLeft,
  Check,
  Compass,
  Save,
  Send,
} from 'lucide-react-native';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import * as Location from 'expo-location';
import IcBaselineWhatsappIcon from '@/components/icons/ic/baseline-whatsapp';

type KosTypeOption = {
  value: KosType;
  label: string;
  color: string;
};

const KOS_TYPES: KosTypeOption[] = [
  { value: 'putra', label: 'Putra', color: '#3B82F6' },
  { value: 'putri', label: 'Putri', color: '#EC4899' },
  { value: 'campur', label: 'Campur', color: '#10B981' },
];

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

// Default location (Jakarta)
const DEFAULT_REGION: Region = {
  latitude: -6.2088,
  longitude: 106.8456,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function AddKosScreen() {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const mapRef = useRef<MapView>(null);

  // Load draft on mount
  useEffect(() => {
    (async () => {
      const draft = await getDraft(draftId);
      if (draft) {
        setName(draft.name);
        setOwnerPhone(draft.ownerPhone);
        setAddress(draft.address);
        setDescription(draft.description || '');
        setType(draft.type);
        setPriceMin(draft.priceMin.toString());
        setPriceMax(draft.priceMax.toString());
        setTotalRooms(draft.totalRooms.toString());
        setAvailableRooms(draft.availableRooms.toString());
        setSelectedFacilities(draft.facilities);
        setImages(draft.images);
        setLatitude(draft.latitude.toString());
        setLongitude(draft.longitude.toString());
      }
    })();
  }, []);

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

  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false); // For Ajukan (submit)
  const [saving, setSaving] = useState(false); // For Simpan (save draft)
  const [isLocating, setIsLocating] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // Generate temp ID for draft
  const [draftId] = useState(`draft_${Date.now()}`);

  const iconColor = colorScheme === 'dark' ? '#14b8a6' : 'black';
  const mutedColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  // Tab state for facilities
  const [activeTab, setActiveTab] = useState('room');

  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [tempLocation, setTempLocation] = useState({
    latitude: -6.2088,
    longitude: 106.8456,
  });
  const [isMapMoving, setIsMapMoving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<KosType>('campur');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [totalRooms, setTotalRooms] = useState('');
  const [availableRooms, setAvailableRooms] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  // TODO: Implement location picker with map
  const [latitude, setLatitude] = useState('-6.2088');
  const [longitude, setLongitude] = useState('106.8456');

  // Location picker functions
  const openLocationPicker = () => {
    setTempLocation({
      latitude: parseFloat(latitude) || -6.2088,
      longitude: parseFloat(longitude) || 106.8456,
    });
    setShowLocationPicker(true);
  };

  const confirmLocation = () => {
    setLatitude(tempLocation.latitude.toString());
    setLongitude(tempLocation.longitude.toString());
    setShowLocationPicker(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      setImages((prev) => [...prev, ...result.assets.map((asset) => asset.uri)]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
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
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
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
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          mapRef.current?.animateToRegion(newRegion, 1000);
        } catch (e) {
          // If timeout or error, we stick with lastKnown if we have it
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

  const validateForm = () => {
    if (images.length === 0) {
      Alert.alert('Error', 'Minimal 1 foto kos harus diunggah');
      return false;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Nama kos harus diisi');
      return false;
    }
    if (!ownerPhone.trim()) {
      Alert.alert('Error', 'Nomor WhatsApp harus diisi');
      return false;
    }
    // Validate phone format
    const phoneDigits = ownerPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      Alert.alert('Error', 'Format nomor WhatsApp tidak valid (10-15 digit)');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Alamat harus diisi');
      return false;
    }
    if (!priceMin || !priceMax) {
      Alert.alert('Error', 'Harga harus diisi');
      return false;
    }
    if (!totalRooms || !availableRooms) {
      Alert.alert('Error', 'Jumlah kamar harus diisi');
      return false;
    }
    if (parseInt(availableRooms) > parseInt(totalRooms)) {
      Alert.alert('Error', 'Kamar tersedia tidak boleh lebih dari total kamar');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user) return;

    setSaving(true);
    try {
      const draft: KosDraft = {
        kosId: draftId,
        ownerId: user.id,
        ownerName: user.name,
        ownerPhone: ownerPhone.trim(),
        name: name.trim(),
        address: address.trim(),
        description: description.trim() || undefined,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        type,
        priceMin: parseInt(priceMin),
        priceMax: parseInt(priceMax),
        totalRooms: parseInt(totalRooms),
        availableRooms: parseInt(availableRooms),
        facilities: selectedFacilities,
        images,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveDraft(draftId, draft);
      Alert.alert(
        'Berhasil',
        'Perubahan disimpan secara lokal. Klik "Ajukan" untuk mengirim ke admin.'
      );
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user) return;

    // Check quota
    const existingKos = await getKosByOwner(user.id);
    const kosQuota = user.kos_quota || 1;
    if (existingKos.length >= kosQuota) {
      Alert.alert(
        'Kuota Tercapai',
        `Anda sudah mencapai kuota maksimal (${kosQuota} kos). Hapus kos lama atau upgrade ke Premium.`
      );
      return;
    }

    setLoading(true);
    try {
      // Upload images
      const uploadedImages: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const path = `kos/${user.id}/${Date.now()}_${i}.jpg`;
        const url = await uploadImage(images[i], path);
        if (url) {
          uploadedImages.push(url);
        }
      }

      // Submit kos
      await submitKosFromDraft({
        ownerId: user.id,
        ownerName: user.name,
        ownerPhone: ownerPhone.trim(),
        name: name.trim(),
        address: address.trim(),
        description: description.trim() || undefined,
        location: createGeoPoint(parseFloat(latitude), parseFloat(longitude)),
        type,
        priceMin: parseInt(priceMin),
        priceMax: parseInt(priceMax),
        totalRooms: parseInt(totalRooms),
        availableRooms: parseInt(availableRooms),
        facilities: selectedFacilities,
        images: uploadedImages,
      });

      Alert.alert('Berhasil', 'Kos berhasil diajukan dan menunggu persetujuan admin', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error creating kos:', error);
      Alert.alert('Error', 'Gagal mengajukan kos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background">
      <View style={{ height: insets.top }} />

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Custom Header */}
        <View className="flex-row items-center gap-2 px-2 pb-4">
          <Button variant="ghost" size="icon" onPress={() => router.back()}>
            <ChevronLeft size={24} color={iconColor} />
          </Button>
          <Text className="font-semibold text-lg">Tambah Kos</Text>
        </View>

        <View className="gap-6 px-4 pb-4">
          <View>
            <Label className="mb-2">
              Foto Kos <Text className="text-destructive">*</Text>
            </Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              <View className="flex-row gap-2">
                {images.map((uri, index) => (
                  <View key={index} className="relative">
                    <Image source={{ uri }} className="h-24 w-24 rounded-lg" resizeMode="cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 mt-2 h-6 w-6 rounded-full"
                      onPress={() => removeImage(index)}>
                      <X size={12} color="white" />
                    </Button>
                  </View>
                ))}
                <Pressable
                  onPress={pickImage}
                  className="h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border">
                  <Plus size={24} color={iconColor} />
                  <Text className="mt-1 text-xs text-muted-foreground">Tambah</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>

          {/* Name */}
          <View className="gap-2">
            <Label nativeID="name">
              Nama Kos <Text className="text-destructive">*</Text>
            </Label>
            <Input
              placeholder="Contoh: Kos Putri Mawar"
              value={name}
              onChangeText={setName}
              leftIcon={<Home size={20} color={mutedColor} />}
              aria-labelledby="name"
            />
          </View>

          {/* Owner Phone */}
          <View className="gap-2">
            <Label nativeID="ownerPhone">
              Nomor WhatsApp <Text className="text-destructive">*</Text>
            </Label>
            <Input
              placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
              value={ownerPhone}
              onChangeText={setOwnerPhone}
              keyboardType="phone-pad"
              leftIcon={<IcBaselineWhatsappIcon height={20} width={20} color={mutedColor} />}
              aria-labelledby="ownerPhone"
            />
            <Text className="text-xs text-muted-foreground">
              Format: 08xxx atau 628xxx (akan digunakan untuk tombol WhatsApp)
            </Text>
          </View>

          {/* Address */}
          <View className="gap-2">
            <Label nativeID="address">
              Alamat Lengkap <Text className="text-destructive">*</Text>
            </Label>
            <Textarea
              placeholder="Jl. xxx No. xx, Kelurahan, Kecamatan, Kota"
              value={address}
              onChangeText={setAddress}
              className="min-h-[80px] text-sm"
              aria-labelledby="address"
              placeholderTextColor={mutedColor}
            />
          </View>

          {/* Description */}
          <View className="gap-2">
            <Label nativeID="description">Deskripsi</Label>
            <Textarea
              placeholder="Deskripsikan kos Anda..."
              value={description}
              onChangeText={setDescription}
              className="min-h-[100px] text-sm"
              aria-labelledby="description"
              placeholderTextColor={mutedColor}
            />
          </View>

          {/* Type */}
          <View className="gap-2">
            <Label>
              Tipe Kos <Text className="text-destructive">*</Text>
            </Label>
            <View className="flex-row gap-2">
              {KOS_TYPES.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setType(option.value)}
                  className={`flex-1 items-center rounded-xl border-2 p-3 ${
                    type === option.value ? 'border-primary bg-primary/5' : 'border-border'
                  }`}>
                  <View
                    className="mb-1 h-8 w-8 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  <Text className={type === option.value ? 'font-semibold text-primary' : ''}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Price Range */}
          <View className="gap-2">
            <Label>
              Rentang Harga per Bulan <Text className="text-destructive">*</Text>
            </Label>
            <View className="flex-row gap-3">
              <View className="relative flex-1">
                <Text className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
                  Rp
                </Text>
                <Input
                  placeholder="Min"
                  value={priceMin}
                  onChangeText={setPriceMin}
                  keyboardType="numeric"
                  className="pl-10"
                />
              </View>
              <Text className="self-center text-muted-foreground">-</Text>
              <View className="relative flex-1">
                <Text className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
                  Rp
                </Text>
                <Input
                  placeholder="Max"
                  value={priceMax}
                  onChangeText={setPriceMax}
                  keyboardType="numeric"
                  className="pl-10"
                />
              </View>
            </View>
          </View>

          {/* Rooms */}
          <View className="gap-2">
            <Label>
              Jumlah Kamar <Text className="text-destructive">*</Text>
            </Label>
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-sm text-muted-foreground">Total</Text>
                <Input
                  placeholder="0"
                  value={totalRooms}
                  onChangeText={setTotalRooms}
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-sm text-muted-foreground">Tersedia</Text>
                <Input
                  placeholder="0"
                  value={availableRooms}
                  onChangeText={setAvailableRooms}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Facilities */}
          <View className="gap-2">
            <Label>Fasilitas</Label>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="room" className="flex-1">
                  <Text>Kamar</Text>
                </TabsTrigger>
                <TabsTrigger value="common" className="flex-1">
                  <Text>Umum</Text>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="room" className="gap-3 pt-3">
                <View className="flex-row flex-wrap gap-2">
                  {ROOM_FACILITY_KEYS.map((facility) => (
                    <Pressable
                      key={facility}
                      onPress={() => toggleFacility(facility)}
                      className={`flex-row items-center gap-2 rounded-lg border px-3 py-2 ${
                        selectedFacilities.includes(facility)
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}>
                      <View
                        className={`h-4 w-4 items-center justify-center rounded border ${
                          selectedFacilities.includes(facility)
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}>
                        {selectedFacilities.includes(facility) && (
                          <Check size={12} color="#fff" strokeWidth={3} />
                        )}
                      </View>
                      <Text
                        numberOfLines={1}
                        className={selectedFacilities.includes(facility) ? 'text-primary' : ''}>
                        {ROOM_FACILITIES[facility].label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </TabsContent>
              <TabsContent value="common" className="gap-3 pt-3">
                <View className="flex-row flex-wrap gap-2">
                  {COMMON_FACILITY_KEYS.map((facility) => (
                    <Pressable
                      key={facility}
                      onPress={() => toggleFacility(facility)}
                      className={`flex-row items-center gap-2 rounded-lg border px-3 py-2 ${
                        selectedFacilities.includes(facility)
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}>
                      <View
                        className={`h-4 w-4 items-center justify-center rounded border ${
                          selectedFacilities.includes(facility)
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}>
                        {selectedFacilities.includes(facility) && (
                          <Check size={12} color="#fff" strokeWidth={3} />
                        )}
                      </View>
                      <Text className={selectedFacilities.includes(facility) ? 'text-primary' : ''}>
                        {COMMON_FACILITIES[facility].label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </TabsContent>
            </Tabs>
          </View>

          {/* Location Picker */}
          <View className="gap-2">
            <Label>Lokasi Kos</Label>
            <Text className="mb-2 text-xs text-muted-foreground">Pilih lokasi kos pada peta</Text>
            <Button variant="outline" onPress={openLocationPicker} className="flex-row gap-2">
              <MapPin size={20} color={mutedColor} />
              <Text>{latitude && longitude ? 'Ubah Lokasi' : 'Pilih Lokasi'}</Text>
            </Button>
            {latitude && longitude && (
              <Text className="text-xs text-muted-foreground">
                📍 {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
              </Text>
            )}
          </View>

          {/* Action Buttons */}
          <View className="mb-5 mt-4 flex-row gap-3">
            <Button
              onPress={handleSave}
              disabled={saving || loading}
              variant="outline"
              size="lg"
              className="flex-1">
              {saving ? (
                <ActivityIndicator size="small" color="#14b8a6" />
              ) : (
                <>
                  <Save size={20} color={iconColor} />
                  <Text className="ml-2 font-semibold">Simpan</Text>
                </>
              )}
            </Button>
            <Button
              onPress={handleSubmit}
              disabled={loading || saving}
              size="lg"
              className="flex-1">
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Send size={20} color={colorScheme === 'dark' ? 'hsl(0 0% 3.9%)' : '#fff'} />
                  <Text className="ml-2 font-semibold text-primary-foreground">Ajukan</Text>
                </>
              )}
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}>
        <View className="flex-1 bg-background">
          {/* Modal Header */}
          <View
            className="flex-row items-center justify-between px-4 py-3"
            style={{ paddingTop: insets.top + 10 }}>
            <Button variant="ghost" onPress={() => setShowLocationPicker(false)}>
              <Text>Batal</Text>
            </Button>
            <Text className="font-semibold text-lg">Pilih Lokasi</Text>
            <View className="w-10" />
          </View>

          {/* Map */}
          <View className="relative flex-1">
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              customMapStyle={colorScheme === 'dark' ? DARK_MAP_STYLE : []}
              userInterfaceStyle={colorScheme === 'dark' ? 'dark' : 'light'}
              initialRegion={{
                latitude: tempLocation.latitude,
                longitude: tempLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              onRegionChange={() => setIsMapMoving(true)}
              onRegionChangeComplete={(region) => {
                setTempLocation({
                  latitude: region.latitude,
                  longitude: region.longitude,
                });
                setIsMapMoving(false);
              }}></MapView>
            {/* Center Pin */}
            <View className="pointer-events-none absolute inset-0 items-center justify-center pb-12">
              <MaterialIcons name="location-on" size={48} color="#EA4335" />
            </View>

            {/* Floating Select Button */}
            {!isMapMoving && (
              <Animated.View
                entering={FadeInDown.duration(300).delay(700)}
                exiting={FadeOutDown.duration(200)}
                className="absolute bottom-6 left-4 right-4">
                <Button onPress={confirmLocation} size="lg" className="shadow-lg shadow-black/20">
                  <Text className="font-semibold text-primary-foreground">Pilih Lokasi Ini</Text>
                </Button>
              </Animated.View>
            )}
            {/* My Location Button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-[100px] right-4 h-12 w-12 rounded-2xl border-0 bg-background shadow-lg shadow-black dark:bg-[#000]"
              onPress={goToUserLocation}
              disabled={isLocating}>
              {isLocating ? (
                <ActivityIndicator
                  size="small"
                  color={colorScheme === 'dark' ? '#2dd4bf' : '#0d9488'}
                />
              ) : (
                <Compass size={24} color={colorScheme === 'dark' ? '#2dd4bf' : '#0d9488'} />
              )}
            </Button>
          </View>

          {/* Location Info */}
          <View className="bg-background px-4 py-3 pb-8 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
            <Text className="text-sm text-muted-foreground">Koordinat:</Text>
            <Text className="font-medium font-mono text-sm">
              {tempLocation.latitude.toFixed(6)}, {tempLocation.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
