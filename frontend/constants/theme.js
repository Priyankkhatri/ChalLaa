/**
 * ChalLaa iOS 26 Liquid Glass Design System
 * Apple / Linear Light Liquid Glass Theme
 * 
 * Curated Palette:
 * - Alabaster Mist: #F4F6F9 (Soft, modern, non-blinding canvas)
 * - Crystalline Glass: rgba(255, 255, 255, 0.78) (Frosted white liquid glass)
 * - Electric Royal Cobalt: #2563EB (Crisp, high-trust primary brand accent)
 * - Slate Charcoal: #0F172A (Razor sharp, highly readable typography)
 * - Fresh Emerald Mint: #10B981 (Karma rewards, currency ₹, & verified badges)
 */

export const Colors = {
  // 5-Color Core System
  inkBlack: '#F6F8FB',        // Soft Alabaster Canvas Base (Neither blinding nor dingy)
  yaleBlue: '#FFFFFF',        // Pure Crystalline Glass Surface
  powderBlue: '#2563EB',      // Electric Royal Cobalt (High-trust primary brand accent)
  porcelain: '#0F172A',       // Slate 900 (High-Contrast Crisp Primary Text)
  drySage: '#059669',         // Emerald Green (Clean karma rewards & verified badges)

  // Brand Mapping
  primary: '#2563EB',         // Royal Cobalt
  primaryDark: '#1D4ED8',     // Deep Cobalt
  primaryDeep: '#0F172A',     // Slate 900
  primaryLight: 'rgba(37, 99, 235, 0.08)',
  primaryMuted: 'rgba(37, 99, 235, 0.45)',

  // Secondary / Accent (Mint Emerald for badges, karma rewards, offers)
  secondary: '#10B981',
  secondaryDark: '#059669',
  secondaryLight: 'rgba(16, 185, 129, 0.10)',

  // Liquid Glass Material Layers
  glassBackground: 'rgba(255, 255, 255, 0.82)',       // Frosted crystalline light glass
  glassBackgroundLight: 'rgba(255, 255, 255, 0.94)',  // Crisp white surface
  glassBackgroundDark: 'rgba(241, 245, 249, 0.90)',   // Subtle slate tinted glass
  glassBorder: 'rgba(255, 255, 255, 0.95)',          // Specular frosted white rim
  glassBorderLight: 'rgba(226, 232, 240, 0.85)',      // Hairline slate boundary
  glassBorderGlow: 'rgba(37, 99, 235, 0.35)',         // Royal Blue focus glow
  glassSageBorder: 'rgba(16, 185, 129, 0.30)',        // Mint border
  glassHighlight: '#FFFFFF',                          // Specular top rim

  // Gradients for liquid materials
  gradientGlass: ['rgba(255, 255, 255, 0.96)', 'rgba(248, 250, 252, 0.85)'],
  gradientGlassCard: ['rgba(255, 255, 255, 0.96)', 'rgba(241, 245, 249, 0.88)'],
  gradientHero: ['#FFFFFF', '#F8FAFC', '#F1F5F9'],
  gradientPrimary: ['#3B82F6', '#2563EB'],            // Electric Royal Cobalt
  gradientButton: ['#2563EB', '#1D4ED8'],
  gradientAccent: ['#10B981', '#059669'],             // Fresh Emerald Mint
  gradientActivePill: ['#3B82F6', '#2563EB'],
  gradientSageGlow: ['#10B981', '#059669'],

  // Neutrals & Surfaces
  background: '#F6F8FB',      // Soft Alabaster Mist
  backgroundSecondary: '#EDF2F7',
  card: 'rgba(255, 255, 255, 0.88)',
  cardAlt: 'rgba(241, 245, 249, 0.85)',
  cardBorder: 'rgba(226, 232, 240, 0.85)',
  darkCard: '#FFFFFF',

  // Typography
  text: '#0F172A',            // Slate 900
  textSecondary: '#2563EB',   // Royal Blue
  textMuted: '#64748B',       // Slate 500
  textLight: '#94A3B8',       // Slate 400

  border: 'rgba(226, 232, 240, 0.85)',
  borderLight: 'rgba(255, 255, 255, 0.95)',
  borderFocus: '#2563EB',

  // Status & Feedback
  success: '#059669',
  successBg: 'rgba(16, 185, 129, 0.10)',
  warning: '#D97706',
  warningBg: 'rgba(245, 158, 11, 0.10)',
  danger: '#DC2626',
  dangerBg: 'rgba(239, 68, 68, 0.10)',
  dangerLight: 'rgba(239, 68, 68, 0.10)',
  dangerDark: '#991B1B',

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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  glass: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  glow: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 7,
  },
  sageGlow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 6,
  },
};
