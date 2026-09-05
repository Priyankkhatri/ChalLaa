import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassView } from '../liquid-glass';
import * as Haptics from 'expo-haptics';
import { Compass, ListChecks, User } from 'lucide-react-native';
import { Colors, Shadows, Spacing } from '../../constants/theme';

const TAB_CONFIG = {
  index: {
    label: 'Campus Feed',
    icon: Compass,
  },
  'my-errands': {
    label: 'My Errands',
    icon: ListChecks,
  },
  profile: {
    label: 'Profile',
    icon: User,
  },
};

/**
 * LiquidGlassTabBar
 * Ultra-crisp iOS 26 Light Liquid Glass floating bottom navigation bar
 * Theme: Apple / Linear Light Liquid Glass (Royal Cobalt & Crystalline White)
 * 
 * Features:
 * - Real-time hold-and-slide: glide finger/cursor smoothly to switch between tabs
 * - Velocity-aware squash-and-stretch fluid mercury physics
 * - High-contrast Royal Blue active capsule over crystalline frosted glass
 * - Crisp Slate 900 typography and haptic touch feedback
 */
export default function LiquidGlassTabBar({ state, descriptors, navigation }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeDragIndex, setActiveDragIndex] = useState(state.index);

  const numTabs = state.routes.length;
  const tabWidth = containerWidth > 0 ? (containerWidth - 8) / numTabs : 0;

  // Animated values for the liquid mercury bubble
  const translateX = useRef(new Animated.Value(0)).current;
  const bubbleScaleX = useRef(new Animated.Value(1)).current;
  const bubbleScaleY = useRef(new Animated.Value(1)).current;
  const lastHoveredIndex = useRef(state.index);

  // Sync bubble position when state.index changes
  useEffect(() => {
    setActiveDragIndex(state.index);
    lastHoveredIndex.current = state.index;

    if (tabWidth > 0) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: state.index * tabWidth + 4,
          useNativeDriver: true,
          tension: 78,
          friction: 8.5,
        }),
        Animated.sequence([
          Animated.timing(bubbleScaleX, {
            toValue: 1.15,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleScaleX, {
            toValue: 1,
            friction: 5,
            tension: 85,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [state.index, tabWidth]);

  // Touch & Drag PanResponder (Native & Web Touch)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 3,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 3,
      onPanResponderGrant: () => {
        Animated.parallel([
          Animated.spring(bubbleScaleX, {
            toValue: 1.25,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleScaleY, {
            toValue: 0.90,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (tabWidth <= 0) return;

        const basePos = state.index * tabWidth + 4;
        let newX = basePos + gestureState.dx;

        // Fluid boundary elasticity
        const minX = 4;
        const maxX = (numTabs - 1) * tabWidth + 4;
        if (newX < minX) {
          newX = minX - Math.pow(Math.abs(newX - minX), 0.72);
        } else if (newX > maxX) {
          newX = maxX + Math.pow(newX - maxX, 0.72);
        }

        translateX.setValue(newX);

        // Detect hovered tab
        const relativeX = newX - 4;
        const rawIndex = Math.round(relativeX / tabWidth);
        const hoveredIndex = Math.max(0, Math.min(numTabs - 1, rawIndex));

        if (hoveredIndex !== lastHoveredIndex.current) {
          lastHoveredIndex.current = hoveredIndex;
          setActiveDragIndex(hoveredIndex);
          if (Platform.OS !== 'web') {
            try {
              Haptics.selectionAsync();
            } catch (e) {}
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (tabWidth <= 0) return;

        const currentPos = state.index * tabWidth + 4 + gestureState.dx;
        let targetIndex = Math.round(
          (currentPos - 4 + gestureState.vx * 36) / tabWidth
        );
        targetIndex = Math.max(0, Math.min(numTabs - 1, targetIndex));

        Animated.parallel([
          Animated.spring(translateX, {
            toValue: targetIndex * tabWidth + 4,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleScaleX, {
            toValue: 1,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleScaleY, {
            toValue: 1,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
        ]).start();

        setActiveDragIndex(targetIndex);

        if (targetIndex !== state.index) {
          if (Platform.OS !== 'web') {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (e) {}
          }
          const targetRoute = state.routes[targetIndex];
          navigation.navigate(targetRoute.name);
        }
      },
    })
  ).current;

  // Web-specific pointer drag support for desktop browsers
  const isPointerDragging = useRef(false);
  const pointerStartX = useRef(0);
  const pointerBaseX = useRef(0);

  const handlePointerDown = (e) => {
    if (Platform.OS !== 'web' || tabWidth <= 0) return;
    isPointerDragging.current = true;
    pointerStartX.current = e.clientX || 0;
    pointerBaseX.current = state.index * tabWidth + 4;

    Animated.parallel([
      Animated.spring(bubbleScaleX, {
        toValue: 1.25,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleScaleY, {
        toValue: 0.90,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePointerMove = (e) => {
    if (Platform.OS !== 'web' || !isPointerDragging.current || tabWidth <= 0) return;
    const clientX = e.clientX || 0;
    const deltaX = clientX - pointerStartX.current;
    let newX = pointerBaseX.current + deltaX;

    const minX = 4;
    const maxX = (numTabs - 1) * tabWidth + 4;
    if (newX < minX) newX = minX - Math.pow(Math.abs(newX - minX), 0.72);
    else if (newX > maxX) newX = maxX + Math.pow(newX - maxX, 0.72);

    translateX.setValue(newX);

    const relativeX = newX - 4;
    const rawIndex = Math.round(relativeX / tabWidth);
    const hoveredIndex = Math.max(0, Math.min(numTabs - 1, rawIndex));

    if (hoveredIndex !== lastHoveredIndex.current) {
      lastHoveredIndex.current = hoveredIndex;
      setActiveDragIndex(hoveredIndex);
    }
  };

  const handlePointerUp = (e) => {
    if (Platform.OS !== 'web' || !isPointerDragging.current || tabWidth <= 0) return;
    isPointerDragging.current = false;
    const clientX = e.clientX || 0;
    const deltaX = clientX - pointerStartX.current;
    const finalX = pointerBaseX.current + deltaX;

    const targetIndex = Math.max(
      0,
      Math.min(numTabs - 1, Math.round((finalX - 4) / tabWidth))
    );

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetIndex * tabWidth + 4,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleScaleX, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleScaleY, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveDragIndex(targetIndex);

    if (targetIndex !== state.index) {
      const targetRoute = state.routes[targetIndex];
      navigation.navigate(targetRoute.name);
    }
  };

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <LiquidGlassView
        variant="regular"
        tintColor="rgba(255, 255, 255, 0.82)"
        borderRadius={32}
        interactive={true}
        intensity={65}
        rim={true}
        style={[styles.glassPill, webGlassStyle]}
      >
        {/* Ambient Subtle Caustic Fields */}
        <View style={styles.causticBackdrop} pointerEvents="none">
          <View style={styles.causticOrbSky} />
          <View style={styles.causticOrbLilac} />
        </View>

        {/* Tab Bar Inner Container & Gesture Track */}
        <View
          style={styles.tabBarInner}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          {...panResponder.panHandlers}
          {...(Platform.OS === 'web'
            ? {
                onPointerDown: handlePointerDown,
                onPointerMove: handlePointerMove,
                onPointerUp: handlePointerUp,
                onPointerLeave: handlePointerUp,
              }
            : {})}
        >
          {/* Fluid Sliding Royal Cobalt Mercury Bubble */}
          {tabWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.mercuryBubble,
                {
                  width: tabWidth,
                  transform: [
                    { translateX },
                    { scaleX: bubbleScaleX },
                    { scaleY: bubbleScaleY },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.mercuryGradient}
              >
                {/* Specular Pure White Highlight Crest */}
                <View style={styles.mercuryCrest} />
              </LinearGradient>
            </Animated.View>
          )}

          {/* Interactive Tab Items */}
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const isHovered = activeDragIndex === index;
            const config = TAB_CONFIG[route.name] || {
              label: options.title || route.name,
              icon: Compass,
            };
            const Icon = config.icon;

            const onPress = () => {
              if (Platform.OS !== 'web') {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
              }

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel || config.label}
                accessibilityHint={`Switches active tab to ${config.label}`}
                testID={options.tabBarTestID || `tab-${route.name}`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={onPress}
                activeOpacity={0.82}
                style={[styles.tabItem, isHovered && styles.tabItemHovered]}
              >
                {/* Tab Icon */}
                <View style={isHovered ? styles.activeIconGlow : null}>
                  <Icon
                    size={20}
                    color={isHovered ? '#FFFFFF' : '#64748B'}
                    strokeWidth={isHovered ? 2.5 : 2.0}
                  />
                </View>

                {/* Tab Label */}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    isHovered
                      ? styles.tabLabelActive
                      : styles.tabLabelInactive,
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LiquidGlassView>
    </View>
  );
}

// Web-specific glassmorphism style rules for high-fidelity browser refraction
const webGlassStyle =
  Platform.OS === 'web'
    ? {
        backdropFilter: 'blur(36px) saturate(190%)',
        WebkitBackdropFilter: 'blur(36px) saturate(190%)',
        boxShadow:
          '0 20px 48px 0 rgba(15, 23, 42, 0.12), 0 2px 10px 0 rgba(15, 23, 42, 0.04), inset 0 1.5px 2px 0 #FFFFFF, inset 0 -1px 2px 0 rgba(0, 0, 0, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1.2,
      }
    : {};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  glassPill: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderTopColor: '#FFFFFF',
    ...Shadows.glass,
  },
  causticBackdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 32,
  },
  causticOrbSky: {
    position: 'absolute',
    top: -12,
    left: '25%',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    ...(Platform.OS === 'web' ? { filter: 'blur(22px)' } : {}),
  },
  causticOrbLilac: {
    position: 'absolute',
    bottom: -15,
    right: '25%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    ...(Platform.OS === 'web' ? { filter: 'blur(20px)' } : {}),
  },
  tabBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    position: 'relative',
    paddingHorizontal: 4,
    cursor: 'pointer',
  },
  mercuryBubble: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.50)',
    borderTopColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 1,
    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0 6px 20px rgba(37, 99, 235, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.60)',
        }
      : {}),
  },
  mercuryGradient: {
    flex: 1,
    borderRadius: 24,
    position: 'relative',
  },
  mercuryCrest: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    paddingVertical: 5,
    gap: 3,
    zIndex: 2,
    transition: 'transform 0.15s ease',
  },
  tabItemHovered: {
    transform: [{ scale: 1.04 }],
  },
  activeIconGlow: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 8,
    ...(Platform.OS === 'web'
      ? {
          filter: 'drop-shadow(0 2px 6px rgba(37, 99, 235, 0.30))',
        }
      : {}),
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.15,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#64748B',
    fontWeight: '600',
  },
});
