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
 * Ultra-interactive iOS 26 Liquid Glass floating bottom navigation bar.
 * Features:
 * - Real-time gesture slide & drag (touch & hold to glide the liquid mercury bubble)
 * - Fluid velocity-based squash & stretch physics
 * - Smooth spring transitions between tabs
 * - Optical caustic refraction & specular crest reflections
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
          tension: 72,
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

  // Touch & Hold Gesture PanResponder (Slide & Glide)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 8,
      onPanResponderGrant: () => {
        // Morph into fluid mercury mode: stretch horizontally, compress vertically
        Animated.parallel([
          Animated.spring(bubbleScaleX, {
            toValue: 1.22,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleScaleY, {
            toValue: 0.92,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (tabWidth <= 0) return;

        const basePos = state.index * tabWidth + 4;
        let newX = basePos + gestureState.dx;

        // Apply fluid elasticity resistance beyond bar bounds
        const minX = 4;
        const maxX = (numTabs - 1) * tabWidth + 4;
        if (newX < minX) {
          newX = minX - Math.pow(Math.abs(newX - minX), 0.72);
        } else if (newX > maxX) {
          newX = maxX + Math.pow(newX - maxX, 0.72);
        }

        translateX.setValue(newX);

        // Detect hovered tab under finger
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

        // Snap bubble to nearest tab with liquid spring
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: targetIndex * tabWidth + 4,
            tension: 78,
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

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <LiquidGlassView
        variant="regular"
        tintColor="rgba(13, 24, 33, 0.72)"
        borderRadius={32}
        interactive={true}
        intensity={65}
        rim={true}
        style={[styles.glassPill, webGlassStyle]}
      >
        {/* Ambient Caustic Underglow Fields */}
        <View style={styles.causticBackdrop} pointerEvents="none">
          <View style={styles.causticOrbBlue} />
          <View style={styles.causticOrbSage} />
        </View>

        {/* Tab Bar Inner Container & Gesture Track */}
        <View
          style={styles.tabBarInner}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          {...panResponder.panHandlers}
        >
          {/* Fluid Sliding Mercury Bubble */}
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
                colors={[
                  'rgba(180, 205, 237, 0.32)',
                  'rgba(52, 73, 102, 0.52)',
                  'rgba(24, 38, 56, 0.68)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.mercuryGradient}
              >
                {/* Specular Curved Highlight Crest */}
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
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                activeOpacity={0.78}
                style={styles.tabItem}
              >
                {/* Tab Icon with Dynamic Powder Blue Glow */}
                <View style={isHovered ? styles.activeIconGlow : null}>
                  <Icon
                    size={21}
                    color={
                      isHovered
                        ? Colors.powderBlue
                        : 'rgba(180, 205, 237, 0.45)'
                    }
                    strokeWidth={isHovered ? 2.6 : 1.9}
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
        backdropFilter: 'blur(36px) saturate(220%)',
        WebkitBackdropFilter: 'blur(36px) saturate(220%)',
        boxShadow:
          '0 20px 48px 0 rgba(0, 0, 0, 0.70), 0 0 24px 0 rgba(180, 205, 237, 0.20), inset 0 1.5px 2px 0 rgba(240, 244, 239, 0.60), inset 0 -1px 2px 0 rgba(52, 73, 102, 0.40)',
        borderColor: 'rgba(180, 205, 237, 0.40)',
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
    borderColor: 'rgba(180, 205, 237, 0.38)',
    borderTopColor: 'rgba(240, 244, 239, 0.65)',
    ...Shadows.glow,
  },
  causticBackdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 32,
  },
  causticOrbBlue: {
    position: 'absolute',
    top: -12,
    left: '25%',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(180, 205, 237, 0.12)',
    ...(Platform.OS === 'web' ? { filter: 'blur(22px)' } : {}),
  },
  causticOrbSage: {
    position: 'absolute',
    bottom: -15,
    right: '25%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(191, 204, 148, 0.10)',
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
  },
  mercuryBubble: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(180, 205, 237, 0.55)',
    borderTopColor: 'rgba(240, 244, 239, 0.85)',
    zIndex: 1,
    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0 0 20px rgba(180, 205, 237, 0.35), inset 0 1px 2px rgba(240, 244, 239, 0.75), inset 0 -1px 2px rgba(52, 73, 102, 0.50)',
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
    backgroundColor: 'rgba(240, 244, 239, 0.75)',
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
  },
  activeIconGlow: {
    shadowColor: Colors.powderBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 12,
    ...(Platform.OS === 'web'
      ? {
          filter: 'drop-shadow(0 0 8px rgba(180, 205, 237, 0.85))',
        }
      : {}),
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: Colors.porcelain,
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: 'rgba(240, 244, 239, 0.55)',
    fontWeight: '600',
  },
});
