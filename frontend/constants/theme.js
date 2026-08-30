export const Colors = {
  // Brand Gradients & Accents
  primary: '#4F46E5', // Indigo
  primaryDark: '#3730A3',
  primaryLight: '#EEF2FF',
  primaryMuted: '#818CF8',
  primaryGradient: ['#4F46E5', '#6366F1', '#8B5CF6'],

  // Secondary Mint / Emerald
  secondary: '#10B981',
  secondaryDark: '#047857',
  secondaryLight: '#ECFDF5',
  secondaryGradient: ['#10B981', '#059669'],

  // Amber / Karma Gold
  accent: '#F59E0B',
  accentDark: '#B45309',
  accentLight: '#FEF3C7',
  accentGradient: ['#F59E0B', '#D97706'],

  // Coral / Danger
  danger: '#EF4444',
  dangerDark: '#B91C1C',
  dangerLight: '#FEE2E2',

  // Modern Neutral Surface
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardAlt: '#F1F5F9',
  cardBorder: '#E2E8F0',
  darkCard: '#0F172A',

  // Typography
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#6366F1',

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
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
};
