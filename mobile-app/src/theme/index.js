// BuildTrack AI Mobile Theme
// Clean Light Theme — Professional SaaS aesthetic for construction tracking

export const Colors = {
  // Brand & Accents
  primary: '#A9B8C9',       // Soft Steel Blue
  primaryDark: '#94A3B8',
  primaryLight: '#CBD5E1',
  secondary: '#9AA6B2',     // Muted Blue Grey
  accent: '#64748B',

  // Background hierarchy
  bgBase: '#F8FAFC',        // Primary Base Color (Light Grey-Blue)
  bgCard: '#FFFFFF',        // Pure White Cards
  bgInput: '#F1F5F9',       // Soft Grey-Blue for inputs
  bgOverlay: 'rgba(30, 41, 59, 0.4)',

  // Text
  textPrimary: '#1E293B',   // Dark Text (Navy-Grey)
  textSecondary: '#64748B', // Light Text (Muted Grey)
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status
  success: '#10B981',       // Soft Emerald
  successBg: '#ECFDF5',
  warning: '#F59E0B',       // Soft Amber
  warningBg: '#FFFBEB',
  danger: '#EF4444',        // Soft Red
  dangerBg: '#FEF2F2',
  info: '#3B82F6',          // Soft Blue
  infoBg: '#EFF6FF',

  // Utility
  border: '#E2E8F0',        // Very subtle borders
  divider: '#F1F5F9',       // Clean separators
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Typography = {
  // Font Families (Assuming Inter is available or defaults to system)
  fontFamily: 'Inter',

  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,

  // Weights
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
};
