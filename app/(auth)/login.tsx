import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { colorScheme } from 'nativewind';

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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo & Title */}
          <View className="mb-12 items-center">
            {/* jika mode gelap maka tampilkan icon hitam */}
            {colorScheme === 'dark' ? (
              <Image
                source={require('@/assets/images/icon-no-bg1.png')}
                style={{ width: 100, height: 100 }}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('@/assets/images/icon-no-bg2.png')}
                style={{ width: 100, height: 100 }}
                resizeMode="cover"
              />
            )}
            <Text className="mt-2 text-center font-extrabold text-2xl">Login ke MauNgekos</Text>
            <Text className="mt-2 text-center text-muted-foreground">
              Masuk ke akun Anda untuk melanjutkan
            </Text>
          </View>

          {/* Form */}
          <View className="gap-6">
            {/* Email */}
            <View className="gap-2">
              <Label nativeID="email">Email</Label>
              <Input
                placeholder="Masukkan email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={20} color="hsl(0, 0%, 45%)" />}
                aria-labelledby="email"
              />
            </View>

            {/* Password */}
            <View className="gap-2">
              <Label nativeID="password">Password</Label>
              <Input
                placeholder="Masukkan password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                leftIcon={<Lock size={20} color="hsl(0, 0%, 45%)" />}
                rightIcon={
                  showPassword ? (
                    <EyeOff size={20} color="hsl(0, 0%, 45%)" />
                  ) : (
                    <Eye size={20} color="hsl(0, 0%, 45%)" />
                  )
                }
                onRightIconPress={() => setShowPassword(!showPassword)}
                aria-labelledby="password"
              />
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
