import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows, Spacing, Typography } from '../../constants/theme';

// Direct integration with @callstack/liquid-glass
let LiquidGlassNative = null;
let isNativeSupported = false;
try {
  const liquidGlassModule = require('@callstack/liquid-glass');
  LiquidGlassNative = liquidGlassModule.LiquidGlassView;
  isNativeSupported = typeof liquidGlassModule.isLiquidGlassSupported === 'function' 
    ? liquidGlassModule.isLiquidGlassSupported() 
    : false;
} catch (e) {
  LiquidGlassNative = null;
  isNativeSupported = false;
}

/**
 * LiquidCanvas
 * Ambient luminous backdrop with dynamic radiant fluid orbs in 
 * Powder Blue (#B4CDED), Yale Blue (#344966), and Dry Sage (#BFCC94).
 * This provides the essential background illumination required for true liquid glass refraction.
 */
export const LiquidCanvas = ({ children, style }) => {
  return (
    <View style={[styles.canvasContainer, style]}>
      {/* Deep Canvas Base */}
      <View style={styles.canvasBase} />

      {/* Luminous Liquid Orbs (Behind glass elements) */}
      <View pointerEvents="none" style={styles.orbsWrapper}>
        {/* Top-Right Yale & Powder Blue Radiant Glow */}
        <View style={[styles.orb, styles.orbTopRight]} />
        
        {/* Mid-Left Dry Sage Caustic Light */}
        <View style={[styles.orb, styles.orbMidLeft]} />
        
        {/* Center Radiant Pulse */}
        <View style={[styles.orb, styles.orbCenter]} />

        {/* Bottom-Right Powder Blue Refractive Pulse */}
        <View style={[styles.orb, styles.orbBottomRight]} />

        {/* Ambient Diagonal Fluid Gradient Mesh */}
        <LinearGradient
          colors={[
            'rgba(52, 73, 102, 0.18)',
            'transparent',
            'rgba(191, 204, 148, 0.08)',
            'rgba(180, 205, 237, 0.12)',
          ]}
          locations={[0, 0.4, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Content rendered on top of illuminated canvas */}
      {children}
    </View>
  );
};

/**
 * LiquidGlassCard
 * iOS 26 style liquid glass container with high refraction, specular highlights,
 * and translucent frosted crystal depth.
 */
export const LiquidGlassCard = ({
  children,
  style,
  tint = 'dark',
  intensity = 45,
  variant = 'default', // 'default' | 'elevated' | 'accent' | 'sage' | 'ultra'
  ...props
}) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'accent':
        return Colors.glassBorderGlow;
      case 'sage':
        return Colors.glassSageBorder;
      default:
        return Colors.glassBorder;
    }
  };

  const getGradientColors = () => {
    switch (variant) {
      case 'sage':
        return ['rgba(191, 204, 148, 0.16)', 'rgba(52, 73, 102, 0.22)', 'rgba(13, 24, 33, 0.45)'];
      case 'accent':
        return ['rgba(180, 205, 237, 0.22)', 'rgba(52, 73, 102, 0.30)', 'rgba(13, 24, 33, 0.45)'];
      case 'ultra':
        return ['rgba(240, 244, 239, 0.14)', 'rgba(180, 205, 237, 0.10)', 'rgba(13, 24, 33, 0.35)'];
      default:
        return ['rgba(180, 205, 237, 0.10)', 'rgba(52, 73, 102, 0.24)', 'rgba(13, 24, 33, 0.42)'];
    }
  };

  // If native @callstack/liquid-glass is supported on iOS 26, leverage it directly
  if (isNativeSupported && LiquidGlassNative) {
    return (
      <LiquidGlassNative
        effect="regular"
        interactive
        style={[
          styles.cardOuter,
          { borderColor: getBorderColor() },
          webGlassStyle,
          style,
        ]}
        {...props}
      >
        <View style={styles.topSpecularHighlight} />
        <View style={styles.cardContent}>{children}</View>
      </LiquidGlassNative>
    );
  }

  return (
    <View
      style={[
        styles.cardOuter,
        { borderColor: getBorderColor() },
        webGlassStyle,
        style,
      ]}
      {...props}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? intensity : 70}
        tint={tint}
        style={styles.blurContainer}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.gradientFill}
        >
          {/* Top Specular Rim Reflection */}
          <View style={styles.topSpecularHighlight} />
          {children}
        </LinearGradient>
      </BlurView>
    </View>
  );
};

/**
 * LiquidGlassButton
 * Fluid liquid action pill with specular refraction and glowing Powder Blue / Dry Sage
 */
