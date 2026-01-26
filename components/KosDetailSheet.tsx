import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Image,
  Dimensions,
  Pressable,
  Linking,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Kos, KosType, ROOM_FACILITIES, COMMON_FACILITIES } from '@/types';
import { getFacilityIcon } from '@/lib/facilityIcons';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { saveKos, unsaveKos, isKosSaved } from '@/services/kosService';
import {
  MapPin,
  Phone,
  MessageCircle,
  Home,
  Wifi,
  Wind,
  Car,
  Utensils,
  Tv,
  ShowerHead,
  DoorOpen,
  Bed,
  Calendar,
  Navigation,
  ChevronDown,
  ImageIcon,
  ExternalLink,
  X,
  Heart,
  Bookmark,
} from 'lucide-react-native';
import { colorScheme } from 'nativewind';
import IcBaselineWhatsappIcon from './icons/ic/baseline-whatsapp';
import MaterialSymbolsSensorDoorOutline from './icons/material-symbols/sensor-door-outline';
import MaterialSymbolsBedIcon from './icons/material-symbols/bed';
import MaterialSymbolsLocationOnIcon from './icons/material-symbols/location-on';

const { width, height } = Dimensions.get('window');

// Facility icon component using static imports
const FacilityIcon = ({
  iconName,
  size = 20,
  color,
}: {
  iconName: string;
  size?: number;
  color?: string;
}) => {
  const IconComponent = getFacilityIcon(iconName);
  return <IconComponent width={size} height={size} color={color || '#9CA3AF'} />;
};

const KOS_TYPE_COLORS: Record<KosType, { primary: string; gradient: string[] }> = {
  putra: {
    primary: '#3B82F6',
    gradient: ['#3B82F6', '#2563EB'],
  },
  putri: {
    primary: '#EC4899',
    gradient: ['#EC4899', '#DB2777'],
  },
  campur: {
    primary: '#10B981',
    gradient: ['#10B981', '#059669'],
  },
};

// Snap points as percentages of screen height (from bottom)
const SNAP_POINTS = {
  MIN: 0.1, // 20%
  HALF: 0.5, // 50%
  MAX: 0.95, // 95%
};

// Pre-compute snap Y values (static, outside component)
const SNAP_Y = {
  MIN: height * (1 - SNAP_POINTS.MIN),
  HALF: height * (1 - SNAP_POINTS.HALF),
  MAX: height * (1 - SNAP_POINTS.MAX),
};

interface KosDetailSheetProps {
  kos: Kos | null;
  onClose: () => void;
  visible: boolean;
}

