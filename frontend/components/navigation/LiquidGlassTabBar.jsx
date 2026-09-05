import React, { useRef, useEffect, useState, useCallback } from 'react';
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
import { Compass, ListChecks, User, Sparkles } from 'lucide-react-native';
import { Colors, Shadows } from '../../constants/theme';

const TAB_CONFIG = {
  index: {
    label: 'Campus Feed',
    icon: Compass,
    badge: null,
  },
  'my-errands': {
    label: 'My Errands',
    icon: ListChecks,
    badge: '2', // Active errand tasks badge
  },
  profile: {
    label: 'Profile',
    icon: User,
    badge: null,
  },
};

/**
 * LiquidGlassTabBar
 * Ultra-Interactive Apple iOS 26 / Linear Liquid Glass Floating Tab Navigation
 * 
 * Key Features:
 * - Fluid hold-and-slide gesture with real-time velocity stretch and dynamic tilt
 * - Frictionless magnetic latching to tabs with subtle haptic micro-bursts
 * - Robust dual-platform event architecture: global window pointer capture on web + native PanResponder
 * - Zero-layout-jump initial positioning
 * - Interactive desktop magnetic hover states and tactile icon spring bounces
 * - Multi-layer liquid glass styling: specular top rim reflection, caustic backdrops, and Royal Cobalt mercury core
 */
