import { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Kos, KosType, FACILITIES } from '@/types';
import { getKosById, updateKos, createGeoPoint } from '@/services/kosService';
import { uploadImage, deleteImage } from '@/lib/supabase';
import { Camera, X, MapPin, Home } from 'lucide-react-native';

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

export default function EditKosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<KosType>('campur');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [totalRooms, setTotalRooms] = useState('');
  const [availableRooms, setAvailableRooms] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  useEffect(() => {
    if (id) {
      loadKos();
    }
  }, [id]);

  const loadKos = async () => {
    try {
      const kos = await getKosById(id!);
      if (kos) {
        setName(kos.name);
        setAddress(kos.address);
        setDescription(kos.description || '');
        setType(kos.type);
        setPriceMin(kos.priceMin.toString());
        setPriceMax(kos.priceMax.toString());
        setTotalRooms(kos.totalRooms.toString());
        setAvailableRooms(kos.availableRooms.toString());
        setSelectedFacilities(kos.facilities);
        setImages(kos.images);
        setLatitude(kos.location.latitude.toString());
        setLongitude(kos.location.longitude.toString());
      }
    } catch (error) {
      console.error('Error loading kos:', error);
      Alert.alert('Error', 'Gagal memuat data kos');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeExistingImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama kos harus diisi');
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
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user || !id) return;

    setSaving(true);
    try {
      // Upload new images
      const uploadedImages: string[] = [...images];
      for (let i = 0; i < newImages.length; i++) {
        const path = `kos/${user.id}/${Date.now()}_${i}.jpg`;
        const url = await uploadImage(newImages[i], path);
        if (url) {
          uploadedImages.push(url);
        }
      }

      // Update kos
      await updateKos(id, {
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

      Alert.alert('Berhasil', 'Kos berhasil diperbarui', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating kos:', error);
      Alert.alert('Error', 'Gagal memperbarui kos');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="gap-6 p-4">
          {/* Images */}
          <View>
            <Label className="mb-2">Foto Kos</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {images.map((uri, index) => (
                  <View key={`existing-${index}`} className="relative">
                    <Image source={{ uri }} className="h-24 w-24 rounded-lg" resizeMode="cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onPress={() => removeExistingImage(index)}>
                      <X size={12} className="text-destructive-foreground" />
                    </Button>
                  </View>
                ))}
                {newImages.map((uri, index) => (
                  <View key={`new-${index}`} className="relative">
                    <Image source={{ uri }} className="h-24 w-24 rounded-lg" resizeMode="cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onPress={() => removeNewImage(index)}>
                      <X size={12} className="text-destructive-foreground" />
                    </Button>
                  </View>
                ))}
                <Pressable
                  onPress={pickImage}
                  className="h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border">
                  <Camera size={24} className="text-muted-foreground" />
                  <Text className="mt-1 text-xs text-muted-foreground">Tambah</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>

          {/* Name */}
          <View className="gap-2">
            <Label nativeID="name">Nama Kos *</Label>
            <View className="relative">
              <Home
                size={20}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Contoh: Kos Putri Mawar"
                value={name}
                onChangeText={setName}
                className="pl-11"
                aria-labelledby="name"
              />
            </View>
          </View>

          {/* Address */}
          <View className="gap-2">
            <Label nativeID="address">Alamat Lengkap *</Label>
            <View className="relative">
              <MapPin size={20} className="absolute left-3 top-3 z-10 text-muted-foreground" />
              <Textarea
                placeholder="Jl. xxx No. xx, Kelurahan, Kecamatan, Kota"
                value={address}
                onChangeText={setAddress}
                className="min-h-[80px] pl-11"
                aria-labelledby="address"
              />
            </View>
          </View>

          {/* Description */}
          <View className="gap-2">
            <Label nativeID="description">Deskripsi</Label>
            <Textarea
              placeholder="Deskripsikan kos Anda..."
              value={description}
              onChangeText={setDescription}
              className="min-h-[100px]"
              aria-labelledby="description"
            />
          </View>

          {/* Type */}
          <View className="gap-2">
            <Label>Tipe Kos *</Label>
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
            <Label>Rentang Harga per Bulan *</Label>
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
            <Label>Jumlah Kamar *</Label>
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
            <View className="flex-row flex-wrap gap-2">
              {FACILITIES.map((facility) => (
                <Pressable
                  key={facility}
                  onPress={() => toggleFacility(facility)}
                  className={`flex-row items-center gap-2 rounded-lg border px-3 py-2 ${
                    selectedFacilities.includes(facility)
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}>
                  <View
                    className={`h-4 w-4 rounded border ${
                      selectedFacilities.includes(facility)
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  />
                  <Text className={selectedFacilities.includes(facility) ? 'text-primary' : ''}>
                    {facility}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Location */}
          <View className="gap-2">
            <Label>Koordinat Lokasi</Label>
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-sm text-muted-foreground">Latitude</Text>
                <Input
                  placeholder="-6.2088"
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-sm text-muted-foreground">Longitude</Text>
                <Input
                  placeholder="106.8456"
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <Button onPress={handleSubmit} disabled={saving} size="lg" className="mt-4">
            <Text className="font-semibold text-primary-foreground">
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
