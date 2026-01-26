import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ComponentType } from 'react';
import { useColorScheme } from 'react-native';

interface PageHeaderProps {
  icon: ComponentType<any>;
  title: string;
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export function PageHeader({ icon: Icon, title, insets }: PageHeaderProps) {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? 'white' : '#14b8a6';

  return (
    <View className="bg-card px-4 py-3" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center gap-3">
        <View className="items-center justify-center rounded-2xl bg-primary p-2">
          <Icon width={20} height={20} color="white" />
        </View>
        <Text className="font-extrabold text-sm uppercase tracking-widest text-muted-foreground">
          {title}
        </Text>
      </View>
    </View>
  );
}