export function KosDetailSheet({ kos, onClose, visible }: KosDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const translateY = useSharedValue(height);
  const context = useSharedValue({ y: 0 });
  const isVisible = useSharedValue(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isAtMaxSnap, setIsAtMaxSnap] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const colorScheme = useColorScheme();

  const iconColor = colorScheme === 'dark' ? 'white' : 'black';
  const mutedColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';
  const isGuest = !user;

  // Animation config - smooth easing
  const animConfig = {
    duration: 450,
  };

  // Sync visibility to animated value
  useEffect(() => {
    if (visible && kos !== null) {
      isVisible.value = true;
      translateY.value = withTiming(SNAP_Y.HALF, animConfig);

      // Check if kos is saved
      if (user) {
        isKosSaved(user.id, kos.id).then(setIsSaved);
      }
    } else if (!visible) {
      isVisible.value = false;
      // No animation here - close() already handles it
    }
  }, [visible, kos, user]);

  const close = useCallback(() => {
    setIsAtMaxSnap(false);
    setCurrentImageIndex(0);
    setShowFullDescription(false);
    setIsSaved(false);
    translateY.value = withTiming(height, animConfig, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [onClose]);

  const snapToPoint = useCallback((snapY: number) => {
    translateY.value = withTiming(snapY, animConfig);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Overlay - dark at MAX, transparent at HALF (to block map touches)
  const overlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [SNAP_Y.MAX, SNAP_Y.HALF, height],
      [0.5, 0, 0],
      Extrapolation.CLAMP
    );

    // Enable pointer events when sheet is visible (HALF or MAX)
    const pointerEvents = translateY.value < height - 50 ? 'auto' : 'none';

    return {
      opacity,
      pointerEvents,
    };
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handlePhonePress = () => {
    // TODO: ownerPhone not available in Kos type yet
    // Linking.openURL(`tel:${kos?.ownerPhone}`);
  };

  const handleWhatsAppPress = () => {
    if (kos && kos.ownerPhone) {
      const message = `Halo, saya tertarik dengan kos ${kos.name}`;
      const phoneNumber = kos.ownerPhone.startsWith('62')
        ? kos.ownerPhone
        : `62${kos.ownerPhone.replace(/^0/, '')}`; // Convert 08xxx to 628xxx
      Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`);
    }
  };

  const handleNavigate = () => {
    if (kos) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${kos.location.latitude},${kos.location.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentImageIndex(index);
  };

  const handleSave = async () => {
    if (!user || !kos) return;

    // Guest users should login first
    if (isGuest) {
      console.log('[KosDetailSheet] Guest user, redirecting to login');
      handleLogin();
      return;
    }

    console.log('[KosDetailSheet] Toggle save for kos:', kos.id, 'Current state:', isSaved);

    // Optimistic update - UI responds instantly
    const previousState = isSaved;
    setIsSaved(!isSaved);

    try {
      if (previousState) {
        await unsaveKos(user.id, kos.id);
        console.log('[KosDetailSheet] Kos unsaved');
      } else {
        await saveKos(user.id, kos.id);
        console.log('[KosDetailSheet] Kos saved');
      }
    } catch (error) {
      console.error('[KosDetailSheet] Error saving kos:', error);
      // Rollback on error
      setIsSaved(previousState);
    }
  };

  const handleLogin = () => {
    close();
    setTimeout(() => {
      router.push('/(auth)/login');
    }, 500);
  };

  if (!kos) return null;

  // Handle gesture - only responds to touches on the handle area
  const handleGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      const newY = context.value.y + event.translationY;
      translateY.value = Math.max(SNAP_Y.MAX, Math.min(height, newY));
    })
    .onEnd((event) => {
      const currentY = translateY.value;
      const velocity = event.velocityY;

      if (velocity > 500 && currentY > SNAP_Y.MIN) {
        runOnJS(close)();
        return;
      }

      const snapYs = [SNAP_Y.MIN, SNAP_Y.HALF, SNAP_Y.MAX];
      let nearestSnapIndex = 0;
      let nearestDistance = Math.abs(currentY - snapYs[0]);

      for (let i = 1; i < snapYs.length; i++) {
        const distance = Math.abs(currentY - snapYs[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestSnapIndex = i;
        }
      }

      if (velocity > 200 && nearestSnapIndex > 0) {
        nearestSnapIndex--;
      } else if (velocity < -200 && nearestSnapIndex < snapYs.length - 1) {
        nearestSnapIndex++;
      }

      const targetSnapY = snapYs[nearestSnapIndex];

      if (targetSnapY > SNAP_Y.MIN) {
        runOnJS(close)();
      } else {
        runOnJS(snapToPoint)(targetSnapY);
        if (targetSnapY === SNAP_Y.MAX) {
          runOnJS(setIsAtMaxSnap)(true);
        } else {
          runOnJS(setIsAtMaxSnap)(false);
        }
      }
    });

  // ScrollView pan gesture - controls sheet when not at MAX
  const scrollViewPanGesture = Gesture.Pan()
    .enabled(!isAtMaxSnap)
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      // Only respond to vertical gestures
      if (Math.abs(event.translationY) > Math.abs(event.translationX)) {
        const newY = context.value.y + event.translationY;
        translateY.value = Math.max(SNAP_Y.MAX, Math.min(SNAP_Y.HALF, newY));
      }
    })
    .onEnd((event) => {
      const currentY = translateY.value;
      const velocity = event.velocityY;

      // Only snap to positions between HALF and MAX
      if (Math.abs(event.translationY) > Math.abs(event.translationX)) {
        if (velocity < -500 || currentY < (SNAP_Y.HALF + SNAP_Y.MAX) / 2) {
          // Snap to MAX
          translateY.value = withTiming(SNAP_Y.MAX, animConfig);
          runOnJS(setIsAtMaxSnap)(true);
        } else {
          // Snap back to HALF
          translateY.value = withTiming(SNAP_Y.HALF, animConfig);
          runOnJS(setIsAtMaxSnap)(false);
        }
      }
    });

  return (
    <>
      {/* Overlay - only visible at MAX */}
      <Animated.View style={[styles.overlay, overlayStyle]} onTouchEnd={close} />

      {/* Sheet */}
      <Animated.View style={[styles.sheet, animatedStyle]}>
        {/* Handle - Gesture only here */}
        <GestureDetector gesture={handleGesture}>
          <View className="items-center bg-background pb-1.5 pt-3" style={styles.handleContainer}>
            <View className="h-[5px] w-12 rounded-full bg-muted-foreground/50" />
          </View>
        </GestureDetector>

        <GestureDetector gesture={scrollViewPanGesture}>
          <Animated.View style={{ flex: 1 }}>
            <ScrollView
              ref={scrollViewRef}
              className="mb-20 flex-1 bg-background"
              showsVerticalScrollIndicator={false}
              scrollEnabled={isAtMaxSnap}
              bounces={false}
              contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Main Content */}
              <View className="flex flex-col gap-6 px-5 pt-4">
                {/* Title, Price & Action Buttons */}
                <View className="flex-col gap-2">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 flex-col gap-1">
                      <Text className="font-bold text-2xl leading-tight tracking-tight text-foreground">
                        {kos.name}
                      </Text>
                      <View className="flex-row items-baseline gap-1.5">
                        <Text className="font-bold text-lg text-primary">
                          {formatPrice(kos.priceMin)}
                        </Text>
                        <Text className="font-medium text-xs text-muted-foreground">per bulan</Text>
                      </View>
                      {kos.priceMin !== kos.priceMax && (
                        <Text className="text-xs text-muted-foreground">
                          s/d {formatPrice(kos.priceMax)}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2">
                      {/* Kos Type Badge */}
                      <View
                        className="rounded-full px-3 py-1.5"
                        style={{
                          backgroundColor: `${KOS_TYPE_COLORS[kos.type].primary}15`,
                        }}>
                        <Text
                          className="font-bold text-xs uppercase"
                          style={{ color: KOS_TYPE_COLORS[kos.type].primary }}>
                          {kos.type === 'putra'
                            ? 'Putra'
                            : kos.type === 'putri'
                              ? 'Putri'
                              : 'Campur'}
                        </Text>
                      </View>

                      <Pressable
                        onPress={handleSave}
                        className="h-7 w-7 items-center justify-center rounded-full bg-muted active:opacity-70">
                        <Bookmark
                          size={16}
                          color={isSaved ? KOS_TYPE_COLORS[kos.type].primary : iconColor}
                          fill={isSaved ? KOS_TYPE_COLORS[kos.type].primary : 'transparent'}
                        />
                      </Pressable>
                      <Pressable
                        onPress={close}
                        className="h-7 w-7 items-center justify-center rounded-full bg-muted active:opacity-70">
                        <X size={16} color={iconColor} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Address */}
                  <Pressable onPress={handleNavigate} className="flex-row items-center gap-1.5">
                    <MaterialSymbolsLocationOnIcon width={16} height={16} color={mutedColor} />
                    <Text
                      className="flex-1 font-medium text-sm text-muted-foreground"
                      numberOfLines={1}>
                      {kos.address}
                    </Text>
                  </Pressable>
                </View>

                {/* Quick Shortcuts */}
                <View className="flex-col gap-3">
                  {isGuest ? (
                    <Pressable
                      onPress={handleLogin}
                      className="flex-row items-center justify-center gap-2 rounded-lg bg-primary py-3.5 active:opacity-90">
                      <Text className="font-semibold text-sm text-white">
                        Masuk untuk lihat selengkapnya
                      </Text>
                    </Pressable>
                  ) : (
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={handleNavigate}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-border bg-transparent py-3 active:opacity-70">
                        <Text
                          className="flex-shrink-0 font-semibold text-sm text-foreground"
                          numberOfLines={1}>
                          Buka Maps
                        </Text>
                        <ExternalLink size={16} color={iconColor} />
                      </Pressable>

                      <Pressable
                        onPress={handleWhatsAppPress}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-primary py-3 active:opacity-90">
                        <Text
                          className="flex-shrink-0 font-semibold text-sm text-white"
                          numberOfLines={1}>
                          Hubungi Pemilik
                        </Text>
                        <IcBaselineWhatsappIcon height={20} width={20} color="#fff" />
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Image Gallery */}
                <View className="relative -mx-5">
                  {kos.images && kos.images.length > 0 ? (
                    <>
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        decelerationRate="fast"
                        snapToInterval={width}>
                        {kos.images.map((image, index) => (
                          <View key={index} className="px-4" style={{ width }}>
                            <View className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
                              <Image
                                source={{ uri: image }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                              />
                            </View>
                          </View>
                        ))}
                      </ScrollView>

                      {/* Carousel Dots */}
                      {kos.images.length > 1 && (
                        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5">
                          {kos.images.map((_, index) => (
                            <View
                              key={index}
                              className={`h-1.5 w-1.5 rounded-full shadow-sm ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <View className="mx-4 aspect-[4/3] items-center justify-center rounded-xl bg-muted">
                      <Home size={48} className="text-muted-foreground/30" />
                      <Text className="mt-2 text-sm text-muted-foreground">Tidak ada foto</Text>
                    </View>
                  )}
                </View>

                {/* Stats Grid */}
                <View className="flex-row gap-3">
                  <View className="flex-1 flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3">
                    <Text className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                      Total Kamar
                    </Text>
                    {isGuest ? (
                      <Text className="font-semibold text-sm text-muted-foreground">•••</Text>
                    ) : (
                      <View className="flex-row items-center gap-2">
                        <MaterialSymbolsSensorDoorOutline
                          width={20}
                          height={20}
                          color={iconColor}
                        />
                        <Text className="font-bold text-lg text-foreground">{kos.totalRooms}</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-1 flex-col gap-1 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <Text className="font-extrabold text-xs uppercase tracking-wider text-primary">
                      Tersedia
                    </Text>
                    {isGuest ? (
                      <Text className="font-semibold text-sm text-muted-foreground">•••</Text>
                    ) : (
                      <View className="flex-row items-center gap-2">
                        <MaterialSymbolsBedIcon width={20} height={20} color={iconColor} />
                        <Text className="font-bold text-lg text-foreground">
                          {kos.availableRooms}{' '}
                          <Text className="text-xs font-normal text-muted-foreground">Kamar</Text>
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Divider */}
                <View className="h-px bg-border" />

                {/* Fasilitas Kamar */}
                {kos.facilities.filter((f) => f in ROOM_FACILITIES).length > 0 && (
                  <View className="flex-col items-center gap-3">
                    <Text className="w-full font-semibold text-base text-foreground">
                      Fasilitas Kamar
                    </Text>
                    {isGuest ? (
                      <View className="w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-8">
                        <Text className="text-sm text-muted-foreground">
                          Masuk untuk melihat fasilitas
                        </Text>
                      </View>
                    ) : (
                      <View
                        className="flex-row flex-wrap"
                        style={{ gap: 16, justifyContent: 'flex-start' }}>
                        {kos.facilities
                          .filter((f) => f in ROOM_FACILITIES)
                          .map((facility, index) => {
                            const facilityData =
                              ROOM_FACILITIES[facility as keyof typeof ROOM_FACILITIES];
                            return (
                              <View
                                key={index}
                                className="flex-col items-center"
                                style={{ width: (width - 10) / 5 }}>
                                <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-muted">
                                  <FacilityIcon
                                    iconName={facilityData.icon}
                                    size={20}
                                    color={mutedColor}
                                  />
                                </View>
                                <Text
                                  className="text-center font-medium text-xs text-muted-foreground"
                                  numberOfLines={2}>
                                  {facilityData.label}
                                </Text>
                              </View>
                            );
                          })}
                      </View>
                    )}
                  </View>
                )}

                {/* Divider */}
                <View className="h-px bg-border" />

                {/* Fasilitas Umum */}
                {kos.facilities.filter((f) => f in COMMON_FACILITIES).length > 0 && (
                  <View className="flex-col items-center gap-3">
                    <Text className="w-full font-semibold text-base text-foreground">
                      Fasilitas Umum
                    </Text>
                    {isGuest ? (
                      <View className="w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-8">
                        <Text className="text-sm text-muted-foreground">
                          Masuk untuk melihat fasilitas
                        </Text>
                      </View>
                    ) : (
                      <View
                        className="flex-row flex-wrap"
                        style={{ gap: 16, justifyContent: 'flex-start' }}>
                        {kos.facilities
                          .filter((f) => f in COMMON_FACILITIES)
                          .map((facility, index) => {
                            const facilityData =
                              COMMON_FACILITIES[facility as keyof typeof COMMON_FACILITIES];
                            return (
                              <View
                                key={index}
                                className="flex-col items-center"
                                style={{ width: (width - 10) / 5 }}>
                                <View className="mb-2 h-10 w-10 items-center justify-center rounded-full bg-muted">
                                  <FacilityIcon
                                    iconName={facilityData.icon}
                                    size={20}
                                    color={mutedColor}
                                  />
                                </View>
                                <Text
                                  className="text-center font-medium text-xs text-muted-foreground"
                                  numberOfLines={2}>
                                  {facilityData.label}
                                </Text>
                              </View>
                            );
                          })}
                      </View>
                    )}
                  </View>
                )}

                {/* Divider */}
                <View className="h-px bg-border" />

                {/* Description */}
                {kos.description && (
                  <View className="flex-col gap-2">
                    <Text className="font-semibold text-base text-foreground">Deskripsi</Text>
                    <Text className="text-sm leading-relaxed text-muted-foreground">
                      {showFullDescription
                        ? kos.description
                        : `${kos.description.slice(0, 150)}${kos.description.length > 150 ? '...' : ''}`}
                      {kos.description.length > 150 && (
                        <Text
                          className="ml-1 font-medium text-primary"
                          onPress={() => setShowFullDescription(!showFullDescription)}>
                          {showFullDescription ? ' Tampilkan lebih sedikit' : ' Baca selengkapnya'}
                        </Text>
                      )}
                    </Text>
                  </View>
                )}

                <View className="h-14" style={{ paddingBottom: insets.bottom + 16 }} />
              </View>
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: 101,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
  },
  handleContainer: {
    zIndex: 10,
    borderWidth: 0,
  },
});

export default KosDetailSheet;
