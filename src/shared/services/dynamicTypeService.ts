/**
 * Dynamic Type Service
 * 
 * Handles accessibility font scaling based on system settings.
 * Respects iOS Dynamic Type and Android font scaling preferences.
 */

import {PixelRatio, Platform, AccessibilityInfo} from 'react-native';

// Base font sizes (design system defaults at 1x scale)
const BASE_FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
};

// Base spacing values
const BASE_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
};

// Min/max scale factors to prevent extreme scaling
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.5;

// Scale factor for spacing (less aggressive than fonts)
const SPACING_SCALE_FACTOR = 0.5;

class DynamicTypeService {
  private fontScale: number = 1;
  private isReduceMotionEnabled: boolean = false;
  private isBoldTextEnabled: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeAccessibilitySettings();
  }

  /**
   * Initialize accessibility settings from system
   */
  private async initializeAccessibilitySettings(): Promise<void> {
    // Get current font scale
    this.fontScale = PixelRatio.getFontScale();

    // Check reduce motion preference
    try {
      this.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
    } catch {
      this.isReduceMotionEnabled = false;
    }

    // Check bold text preference (iOS only)
    if (Platform.OS === 'ios') {
      try {
        this.isBoldTextEnabled = await AccessibilityInfo.isBoldTextEnabled();
      } catch {
        this.isBoldTextEnabled = false;
      }
    }

    // Listen for accessibility changes
    this.setupAccessibilityListeners();
  }

  /**
   * Set up listeners for accessibility setting changes
   */
  private setupAccessibilityListeners(): void {
    // Listen for reduce motion changes
    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isEnabled) => {
        this.isReduceMotionEnabled = isEnabled;
        this.notifyListeners();
      }
    );

    // Listen for bold text changes (iOS)
    if (Platform.OS === 'ios') {
      const boldTextSubscription = AccessibilityInfo.addEventListener(
        'boldTextChanged',
        (isEnabled) => {
          this.isBoldTextEnabled = isEnabled;
          this.notifyListeners();
        }
      );
    }
  }

  /**
   * Get the current font scale (clamped to min/max)
   */
  getFontScale(): number {
    const scale = PixelRatio.getFontScale();
    return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
  }

  /**
   * Scale a font size based on system accessibility settings
   */
  scaleFontSize(baseSize: number): number {
    const scale = this.getFontScale();
    return Math.round(baseSize * scale);
  }

  /**
   * Get scaled font sizes object
   */
  getScaledFontSizes(): typeof BASE_FONT_SIZES {
    const scale = this.getFontScale();
    
    return {
      xs: Math.round(BASE_FONT_SIZES.xs * scale),
      sm: Math.round(BASE_FONT_SIZES.sm * scale),
      md: Math.round(BASE_FONT_SIZES.md * scale),
      base: Math.round(BASE_FONT_SIZES.base * scale),
      lg: Math.round(BASE_FONT_SIZES.lg * scale),
      xl: Math.round(BASE_FONT_SIZES.xl * scale),
      '2xl': Math.round(BASE_FONT_SIZES['2xl'] * scale),
      '3xl': Math.round(BASE_FONT_SIZES['3xl'] * scale),
      '4xl': Math.round(BASE_FONT_SIZES['4xl'] * scale),
      '5xl': Math.round(BASE_FONT_SIZES['5xl'] * scale),
    };
  }

  /**
   * Scale spacing based on font scale (less aggressive)
   * This helps maintain layout when fonts are scaled
   */
  scaleSpacing(baseSpacing: number): number {
    const scale = this.getFontScale();
    // Apply a dampened scale for spacing
    const spacingScale = 1 + (scale - 1) * SPACING_SCALE_FACTOR;
    return Math.round(baseSpacing * spacingScale);
  }

  /**
   * Get scaled spacing object
   */
  getScaledSpacing(): typeof BASE_SPACING {
    const scale = this.getFontScale();
    const spacingScale = 1 + (scale - 1) * SPACING_SCALE_FACTOR;

    return {
      xs: Math.round(BASE_SPACING.xs * spacingScale),
      sm: Math.round(BASE_SPACING.sm * spacingScale),
      md: Math.round(BASE_SPACING.md * spacingScale),
      base: Math.round(BASE_SPACING.base * spacingScale),
      lg: Math.round(BASE_SPACING.lg * spacingScale),
      xl: Math.round(BASE_SPACING.xl * spacingScale),
      '2xl': Math.round(BASE_SPACING['2xl'] * spacingScale),
      '3xl': Math.round(BASE_SPACING['3xl'] * spacingScale),
      '4xl': Math.round(BASE_SPACING['4xl'] * spacingScale),
      '5xl': Math.round(BASE_SPACING['5xl'] * spacingScale),
    };
  }

  /**
   * Check if reduced motion is enabled
   */
  shouldReduceMotion(): boolean {
    return this.isReduceMotionEnabled;
  }

  /**
   * Check if bold text is enabled (iOS)
   */
  shouldUseBoldText(): boolean {
    return this.isBoldTextEnabled;
  }

  /**
   * Get the appropriate font weight based on accessibility settings
   */
  getFontWeight(baseWeight: '400' | '500' | '600' | '700' | '800'): '400' | '500' | '600' | '700' | '800' {
    if (!this.isBoldTextEnabled) {
      return baseWeight;
    }

    // Bump up font weight when bold text is enabled
    const weights: ('400' | '500' | '600' | '700' | '800')[] = ['400', '500', '600', '700', '800'];
    const currentIndex = weights.indexOf(baseWeight);
    const newIndex = Math.min(currentIndex + 1, weights.length - 1);
    return weights[newIndex];
  }

  /**
   * Get animation duration based on reduce motion preference
   */
  getAnimationDuration(baseDuration: number): number {
    if (this.isReduceMotionEnabled) {
      return 0;
    }
    return baseDuration;
  }

  /**
   * Check if animations should be enabled
   */
  shouldAnimate(): boolean {
    return !this.isReduceMotionEnabled;
  }

  /**
   * Add a listener for accessibility changes
   */
  addListener(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  /**
   * Check if user has large accessibility sizes enabled
   */
  isLargeTextEnabled(): boolean {
    return this.getFontScale() > 1.2;
  }

  /**
   * Get accessibility info for debugging
   */
  getAccessibilityInfo(): {
    fontScale: number;
    reduceMotion: boolean;
    boldText: boolean;
    largeText: boolean;
  } {
    return {
      fontScale: this.getFontScale(),
      reduceMotion: this.isReduceMotionEnabled,
      boldText: this.isBoldTextEnabled,
      largeText: this.isLargeTextEnabled(),
    };
  }
}

export const dynamicTypeService = new DynamicTypeService();
