import { Platform } from 'react-native';

// Theme tokens following React Native course module conventions
export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8FAFC',
    tint: '#2563EB',
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#2563EB',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0F172A',
    tint: '#3B82F6',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#3B82F6',
  },
  primary: '#2563EB', // Blue 600
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  secondary: '#10B981', // Emerald 500 (success / runner active)
  secondaryDark: '#059669',
  accent: '#F59E0B', // Amber (pending / warnings)
  danger: '#EF4444', // Red (errors / cancel)
  background: '#F8FAFC', // Slate 50
  card: '#FFFFFF',
  text: '#0F172A', // Slate 900
  textSecondary: '#64748B', // Slate 500
  textMuted: '#94A3B8', // Slate 400
  border: '#E2E8F0', // Slate 200
  borderLight: '#F1F5F9',
  white: '#FFFFFF',
  black: '#000000',
  successBg: '#ECFDF5',
  warningBg: '#FFFBEB',
  dangerBg: '#FEF2F2',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const Typography = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
};

export const Fonts = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier',
    rounded: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
    bold: 'Roboto-Bold',
    mono: 'monospace',
    rounded: 'Roboto',
  },
  default: {
    regular: 'sans-serif',
    medium: 'sans-serif-medium',
    bold: 'sans-serif',
    mono: 'monospace',
    rounded: 'sans-serif',
  },
});
