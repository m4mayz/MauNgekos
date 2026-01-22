import { Tabs } from 'expo-router';
import { MapPin, User, Bookmark } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PortalHost } from '@rn-primitives/portal';
import { View, Pressable, Platform, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { useRef } from 'react';

const TAB_WIDTH = (Dimensions.get('window').width - 40) / 3; // Minus padding horizontal

const TabBarButton = ({ options, isFocused, onPress, onLongPress, colorScheme }: any) => {
  const activeColor = colorScheme === 'dark' ? '#2dd4bf' : '#0d9488';
  const inactiveColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-1 items-center justify-center gap-1">
      <View>
        {options.tabBarIcon &&
          options.tabBarIcon({
            color: isFocused ? activeColor : inactiveColor,
            size: 24,
            focused: isFocused,
          })}
      </View>
      <Animated.Text
        style={{
          color: isFocused ? activeColor : inactiveColor,
          fontSize: 12,
          fontFamily: isFocused ? 'Manrope_700Bold' : 'Manrope_500Medium',
          marginTop: 2,
        }}>
        {options.title}
      </Animated.Text>
    </Pressable>
  );
};

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const capsulePosition = useSharedValue(0);
  const previousIndexRef = useRef(0);

  const animatedCapsuleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: capsulePosition.value }],
    };
  });

  return (
    <>
      <Tabs
        tabBar={({ state, descriptors, navigation }) => {
          // Update capsule position when tab changes
          if (state.index !== previousIndexRef.current) {
            previousIndexRef.current = state.index;
            capsulePosition.value = withSpring(state.index * TAB_WIDTH, {
              damping: 100,
              stiffness: 500,
            });
          }

          return (
            <View
              className="flex-row items-center justify-between border-t border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              style={{
                height: 80 + insets.bottom,
                paddingBottom: insets.bottom,
                paddingHorizontal: 20,
              }}>
              {/* Background Kapsul yang Beranimasi */}
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    left: 20,
                    top: 10,
                    width: TAB_WIDTH,
                    height: 60,
                    backgroundColor: colorScheme === 'dark' ? '#0f766e' : '#99f6e4',
                    borderRadius: 25,
                    opacity: 0.2,
                  },
                  animatedCapsuleStyle,
                ]}
              />

              {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                if (options.href === null) return null;

                const isFocused = state.index === index;

                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                };

                const onLongPress = () => {
                  navigation.emit({
                    type: 'tabLongPress',
                    target: route.key,
                  });
                };

                return (
                  <TabBarButton
                    key={route.key}
                    options={options}
                    isFocused={isFocused}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    colorScheme={colorScheme}
                  />
                );
              })}
            </View>
          );
        }}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
          },
          headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: 'Jelajahi',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Disimpan',
            tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>
      <PortalHost />
    </>
  );
}
