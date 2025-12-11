/**
 * GoShopperAI Design System
 * 
 * A comprehensive design system following modern mobile UI patterns
 * Inspired by clean fintech/delivery app designs
 * 
 * Color Distribution:
 * - Primary (60%): Deep Navy Blue #1E3A5F
 * - Secondary (30%): Off-White/Light #F5F7FA  
 * - Accent (10%): Gold #D4AF37
 */

// ============================================
// COLOR PALETTE
// ============================================
export const Colors = {
  // Primary colors
  primary: '#1E3A5F',
  primaryDark: '#152A45',
  primaryLight: '#2D4A6F',
  
  // Secondary/Background colors
  secondary: '#F5F7FA',
  secondaryDark: '#E8ECF0',
  
  // Accent colors
  accent: '#D4AF37',
  accentLight: '#E5C65C',
  accentDark: '#B8972E',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Text colors
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    tertiary: '#94A3B8',
    inverse: '#FFFFFF',
    accent: '#D4AF37',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F7FA',
    tertiary: '#E8ECF0',
    dark: '#1E3A5F',
  },
  
  // Border colors
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    dark: '#94A3B8',
  },
  
  // Status colors
  status: {
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
  },
  
  // Gradient presets
  gradients: {
    primary: ['#1E3A5F', '#152A45'],
    accent: ['#D4AF37', '#B8972E'],
    card: ['#FFFFFF', '#F5F7FA'],
  },
  
  // Shadow colors
  shadow: {
    light: 'rgba(30, 58, 95, 0.08)',
    medium: 'rgba(30, 58, 95, 0.12)',
    dark: 'rgba(30, 58, 95, 0.20)',
    accent: 'rgba(212, 175, 55, 0.25)',
  },
  
  // Overlay
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },
};

// ============================================
// TYPOGRAPHY
// ============================================
export const Typography = {
  // Font families (system fonts for performance)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  
  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// ============================================
// SPACING
// ============================================
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// ============================================
// BORDER RADIUS
// ============================================
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  base: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// ============================================
// SHADOWS
// ============================================
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: Colors.shadow.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  accent: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ============================================
// ANIMATION CONFIGS
// ============================================
export const Animations = {
  // Duration in milliseconds
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
  },
  
  // Spring configs for react-native Animated
  spring: {
    gentle: {
      tension: 40,
      friction: 7,
    },
    bouncy: {
      tension: 50,
      friction: 5,
    },
    stiff: {
      tension: 100,
      friction: 10,
    },
    wobbly: {
      tension: 180,
      friction: 12,
    },
  },
  
  // Easing curves
  easing: {
    default: 'ease-in-out',
    in: 'ease-in',
    out: 'ease-out',
    linear: 'linear',
  },
};

// ============================================
// LAYOUT
// ============================================
export const Layout = {
  // Screen padding
  screenPadding: {
    horizontal: Spacing.base,
    vertical: Spacing.lg,
  },
  
  // Card styles
  card: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  
  // Button heights
  buttonHeight: {
    sm: 36,
    md: 44,
    lg: 52,
    xl: 60,
  },
  
  // Input heights
  inputHeight: {
    sm: 40,
    md: 48,
    lg: 56,
  },
  
  // Icon sizes
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },
  
  // Tab bar
  tabBar: {
    height: 80,
    iconSize: 24,
  },
  
  // Header
  header: {
    height: 56,
  },
  
  // Bottom sheet
  bottomSheet: {
    borderRadius: BorderRadius['2xl'],
    handleWidth: 40,
    handleHeight: 4,
  },
};

// ============================================
// COMPONENT STYLES (Reusable)
// ============================================
export const ComponentStyles = {
  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  
  // Card base
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.md,
  },
  
  // Elevated card
  cardElevated: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  
  // Primary button
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.base,
    height: Layout.buttonHeight.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Shadows.md,
  },
  
  // Secondary button
  buttonSecondary: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.base,
    height: Layout.buttonHeight.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  
  // Accent button
  buttonAccent: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.base,
    height: Layout.buttonHeight.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Shadows.accent,
  },
  
  // Text input
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.base,
    height: Layout.inputHeight.md,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  
  // Section header
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  
  // List item
  listItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.white,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  
  // Badge
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.md,
  },
  
  // Icon container
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Avatar
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

// ============================================
// TEXT STYLES
// ============================================
export const TextStyles = {
  // Headings
  h1: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize['4xl'] * Typography.lineHeight.tight,
  },
  h2: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize['3xl'] * Typography.lineHeight.tight,
  },
  h3: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize['2xl'] * Typography.lineHeight.tight,
  },
  h4: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.normal,
  },
  
  // Body text
  bodyLg: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.normal,
  },
  body: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.primary,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },
  bodySm: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
  },
  
  // Captions
  caption: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.tertiary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  captionBold: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  
  // Labels
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
  },
  labelSm: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.tertiary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    textTransform: 'uppercase' as const,
    letterSpacing: Typography.letterSpacing.wide,
  },
  
  // Special
  price: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  priceAccent: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent,
  },
  link: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
    textDecorationLine: 'underline' as const,
  },
};

// ============================================
// ICON NAMES (Using common icon libraries)
// ============================================
export const IconNames = {
  // Navigation
  home: 'home',
  history: 'clock',
  stats: 'bar-chart-2',
  items: 'package',
  profile: 'user',
  settings: 'settings',
  
  // Actions
  scan: 'camera',
  search: 'search',
  add: 'plus',
  edit: 'edit-2',
  delete: 'trash-2',
  share: 'share',
  filter: 'filter',
  sort: 'sliders',
  
  // Status
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'x-circle',
  info: 'info',
  
  // UI
  arrowRight: 'chevron-right',
  arrowLeft: 'chevron-left',
  arrowUp: 'chevron-up',
  arrowDown: 'chevron-down',
  close: 'x',
  menu: 'menu',
  more: 'more-horizontal',
  
  // Features
  receipt: 'file-text',
  price: 'tag',
  savings: 'trending-down',
  alert: 'bell',
  location: 'map-pin',
  store: 'shopping-bag',
  calendar: 'calendar',
  wallet: 'credit-card',
};

// Default export
export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animations,
  Layout,
  ComponentStyles,
  TextStyles,
  IconNames,
};
