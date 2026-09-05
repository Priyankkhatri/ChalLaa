/**
 * ChalLaa iOS 26 Liquid Glass Design System
 * Inspired by callstack/liquid-glass material design.
 * 
 * Curated Palette:
 * - Ink Black: #0D1821 (Deep ambient canvas & contrast)
 * - Yale Blue: #344966 (Oceanic slate, card base & translucent glass tint)
 * - Powder Blue: #B4CDED (Liquid glass sheen, specular highlights & active glow)
 * - Porcelain: #F0F4EF (Crisp typography & high-contrast elements)
 * - Dry Sage: #BFCC94 (Organic sage green, karma ratings & verified badges)
 */

export const Colors = {
  // 5-Color Core System
  inkBlack: '#0D1821',
  yaleBlue: '#344966',
  powderBlue: '#B4CDED',
  porcelain: '#F0F4EF',
  drySage: '#BFCC94',

  // Brand Mapping
  primary: '#B4CDED',        // Powder Blue highlight
  primaryDark: '#344966',    // Yale Blue
  primaryDeep: '#0D1821',    // Ink Black
  primaryLight: 'rgba(180, 205, 237, 0.15)',
  primaryMuted: 'rgba(180, 205, 237, 0.5)',

  // Secondary / Accent (Sage Green for karma, verification, success)
  secondary: '#BFCC94',
  secondaryDark: '#8A9A5B',
  secondaryLight: 'rgba(191, 204, 148, 0.18)',

  // Liquid Glass Material Layers
  glassBackground: 'rgba(52, 73, 102, 0.42)',       // Yale Blue translucent
  glassBackgroundLight: 'rgba(240, 244, 239, 0.08)', // Porcelain translucent
  glassBackgroundDark: 'rgba(13, 24, 33, 0.72)',     // Ink Black translucent
  glassBorder: 'rgba(180, 205, 237, 0.32)',          // Powder Blue specular reflection
  glassBorderLight: 'rgba(240, 244, 239, 0.22)',     // Porcelain subtle edge
  glassBorderGlow: 'rgba(180, 205, 237, 0.55)',      // Powder Blue intense refraction
  glassSageBorder: 'rgba(191, 204, 148, 0.45)',      // Dry Sage border
  glassHighlight: 'rgba(255, 255, 255, 0.18)',

  // Gradients for liquid materials
  gradientGlass: ['rgba(52, 73, 102, 0.65)', 'rgba(13, 24, 33, 0.85)'],
  gradientGlassCard: ['rgba(52, 73, 102, 0.5)', 'rgba(28, 42, 60, 0.65)'],
  gradientHero: ['#344966', '#1a283a', '#0D1821'],
  gradientPrimary: ['#B4CDED', '#82A8D8'],
  gradientButton: ['#344966', '#26374e'],
  gradientAccent: ['#BFCC94', '#9EAD72'],
  gradientActivePill: ['#B4CDED', '#9cbde4'],
  gradientSageGlow: ['#BFCC94', '#8A9A5B'],

  // Neutrals & Surfaces
  background: '#0D1821',      // Deep Ink Black
  backgroundSecondary: '#121F2B',
  card: 'rgba(52, 73, 102, 0.38)',
  cardAlt: 'rgba(180, 205, 237, 0.07)',
  cardBorder: 'rgba(180, 205, 237, 0.25)',
  darkCard: '#0D1821',

  // Typography
  text: '#F0F4EF',            // Porcelain
  textSecondary: '#B4CDED',   // Powder Blue
  textMuted: 'rgba(240, 244, 239, 0.55)',
  textLight: '#F0F4EF',

  border: 'rgba(180, 205, 237, 0.2)',
  borderLight: 'rgba(240, 244, 239, 0.1)',
  borderFocus: '#B4CDED',

  // Status & Feedback
  success: '#BFCC94',
  successBg: 'rgba(191, 204, 148, 0.15)',
  warning: '#E0A96D',
  warningBg: 'rgba(224, 169, 109, 0.15)',
  danger: '#E06D6D',
  dangerBg: 'rgba(224, 109, 109, 0.15)',
  dangerLight: 'rgba(224, 109, 109, 0.15)',
  dangerDark: '#C94A4A',

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
    shadowColor: '#B4CDED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  glow: {
    shadowColor: '#B4CDED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  },
  sageGlow: {
    shadowColor: '#BFCC94',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 7,
  },
};
