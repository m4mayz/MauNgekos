import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert, Pressable } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Mail, Lock, User, Phone, Eye, EyeOff, Search, Home } from 'lucide-react-native';

type RoleOption = {
  value: Exclude<UserRole, 'admin'>;
  label: string;
  description: string;
  icon: typeof Search;
};

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'pencari',
    label: 'Pencari Kos',
    description: 'Cari kos sesuai kebutuhanmu',
    icon: Search,
  },
  {
    value: 'penyewa',
    label: 'Pemilik Kos',
    description: 'Kelola dan promosikan kos-mu',
    icon: Home,
  },
];

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Exclude<UserRole, 'admin'>>('pencari');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password tidak cocok');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name, role, phone || undefined);
      // Navigation will be handled by auth state change
    } catch (error: any) {
      let message = 'Terjadi kesalahan saat mendaftar';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email sudah terdaftar';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Format email tidak valid';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password terlalu lemah';
      }
      Alert.alert('Pendaftaran Gagal', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 py-8">
          {/* Header */}
          <View className="mb-8 items-center">
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MapPin size={32} className="text-primary" />
            </View>
            <Text className="text-2xl font-bold text-foreground">Daftar Akun</Text>
            <Text className="mt-1 text-center text-muted-foreground">
              Pilih jenis akun dan lengkapi datamu
            </Text>
          </View>

          {/* Role Selection */}
          <View className="mb-6">
            <Label className="mb-3">Daftar Sebagai</Label>
            <View className="flex-row gap-3">
              {ROLE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = role === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setRole(option.value)}
                    className={`flex-1 rounded-xl border-2 p-4 ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}>
                    <View className="items-center gap-2">
                      <View
                        className={`h-12 w-12 items-center justify-center rounded-full ${
                          isSelected ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                        <Icon
                          size={24}
                          className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                        />
                      </View>
                      <Text
                        className={`text-center font-semibold ${
                          isSelected ? 'text-primary' : 'text-foreground'
                        }`}>
                        {option.label}
                      </Text>
                      <Text className="text-center text-xs text-muted-foreground" numberOfLines={2}>
                        {option.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Form */}
          <View className="gap-4">
            {/* Name */}
            <View className="gap-2">
              <Label nativeID="name">Nama Lengkap</Label>
              <View className="relative">
                <User
                  size={20}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Masukkan nama lengkap"
                  value={name}
                  onChangeText={setName}
                  className="pl-11"
                  aria-labelledby="name"
                />
              </View>
            </View>

            {/* Email */}
            <View className="gap-2">
              <Label nativeID="email">Email</Label>
              <View className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Masukkan email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="pl-11"
                  aria-labelledby="email"
                />
              </View>
            </View>

            {/* Phone */}
            <View className="gap-2">
              <Label nativeID="phone">No. Telepon (Opsional)</Label>
              <View className="relative">
                <Phone
                  size={20}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Masukkan nomor telepon"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  className="pl-11"
                  aria-labelledby="phone"
                />
              </View>
            </View>

            {/* Password */}
            <View className="gap-2">
              <Label nativeID="password">Password</Label>
              <View className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  className="pl-11 pr-11"
                  aria-labelledby="password"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} className="text-muted-foreground" />
                  ) : (
                    <Eye size={20} className="text-muted-foreground" />
                  )}
                </Button>
              </View>
            </View>

            {/* Confirm Password */}
            <View className="gap-2">
              <Label nativeID="confirmPassword">Konfirmasi Password</Label>
              <View className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  className="pl-11"
                  aria-labelledby="confirmPassword"
                />
              </View>
            </View>

            {/* Register Button */}
            <Button onPress={handleRegister} disabled={loading} className="mt-4" size="lg">
              <Text className="font-semibold text-primary-foreground">
                {loading ? 'Loading...' : 'Daftar'}
              </Text>
            </Button>

            {/* Login Link */}
            <View className="mt-4 flex-row justify-center">
              <Text className="text-muted-foreground">Sudah punya akun? </Text>
              <Link href="/(auth)/login" asChild>
                <Text className="font-semibold text-primary">Masuk</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
