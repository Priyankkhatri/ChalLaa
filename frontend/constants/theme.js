/**
 * ChalLaa iOS 26 Liquid Glass Design System
 * Option 4: Campus Espresso & Warm Amber Theme
 * 
 * Curated Palette:
 * - Roasted Espresso: #12100E (Deep rich warm canvas & contrast)
 * - Smoked Mocha: #2C221E (Warm dark walnut, card base & translucent glass tint)
 * - Honey Amber: #F59E0B / #FBBF24 (Liquid gold sheen, specular highlights & active glow)
 * - Vanilla Cream: #FDFBF7 (Warm crisp typography & high-contrast elements)
 * - Warm Terracotta: #E06D53 (Warm terracotta for delivery alerts, active runners & badges)
 */

export const Colors = {
  // 5-Color Core System
  inkBlack: '#12100E',        // Deep Roasted Espresso
  yaleBlue: '#2C221E',        // Smoked Mocha / Warm Walnut
  powderBlue: '#F59E0B',      // Honey Amber (Primary Brand Glow)
  porcelain: '#FDFBF7',       // Vanilla Cream (Primary Typography)
  drySage: '#E06D53',         // Warm Terracotta / Amber Cinnamon

  // Brand Mapping
  primary: '#F59E0B',         // Honey Amber
  primaryDark: '#B45309',     // Deep Amber
  primaryDeep: '#12100E',     // Roasted Espresso
  primaryLight: 'rgba(245, 158, 11, 0.18)',
  primaryMuted: 'rgba(245, 158, 11, 0.55)',

  // Secondary / Accent (Warm Terracotta for alerts, ratings, rewards)
  secondary: '#E06D53',
  secondaryDark: '#C2410C',
  secondaryLight: 'rgba(224, 109, 83, 0.18)',

  // Liquid Glass Material Layers
  glassBackground: 'rgba(44, 34, 30, 0.55)',         // Smoked Mocha translucent
  glassBackgroundLight: 'rgba(253, 251, 247, 0.08)', // Vanilla Cream translucent
  glassBackgroundDark: 'rgba(18, 16, 14, 0.78)',     // Roasted Espresso translucent
  glassBorder: 'rgba(245, 158, 11, 0.38)',           // Honey Amber specular reflection
  glassBorderLight: 'rgba(253, 251, 247, 0.22)',     // Vanilla Cream subtle edge
  glassBorderGlow: 'rgba(251, 191, 36, 0.60)',       // Honey Gold intense refraction
  glassSageBorder: 'rgba(224, 109, 83, 0.45)',       // Terracotta border
  glassHighlight: 'rgba(253, 251, 247, 0.25)',

  // Gradients for liquid materials
  gradientGlass: ['rgba(54, 40, 32, 0.70)', 'rgba(20, 16, 14, 0.85)'],
  gradientGlassCard: ['rgba(50, 38, 32, 0.58)', 'rgba(30, 22, 18, 0.72)'],
  gradientHero: ['#2C221E', '#1F1815', '#12100E'],
  gradientPrimary: ['#FBBF24', '#F59E0B'],
  gradientButton: ['#F59E0B', '#D97706'],
  gradientAccent: ['#E06D53', '#C2410C'],
  gradientActivePill: ['#FBBF24', '#F59E0B'],
  gradientSageGlow: ['#E06D53', '#B45309'],

  // Neutrals & Surfaces
  background: '#12100E',      // Deep Roasted Espresso
  backgroundSecondary: '#1A1614',
  card: 'rgba(44, 34, 30, 0.48)',
  cardAlt: 'rgba(245, 158, 11, 0.08)',
  cardBorder: 'rgba(245, 158, 11, 0.26)',
  darkCard: '#12100E',

  // Typography
  text: '#FDFBF7',            // Vanilla Cream
  textSecondary: '#F59E0B',   // Honey Amber
  textMuted: 'rgba(253, 251, 247, 0.60)',
  textLight: '#FDFBF7',

  border: 'rgba(245, 158, 11, 0.22)',
  borderLight: 'rgba(253, 251, 247, 0.12)',
  borderFocus: '#F59E0B',

  // Status & Feedback
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  dangerDark: '#B91C1C',

  white: '#FFFFFF',
  black: '#000000',
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 34,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  full: 9999,
};

export const Shadows = {
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 6,
  },
  glass: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },
  glow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.50,
    shadowRadius: 26,
    elevation: 8,
  },
  sageGlow: {
    shadowColor: '#E06D53',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.42,
    shadowRadius: 20,
    elevation: 7,
  },
};
