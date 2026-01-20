import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // Navigation will be handled by auth state change
    } catch (error: any) {
      let message = 'Terjadi kesalahan saat login';
      if (error.code === 'auth/user-not-found') {
        message = 'Email tidak terdaftar';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Password salah';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Format email tidak valid';
      }
      Alert.alert('Login Gagal', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo & Title */}
          <View className="mb-12 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <MapPin size={40} className="text-primary" />
            </View>
            <Text className="text-3xl font-bold text-foreground">Mau Ngekos</Text>
            <Text className="mt-2 text-muted-foreground">Temukan kos impianmu</Text>
          </View>

          {/* Form */}
          <View className="gap-6">
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

            {/* Password */}
            <View className="gap-2">
              <Label nativeID="password">Password</Label>
              <View className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Masukkan password"
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

            {/* Login Button */}
            <Button onPress={handleLogin} disabled={loading} className="mt-4" size="lg">
              <Text className="font-semibold text-primary-foreground">
                {loading ? 'Loading...' : 'Masuk'}
              </Text>
            </Button>

            {/* Register Link */}
            <View className="mt-4 flex-row justify-center">
              <Text className="text-muted-foreground">Belum punya akun? </Text>
              <Link href="/(auth)/register" asChild>
                <Text className="font-semibold text-primary">Daftar</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
