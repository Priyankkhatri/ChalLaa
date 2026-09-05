import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows, Spacing, Typography } from '../../constants/theme';

/**
 * LiquidGlassCard
 * iOS 26 style frosted glass container with refractive specular border
 */
export const LiquidGlassCard = ({
  children,
  style,
  tint = 'dark',
  intensity = 35,
  variant = 'default', // 'default' | 'elevated' | 'accent' | 'sage'
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

  return (
    <View style={[styles.cardOuter, { borderColor: getBorderColor() }, style]} {...props}>
      <BlurView
        intensity={Platform.OS === 'ios' ? intensity : 50}
        tint={tint}
        style={styles.blurContainer}
      >
        <LinearGradient
          colors={[
            variant === 'sage' ? 'rgba(191, 204, 148, 0.12)' : 'rgba(52, 73, 102, 0.45)',
            'rgba(13, 24, 33, 0.65)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.gradientFill}
        >
          {/* Subtle top-edge light specular reflection */}
          <View style={styles.topSpecularHighlight} />
          {children}
        </LinearGradient>
      </BlurView>
    </View>
  );
};

/**
 * LiquidGlassButton
 * High-gloss fluid action button with glowing powder blue or dry sage gradients
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
        return ['rgba(180, 205, 237, 0.18)', 'rgba(52, 73, 102, 0.35)'];
      default:
        return Colors.gradientPrimary;
    }
  };

  const getTextColor = () => {
    if (variant === 'primary') return Colors.inkBlack;
    if (variant === 'sage') return Colors.inkBlack;
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
        {Icon ? <Icon size={17} color={getTextColor()} strokeWidth={2.3} /> : null}
        <Text style={[styles.buttonText, { color: getTextColor() }, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

/**
 * LiquidGlassBadge
 * Translucent frosted tag for statuses, filters, and karma chips
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
          bg: active ? Colors.drySage : Colors.secondaryLight,
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
          bg: active ? Colors.powderBlue : Colors.primaryLight,
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
        style,
      ]}
      {...props}
    >
      {Icon ? <Icon size={12} color={badgeStyle.iconColor} strokeWidth={2.4} /> : null}
      <Text style={[styles.badgeText, { color: badgeStyle.text }, textStyle]}>{label}</Text>
    </Wrapper>
  );
};

/**
 * LiquidGlassInput
 * Translucent text input with refractive border outline
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
    <View style={[styles.inputContainer, style]}>
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

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...Shadows.card,
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
    height: 1,
    backgroundColor: 'rgba(240, 244, 239, 0.28)',
  },
  buttonWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
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
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: Typography.xs - 1,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassBackground,
    borderWidth: 1,
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
