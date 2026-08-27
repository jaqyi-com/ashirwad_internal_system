// Design tokens — Dark & Light palettes
export const darkColors = {
  // Backgrounds
  bgPrimary:    '#0f0f13',
  bgSecondary:  '#16161f',
  bgCard:       '#1e1e2a',
  bgCardHover:  '#252535',

  // Borders
  border:       '#2a2a3d',
  borderLight:  '#3a3a55',

  // Text
  textPrimary:  '#e8e8f0',
  textSecondary:'#9191a8',
  textMuted:    '#5a5a72',

  // Accent
  accent:       '#6366f1',
  accentLight:  '#818cf8',
  accentGlow:   'rgba(99,102,241,0.12)',
  purple:       '#8b5cf6',

  // Status
  green:        '#10b981',
  greenLight:   '#34d399',
  red:          '#ef4444',
  redLight:     '#f87171',
  yellow:       '#f59e0b',
  blue:         '#3b82f6',
  orange:       '#f97316',

  // Tab bar
  tabBar:       '#1a1a26',
  tabBarBorder: '#2a2a3d',

  // Gradients
  gradientHero: ['#4f46e5', '#7c3aed'] as [string, string],
  gradientCard: ['#1e1e2a', '#252535'] as [string, string],
};

export const lightColors = {
  // Backgrounds
  bgPrimary:    '#f4f4fb',
  bgSecondary:  '#ebebf8',
  bgCard:       '#ffffff',
  bgCardHover:  '#f0f0fa',

  // Borders
  border:       '#dcdcf0',
  borderLight:  '#c8c8e8',

  // Text
  textPrimary:  '#111128',
  textSecondary:'#4a4a6a',
  textMuted:    '#9090b0',

  // Accent
  accent:       '#6366f1',
  accentLight:  '#4f46e5',
  accentGlow:   'rgba(99,102,241,0.10)',
  purple:       '#7c3aed',

  // Status
  green:        '#059669',
  greenLight:   '#10b981',
  red:          '#dc2626',
  redLight:     '#ef4444',
  yellow:       '#d97706',
  blue:         '#2563eb',
  orange:       '#ea580c',

  // Tab bar
  tabBar:       '#ffffff',
  tabBarBorder: '#dcdcf0',

  // Gradients
  gradientHero: ['#4f46e5', '#7c3aed'] as [string, string],
  gradientCard: ['#ffffff', '#f0f0fa'] as [string, string],
};

// Default export keeps backward-compat for any files not yet migrated
export const Colors = darkColors;

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  full: 999,
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
};
