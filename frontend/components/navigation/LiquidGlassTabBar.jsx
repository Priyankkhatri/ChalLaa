import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LiquidGlassView } from '../liquid-glass';
import * as Haptics from 'expo-haptics';
import { Compass, ListChecks, User } from 'lucide-react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';

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
 * Next-gen iOS 26 Liquid Glass floating bottom navigation bar
 * Powered by react-native-liquid-glassmorphism.
 */
export default function LiquidGlassTabBar({ state, descriptors, navigation }) {
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
        {/* Ambient Inner Refraction Sheen */}
        <View style={styles.tabBarInner}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
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
                activeOpacity={0.75}
                style={styles.tabItem}
              >
                {/* Active Luminous Capsule Indicator */}
                {isFocused && (
                  <LinearGradient
                    colors={['rgba(180, 205, 237, 0.22)', 'rgba(52, 73, 102, 0.28)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.activeCapsule}
                  />
                )}

                {/* Tab Icon with Specular Sheen */}
                <View style={isFocused ? styles.activeIconGlow : null}>
                  <Icon
                    size={20}
                    color={isFocused ? Colors.powderBlue : 'rgba(180, 205, 237, 0.45)'}
                    strokeWidth={isFocused ? 2.6 : 2}
                  />
                </View>

                {/* Tab Label */}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
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
const webGlassStyle = Platform.OS === 'web' ? {
  backdropFilter: 'blur(36px) saturate(220%)',
  WebkitBackdropFilter: 'blur(36px) saturate(220%)',
  boxShadow: '0 20px 48px 0 rgba(0, 0, 0, 0.70), 0 0 20px 0 rgba(180, 205, 237, 0.18), inset 0 1.5px 2px 0 rgba(240, 244, 239, 0.55), inset 0 -1px 2px 0 rgba(52, 73, 102, 0.40)',
  borderColor: 'rgba(180, 205, 237, 0.38)',
  borderWidth: 1.2,
} : {};

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
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(180, 205, 237, 0.38)',
    borderTopColor: 'rgba(240, 244, 239, 0.60)',
    ...Shadows.glow,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
    paddingHorizontal: Spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
    paddingVertical: 4,
    gap: 3,
  },
  activeCapsule: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    right: 6,
    borderRadius: 22,
    backgroundColor: 'rgba(180, 205, 237, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(180, 205, 237, 0.45)',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 0 16px rgba(180, 205, 237, 0.30)',
    } : {}),
  },
  activeIconGlow: {
    shadowColor: Colors.powderBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    ...(Platform.OS === 'web' ? {
      filter: 'drop-shadow(0 0 8px rgba(180, 205, 237, 0.8))',
    } : {}),
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
