// Design tokens — Obsidian Dark & Crisp Porcelain Light palettes
export const darkColors = {
  // Backgrounds
  bgPrimary:    '#09090d',
  bgSecondary:  '#12121a',
  bgCard:       '#161622',
  bgCardHover:  '#1e1e2d',
  bgGlass:      'rgba(22, 22, 34, 0.85)',

  // Borders
  border:       '#242436',
  borderLight:  '#32324a',
  borderGlass:  'rgba(255, 255, 255, 0.08)',

  // Text
  textPrimary:  '#f4f4f8',
  textSecondary:'#a0a0b8',
  textMuted:    '#686882',

  // Accent
  accent:       '#6366f1',
  accentLight:  '#818cf8',
  accentGlow:   'rgba(99, 102, 241, 0.16)',
  accentSurface:'#1e1b4b',
  purple:       '#8b5cf6',
  purpleGlow:   'rgba(139, 92, 246, 0.16)',

  // Status Colors
  green:        '#10b981',
  greenLight:   '#34d399',
  greenGlow:    'rgba(16, 185, 129, 0.14)',
  red:          '#ef4444',
  redLight:     '#f87171',
  redGlow:      'rgba(239, 68, 68, 0.14)',
  yellow:       '#f59e0b',
  amber:        '#f59e0b',
  yellowGlow:   'rgba(245, 158, 11, 0.14)',
  blue:         '#3b82f6',
  blueGlow:     'rgba(59, 130, 246, 0.14)',
  orange:       '#f97316',
  bgHover:      '#1e1e2d',

  // Tab bar
  tabBar:       '#12121a',
  tabBarBorder: '#202030',

  // Gradients
  gradientHero:    ['#3730a3', '#6d28d9', '#4f46e5'] as [string, string, string],
  gradientPrimary: ['#6366f1', '#8b5cf6'] as [string, string],
  gradientSuccess: ['#059669', '#10b981'] as [string, string],
  gradientCard:    ['#161622', '#1b1b2a'] as [string, string],
  gradientBanner:  ['#1e1b4b', '#31104b'] as [string, string],
};

export const lightColors = {
  // Backgrounds
  bgPrimary:    '#f8fafc',
  bgSecondary:  '#f1f5f9',
  bgCard:       '#ffffff',
  bgCardHover:  '#f8fafc',
  bgGlass:      'rgba(255, 255, 255, 0.9)',

  // Borders
  border:       '#e2e8f0',
  borderLight:  '#cbd5e1',
  borderGlass:  'rgba(0, 0, 0, 0.06)',

  // Text
  textPrimary:  '#0f172a',
  textSecondary:'#475569',
  textMuted:    '#94a3b8',

  // Accent
  accent:       '#6366f1',
  accentLight:  '#4f46e5',
  accentGlow:   'rgba(99, 102, 241, 0.12)',
  accentSurface:'#e0e7ff',
  purple:       '#7c3aed',
  purpleGlow:   'rgba(124, 58, 237, 0.12)',

  // Status Colors
  green:        '#059669',
  greenLight:   '#10b981',
  greenGlow:    'rgba(5, 150, 105, 0.12)',
  red:          '#dc2626',
  redLight:     '#ef4444',
  redGlow:      'rgba(220, 38, 38, 0.12)',
  yellow:       '#d97706',
  amber:        '#d97706',
  yellowGlow:   'rgba(217, 119, 6, 0.12)',
  blue:         '#2563eb',
  blueGlow:     'rgba(37, 99, 235, 0.12)',
  orange:       '#ea580c',
  bgHover:      '#f1f5f9',

  // Tab bar
  tabBar:       '#ffffff',
  tabBarBorder: '#e2e8f0',

  // Gradients
  gradientHero:    ['#4f46e5', '#7c3aed', '#6366f1'] as [string, string, string],
  gradientPrimary: ['#6366f1', '#8b5cf6'] as [string, string],
  gradientSuccess: ['#059669', '#10b981'] as [string, string],
  gradientCard:    ['#ffffff', '#f8fafc'] as [string, string],
  gradientBanner:  ['#e0e7ff', '#ede9fe'] as [string, string],
};

// Default export keeps backward-compat
export const Colors = darkColors;

export const Radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  26,
  full: 999,
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  }),
};

