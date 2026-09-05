/**
 * ChalLaa Modern Campus Design Tokens
 * Harmonious color palettes, typography scale, borders, and glassmorphism shadows.
 */
export const Colors = {
  // Brand Primary: Electric Indigo & Violet
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryDeep: '#3730A3',
  primaryLight: '#EEF2FF',
  primaryMuted: '#A5B4FC',

  // Secondary: Neon Emerald & Mint
  secondary: '#10B981',
  secondaryDark: '#059669',
  secondaryLight: '#ECFDF5',

  // Accent & Actions: Sunburst Amber & Electric Coral
  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: '#FEF3C7',

  coral: '#F43F5E',
  coralLight: '#FFE4E6',

  cyan: '#06B6D4',
  cyanLight: '#ECFEFF',

  purple: '#8B5CF6',
  purpleLight: '#F5F3FF',

  // Gradients (Multi-stop arrays for LinearGradient)
  gradientPrimary: ['#6366F1', '#8B5CF6', '#A855F7'],
  gradientHero: ['#4338CA', '#6366F1', '#8B5CF6'],
  gradientSuccess: ['#10B981', '#059669'],
  gradientAccent: ['#F59E0B', '#EF4444'],
  gradientDark: ['#0F172A', '#1E1B4B', '#312E81'],

  // Neutrals & Surfaces
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',
  cardBorder: '#E2E8F0',
  darkCard: '#0F172A',

  // Typography
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#6366F1',

  // Status
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  dangerLight: '#FEE2E2',
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
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
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
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
};
