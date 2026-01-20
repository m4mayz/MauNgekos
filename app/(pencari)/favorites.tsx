import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function FavoritesScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-4">
      <Text className="mb-2 text-xl font-semibold text-foreground">Kos Favorit</Text>
      <Text className="text-center text-muted-foreground">
        Fitur favorit akan segera hadir.{'\n'}Simpan kos favoritmu di sini!
      </Text>
    </View>
  );
}