export const LiquidGlassButton = ({
  title,
  icon: Icon,
  onPress,
  disabled,
  loading,
  variant = 'primary', // 'primary' | 'sage' | 'secondary' | 'glass'
  style,
  textStyle,
  ...props
}) => {
  const getGradientColors = () => {
    switch (variant) {
      case 'sage':
        return Colors.gradientSageGlow;
      case 'secondary':
        return Colors.gradientButton;
      case 'glass':
        return ['rgba(180, 205, 237, 0.22)', 'rgba(52, 73, 102, 0.38)'];
      default:
        return Colors.gradientPrimary;
    }
  };

  const getTextColor = () => {
    if (variant === 'primary' || variant === 'sage') return Colors.inkBlack;
    return Colors.porcelain;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        styles.buttonWrapper,
        variant === 'sage' && Shadows.sageGlow,
        variant === 'primary' && Shadows.glow,
        disabled && styles.btnDisabled,
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        style={styles.buttonGradient}
      >
        {/* Specular button sheen */}
        <View style={styles.buttonSpecular} />
        {Icon ? <Icon size={17} color={getTextColor()} strokeWidth={2.4} /> : null}
        <Text style={[styles.buttonText, { color: getTextColor() }, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

/**
 * LiquidGlassBadge
 * Translucent frosted capsule tag with glowing specular borders
 */
export const LiquidGlassBadge = ({
  label,
  icon: Icon,
  variant = 'powder', // 'powder' | 'sage' | 'yale' | 'neutral'
  active = false,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'sage':
        return {
          bg: active ? Colors.drySage : 'rgba(191, 204, 148, 0.16)',
          border: active ? Colors.drySage : Colors.glassSageBorder,
          text: active ? Colors.inkBlack : Colors.drySage,
          iconColor: active ? Colors.inkBlack : Colors.drySage,
        };
      case 'yale':
        return {
          bg: active ? Colors.yaleBlue : 'rgba(52, 73, 102, 0.35)',
          border: active ? Colors.powderBlue : Colors.glassBorder,
          text: Colors.porcelain,
          iconColor: Colors.powderBlue,
        };
      default:
        return {
          bg: active ? Colors.powderBlue : 'rgba(180, 205, 237, 0.14)',
          border: active ? Colors.powderBlue : Colors.glassBorder,
          text: active ? Colors.inkBlack : Colors.powderBlue,
          iconColor: active ? Colors.inkBlack : Colors.powderBlue,
        };
    }
  };

  const badgeStyle = getStyles();
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.badge,
        { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
        webGlassPillStyle,
        style,
      ]}
      {...props}
    >
      {Icon ? <Icon size={12} color={badgeStyle.iconColor} strokeWidth={2.5} /> : null}
      <Text style={[styles.badgeText, { color: badgeStyle.text }, textStyle]}>{label}</Text>
    </Wrapper>
  );
};

/**
 * LiquidGlassInput
 * Translucent text input with refractive border outline and frosted glass base
 */
export const LiquidGlassInput = ({
  value,
  onChangeText,
  placeholder,
  icon: Icon,
  style,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.inputContainer, webGlassStyle, style]}>
      {Icon ? <Icon size={16} color={Colors.powderBlue} style={styles.inputIcon} /> : null}
      <TextInput
        style={[styles.inputField, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </View>
  );
};

// Web-specific glassmorphism style rules for modern web browsers
const webGlassStyle = Platform.OS === 'web' ? {
  backdropFilter: 'blur(30px) saturate(210%)',
  WebkitBackdropFilter: 'blur(30px) saturate(210%)',
  boxShadow: '0 12px 36px 0 rgba(0, 0, 0, 0.45), inset 0 1px 1.5px 0 rgba(240, 244, 239, 0.35)',
} : {};

const webGlassPillStyle = Platform.OS === 'web' ? {
  backdropFilter: 'blur(18px) saturate(180%)',
  WebkitBackdropFilter: 'blur(18px) saturate(180%)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(240, 244, 239, 0.3)',
} : {};

const styles = StyleSheet.create({
  canvasContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.inkBlack,
    overflow: 'hidden',
  },
  canvasBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D1821',
  },
  orbsWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbTopRight: {
    top: -60,
    right: -40,
    width: 320,
    height: 320,
    backgroundColor: '#344966',
    opacity: 0.85,
    ...(Platform.OS === 'web' ? { filter: 'blur(75px)' } : {}),
  },
  orbMidLeft: {
    top: 220,
    left: -70,
    width: 290,
    height: 290,
    backgroundColor: '#BFCC94',
    opacity: 0.40,
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : {}),
  },
  orbCenter: {
    top: '42%',
    right: '20%',
    width: 280,
    height: 280,
    backgroundColor: '#344966',
    opacity: 0.55,
    ...(Platform.OS === 'web' ? { filter: 'blur(85px)' } : {}),
  },
  orbBottomRight: {
    bottom: 50,
    right: -30,
    width: 280,
    height: 280,
    backgroundColor: '#B4CDED',
    opacity: 0.42,
    ...(Platform.OS === 'web' ? { filter: 'blur(75px)' } : {}),
  },
  cardOuter: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.2,
    ...Shadows.card,
  },
  cardContent: {
    padding: Spacing.md,
  },
  blurContainer: {
    width: '100%',
  },
  gradientFill: {
    padding: Spacing.md,
  },
  topSpecularHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.2,
    backgroundColor: 'rgba(240, 244, 239, 0.45)',
  },
  buttonWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  buttonSpecular: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(240, 244, 239, 0.45)',
  },
  buttonText: {
    fontSize: Typography.sm + 1,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 4.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: Typography.xs - 1,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 73, 102, 0.25)',
    borderWidth: 1.2,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    ...Shadows.subtle,
  },
  inputIcon: {
    marginRight: Spacing.xs + 2,
  },
  inputField: {
    flex: 1,
    color: Colors.porcelain,
    fontSize: Typography.sm,
  },
});