export default function LiquidGlassTabBar({ state, descriptors, navigation }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeDragIndex, setActiveDragIndex] = useState(state.index);
  const [hoveredTabIndex, setHoveredTabIndex] = useState(null);

  const numTabs = state.routes.length;
  const tabWidth = containerWidth > 0 ? (containerWidth - 8) / numTabs : 0;

  // Animated values for fluid mercury bubble
  const translateX = useRef(new Animated.Value(0)).current;
  const bubbleScaleX = useRef(new Animated.Value(1)).current;
  const bubbleScaleY = useRef(new Animated.Value(1)).current;
  const bubbleRotate = useRef(new Animated.Value(0)).current; // -1 to 1 mapped to degrees

  // Tab icon micro-bounce animators
  const iconScales = useRef(
    state.routes.map(() => new Animated.Value(1))
  ).current;

  // State refs for gesture handling
  const isInitialized = useRef(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragInitialTranslateX = useRef(0);
  const hasMoved = useRef(false);
  const lastHoveredIndex = useRef(state.index);
  const lastClientX = useRef(0);
  const lastTime = useRef(0);
  const currentVelocityX = useRef(0);

  // Trigger tactile icon bounce
  const triggerIconBounce = useCallback((index) => {
    if (iconScales[index]) {
      Animated.sequence([
        Animated.timing(iconScales[index], {
          toValue: 0.85,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(iconScales[index], {
          toValue: 1.18,
          friction: 4,
          tension: 110,
          useNativeDriver: true,
        }),
        Animated.spring(iconScales[index], {
          toValue: 1.0,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [iconScales]);

  // Sync bubble position when route changes externally or on initial layout
  useEffect(() => {
    setActiveDragIndex(state.index);
    lastHoveredIndex.current = state.index;

    if (tabWidth > 0) {
      const targetX = state.index * tabWidth + 4;
      if (!isInitialized.current) {
        // Immediate placement on first layout to eliminate jump/glitch
        translateX.setValue(targetX);
        isInitialized.current = true;
      } else if (!isDragging.current) {
        // Smooth fluid spring transition
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: targetX,
            useNativeDriver: true,
            tension: 88,
            friction: 9,
          }),
          Animated.sequence([
            Animated.timing(bubbleScaleX, {
              toValue: 1.16,
              duration: 90,
              useNativeDriver: true,
            }),
            Animated.spring(bubbleScaleX, {
              toValue: 1.0,
              friction: 5,
              tension: 95,
              useNativeDriver: true,
            }),
          ]),
          Animated.spring(bubbleScaleY, {
            toValue: 1.0,
            friction: 5,
            tension: 95,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleRotate, {
            toValue: 0,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
          }),
        ]).start();
        triggerIconBounce(state.index);
      }
    }
  }, [state.index, tabWidth, triggerIconBounce]);

  // Navigate to target tab safely
  const navigateToTab = useCallback((targetIndex) => {
    if (targetIndex >= 0 && targetIndex < numTabs) {
      setActiveDragIndex(targetIndex);
      triggerIconBounce(targetIndex);

      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {}
      }

      const targetRoute = state.routes[targetIndex];
      if (targetIndex !== state.index) {
        navigation.navigate(targetRoute.name);
      }
    }
  }, [numTabs, state.index, state.routes, navigation, triggerIconBounce]);

  // ==========================================
  // WEB DESKTOP POINTER GESTURES (FLUID & ROBUST)
  // ==========================================
  const handlePointerDown = useCallback((e) => {
    if (Platform.OS !== 'web' || tabWidth <= 0) return;

    isDragging.current = true;
    hasMoved.current = false;
    dragStartX.current = e.clientX;
    lastClientX.current = e.clientX;
    lastTime.current = Date.now();
    currentVelocityX.current = 0;

    // Current bubble translation
    dragInitialTranslateX.current = state.index * tabWidth + 4;

    // Liquid surface tension elongation
    Animated.parallel([
      Animated.spring(bubbleScaleX, {
        toValue: 1.22,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(bubbleScaleY, {
        toValue: 0.90,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Attach global window listeners so dragging outside the bar never gets stuck
    const handleGlobalPointerMove = (moveEvt) => {
      if (!isDragging.current || tabWidth <= 0) return;

      const clientX = moveEvt.clientX;
      const deltaX = clientX - dragStartX.current;

      if (Math.abs(deltaX) > 4) {
        hasMoved.current = true;
      }

      // Compute velocity for dynamic stretch and tilt
      const now = Date.now();
      const dt = Math.max(1, now - lastTime.current);
      const dx = clientX - lastClientX.current;
      const vel = dx / dt; // px per ms
      lastClientX.current = clientX;
      lastTime.current = now;
      currentVelocityX.current = vel;

      // Bound with rubber band resistance
      let newX = dragInitialTranslateX.current + deltaX;
      const minX = 4;
      const maxX = (numTabs - 1) * tabWidth + 4;

      if (newX < minX) {
        newX = minX - Math.pow(Math.abs(newX - minX), 0.68);
      } else if (newX > maxX) {
        newX = maxX + Math.pow(newX - maxX, 0.68);
      }

      translateX.setValue(newX);

      // Tilt and stretch based on velocity
      const clampedVel = Math.max(-2.5, Math.min(2.5, vel));
      bubbleRotate.setValue(clampedVel * 0.4);

      // Detect hovered tab item
      const relativeX = newX - 4;
      const hoveredIndex = Math.max(
        0,
        Math.min(numTabs - 1, Math.round(relativeX / tabWidth))
      );

      if (hoveredIndex !== lastHoveredIndex.current) {
        lastHoveredIndex.current = hoveredIndex;
        setActiveDragIndex(hoveredIndex);
      }
    };

    const handleGlobalPointerUp = (upEvt) => {
      if (!isDragging.current) return;
      isDragging.current = false;

      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);

      if (tabWidth <= 0) return;

      const clientX = upEvt.clientX;
      const deltaX = clientX - dragStartX.current;

      // If it was just a tiny click/tap without drag movement, don't override the tab click
      if (!hasMoved.current && Math.abs(deltaX) <= 4) {
        Animated.parallel([
          Animated.spring(bubbleScaleX, {
            toValue: 1.0,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleScaleY, {
            toValue: 1.0,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleRotate, {
            toValue: 0,
            friction: 6,
            tension: 90,
            useNativeDriver: true,
          }),
        ]).start();
        return;
      }

      // Drag release: calculate final target index with momentum
      const currentPos = dragInitialTranslateX.current + deltaX;
      const momentumOffset = currentVelocityX.current * 42;
      let targetIndex = Math.round((currentPos - 4 + momentumOffset) / tabWidth);
      targetIndex = Math.max(0, Math.min(numTabs - 1, targetIndex));

      // Jelly bounce snap animation
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: targetIndex * tabWidth + 4,
          tension: 92,
          friction: 7.8,
          useNativeDriver: true,
        }),
        Animated.spring(bubbleScaleX, {
          toValue: 1.0,
          friction: 4.8,
          tension: 95,
          useNativeDriver: true,
        }),
        Animated.spring(bubbleScaleY, {
          toValue: 1.0,
          friction: 4.8,
          tension: 95,
          useNativeDriver: true,
        }),
        Animated.spring(bubbleRotate, {
          toValue: 0,
          friction: 5.5,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();

      navigateToTab(targetIndex);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
  }, [tabWidth, state.index, numTabs, navigateToTab, bubbleRotate, bubbleScaleX, bubbleScaleY, translateX]);

  // Clean up any stray window listeners if component unmounts
  useEffect(() => {
    return () => {
      isDragging.current = false;
    };
  }, []);

  // ==========================================
  // MOBILE PANRESPONDER GESTURES (iOS / Android)
  // ==========================================
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Platform.OS !== 'web',
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Platform.OS !== 'web' && Math.abs(gestureState.dx) > 6,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Platform.OS !== 'web' && Math.abs(gestureState.dx) > 6,
      onPanResponderGrant: () => {
        isDragging.current = true;
        hasMoved.current = false;
        Animated.parallel([
          Animated.spring(bubbleScaleX, {
            toValue: 1.24,
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
      onPanResponderMove: (_, gestureState) => {
        if (tabWidth <= 0) return;
        hasMoved.current = true;

        const basePos = state.index * tabWidth + 4;
        let newX = basePos + gestureState.dx;

        const minX = 4;
        const maxX = (numTabs - 1) * tabWidth + 4;
        if (newX < minX) {
          newX = minX - Math.pow(Math.abs(newX - minX), 0.70);
        } else if (newX > maxX) {
          newX = maxX + Math.pow(newX - maxX, 0.70);
        }

        translateX.setValue(newX);

        const relativeX = newX - 4;
        const hoveredIndex = Math.max(
          0,
          Math.min(numTabs - 1, Math.round(relativeX / tabWidth))
        );

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
        isDragging.current = false;
        if (tabWidth <= 0) return;

        const currentPos = state.index * tabWidth + 4 + gestureState.dx;
        let targetIndex = Math.round(
          (currentPos - 4 + gestureState.vx * 38) / tabWidth
        );
        targetIndex = Math.max(0, Math.min(numTabs - 1, targetIndex));

        Animated.parallel([
          Animated.spring(translateX, {
            toValue: targetIndex * tabWidth + 4,
            tension: 85,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleScaleX, {
            toValue: 1.0,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.spring(bubbleScaleY, {
            toValue: 1.0,
            friction: 5,
            tension: 90,
            useNativeDriver: true,
          }),
        ]).start();

        navigateToTab(targetIndex);
      },
    })
  ).current;

  // Interpolate dynamic tilt rotation
  const tiltInterpolate = bubbleRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-3.2deg', '0deg', '3.2deg'],
  });

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <LiquidGlassView
        variant="regular"
        tintColor="rgba(255, 255, 255, 0.85)"
        borderRadius={34}
        interactive={true}
        intensity={70}
        rim={true}
        style={[styles.glassPill, webGlassStyle]}
      >
        {/* Specular Top Rim Prismatic Glow */}
        <View style={styles.specularTopRim} pointerEvents="none" />

        {/* Ambient Subtle Caustic Reflection Fields */}
        <View style={styles.causticBackdrop} pointerEvents="none">
          <View style={styles.causticOrbSky} />
          <View style={styles.causticOrbLilac} />
        </View>

        {/* Tab Bar Inner Container & Track */}
        <View
          style={styles.tabBarInner}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
          {...(Platform.OS === 'web' ? { onPointerDown: handlePointerDown } : {})}
        >
          {/* Fluid Sliding Royal Cobalt Mercury Capsule */}
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
                    { rotate: tiltInterpolate },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.mercuryGradient}
              >
                {/* Specular White Highlight Arc */}
                <View style={styles.mercuryCrest} />
                {/* Inner Light Flare */}
                <View style={styles.mercuryInnerGlow} />
              </LinearGradient>
            </Animated.View>
          )}

          {/* Interactive Tab Items */}
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const isHoveredOrActive = activeDragIndex === index;
            const isMouseHovered = hoveredTabIndex === index && !isHoveredOrActive;
            const config = TAB_CONFIG[route.name] || {
              label: options.title || route.name,
              icon: Compass,
              badge: null,
            };
            const Icon = config.icon;

            const handleTabPress = () => {
              if (isDragging.current && hasMoved.current) return;
              navigateToTab(index);
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel || config.label}
                accessibilityHint={`Switches active tab to ${config.label}`}
                testID={options.tabBarTestID || `tab-${route.name}`}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={handleTabPress}
                activeOpacity={0.88}
                style={[
                  styles.tabItem,
                  isMouseHovered && styles.tabItemMouseHover,
                ]}
                {...(Platform.OS === 'web'
                  ? {
                      onMouseEnter: () => setHoveredTabIndex(index),
                      onMouseLeave: () => setHoveredTabIndex(null),
                    }
                  : {})}
              >
                {/* Subtle Desktop Mouse Hover Background Pill */}
                {isMouseHovered && (
                  <View style={styles.hoverBackgroundPill} pointerEvents="none" />
                )}

                {/* Tab Icon with Micro-Bounce Scale */}
                <Animated.View
                  style={[
                    styles.iconWrapper,
                    isHoveredOrActive ? styles.activeIconGlow : null,
                    { transform: [{ scale: iconScales[index] || 1 }] },
                  ]}
                >
                  <Icon
                    size={20}
                    color={isHoveredOrActive ? '#FFFFFF' : isMouseHovered ? '#1E293B' : '#64748B'}
                    strokeWidth={isHoveredOrActive ? 2.4 : 1.9}
                  />

                  {/* Sleek Notification Badge / Active Indicator */}
                  {config.badge && (
                    <View
                      style={[
                        styles.badgeContainer,
                        isHoveredOrActive ? styles.badgeContainerActive : styles.badgeContainerInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isHoveredOrActive ? styles.badgeTextActive : styles.badgeTextInactive,
                        ]}
                      >
                        {config.badge}
                      </Text>
                    </View>
                  )}
                </Animated.View>

                {/* Tab Label */}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    isHoveredOrActive
                      ? styles.tabLabelActive
                      : isMouseHovered
                      ? styles.tabLabelHovered
                      : styles.tabLabelInactive,
                  ]}
                >
                  {config.label}
                </Text>

                {/* Active Indicator Micro-Glow Dot */}
                {isFocused && (
                  <View
                    style={[
                      styles.activeDot,
                      { opacity: isHoveredOrActive ? 1 : 0 },
                    ]}
                  />
                )}
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
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        boxShadow:
          '0 24px 52px 0 rgba(15, 23, 42, 0.12), 0 4px 14px 0 rgba(15, 23, 42, 0.04), inset 0 1.5px 2px 0 #FFFFFF, inset 0 -1px 2px 0 rgba(0, 0, 0, 0.03)',
        borderColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1.2,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }
    : {};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 18,
    right: 18,
    alignItems: 'center',
    zIndex: 9999,
  },
  glassPill: {
    width: '100%',
    maxWidth: 540,
    height: 66,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderTopColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    ...Shadows.glass,
  },
  specularTopRim: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 1,
    zIndex: 3,
    ...(Platform.OS === 'web' ? { filter: 'blur(0.5px)' } : {}),
  },
  causticBackdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 34,
  },
  causticOrbSky: {
    position: 'absolute',
    top: -16,
    left: '20%',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    ...(Platform.OS === 'web' ? { filter: 'blur(24px)' } : {}),
  },
  causticOrbLilac: {
    position: 'absolute',
    bottom: -18,
    right: '20%',
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: 'rgba(99, 102, 241, 0.10)',
    ...(Platform.OS === 'web' ? { filter: 'blur(22px)' } : {}),
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
    touchAction: 'none',
  },
  mercuryBubble: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderTopColor: 'rgba(255, 255, 255, 0.90)',
    zIndex: 1,
    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0 8px 24px rgba(37, 99, 235, 0.42), 0 2px 6px rgba(37, 99, 235, 0.20), inset 0 1px 2px rgba(255, 255, 255, 0.65)',
        }
      : {}),
  },
  mercuryGradient: {
    flex: 1,
    borderRadius: 26,
    position: 'relative',
  },
  mercuryCrest: {
    position: 'absolute',
    top: 1,
    left: '18%',
    right: '18%',
    height: 1.8,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  mercuryInnerGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(29, 78, 216, 0.25)',
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
    ...(Platform.OS === 'web' ? { transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)' } : {}),
  },
  tabItemMouseHover: {
    transform: [{ scale: 1.03 }],
  },
  hoverBackgroundPill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 4,
    right: 4,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.60)',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconGlow: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.50,
    shadowRadius: 10,
    ...(Platform.OS === 'web'
      ? {
          filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.40))',
        }
      : {}),
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3.5,
    borderWidth: 1.2,
  },
  badgeContainerActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2563EB',
  },
  badgeContainerInactive: {
    backgroundColor: '#2563EB',
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  badgeTextActive: {
    color: '#2563EB',
  },
  badgeTextInactive: {
    color: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
    marginTop: 1,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabLabelHovered: {
    color: '#0F172A',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#64748B',
    fontWeight: '600',
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.85,
  },
});
