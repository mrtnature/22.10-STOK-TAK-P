export const COLORS = {
  primary: '#1E3A8A', // Navy blue
  primaryLight: '#3B82F6',
  primaryDark: '#1E40AF',
  accent: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#F9FAFB',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: COLORS.text,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: COLORS.textSecondary,
  },
};
