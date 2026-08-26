// Design tokens matching the web app's dark theme
export const Colors = {
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

  // Gradients (used as array in LinearGradient)
  gradientHero: ['#4f46e5', '#7c3aed'] as [string, string],
  gradientCard: ['#1e1e2a', '#252535'] as [string, string],
};

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
