/**
 * useDynamicType Hook
 * 
 * React hook for using dynamic type (accessibility font scaling) in components.
 * Automatically re-renders when accessibility settings change.
 */

import {useEffect, useState, useCallback} from 'react';
import {PixelRatio} from 'react-native';
import {dynamicTypeService} from '../services/dynamicTypeService';

interface DynamicTypeSizes {
  xs: number;
  sm: number;
  md: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
  '5xl': number;
}

interface UseDynamicTypeResult {
  // Scaled values
  fontSizes: DynamicTypeSizes;
  spacing: DynamicTypeSizes;
  
  // Scale factor
  fontScale: number;
  
  // Helper functions
  scaleFontSize: (size: number) => number;
  scaleSpacing: (spacing: number) => number;
  
  // Accessibility flags
  isLargeText: boolean;
  shouldReduceMotion: boolean;
  shouldUseBoldText: boolean;
  shouldAnimate: boolean;
  
  // Animation helper
  getAnimationDuration: (duration: number) => number;
  
  // Font weight helper
  getFontWeight: (weight: '400' | '500' | '600' | '700' | '800') => '400' | '500' | '600' | '700' | '800';
}

export function useDynamicType(): UseDynamicTypeResult {
  const [fontScale, setFontScale] = useState(dynamicTypeService.getFontScale());
  const [shouldReduceMotion, setShouldReduceMotion] = useState(
    dynamicTypeService.shouldReduceMotion()
  );
  const [shouldUseBoldText, setShouldUseBoldText] = useState(
    dynamicTypeService.shouldUseBoldText()
  );

  // Update values when accessibility settings change
  useEffect(() => {
    const unsubscribe = dynamicTypeService.addListener(() => {
      setFontScale(dynamicTypeService.getFontScale());
      setShouldReduceMotion(dynamicTypeService.shouldReduceMotion());
      setShouldUseBoldText(dynamicTypeService.shouldUseBoldText());
    });

    return unsubscribe;
  }, []);

  // Memoized helper functions
  const scaleFontSize = useCallback(
    (size: number) => dynamicTypeService.scaleFontSize(size),
    [fontScale]
  );

  const scaleSpacing = useCallback(
    (spacing: number) => dynamicTypeService.scaleSpacing(spacing),
    [fontScale]
  );

  const getAnimationDuration = useCallback(
    (duration: number) => dynamicTypeService.getAnimationDuration(duration),
    [shouldReduceMotion]
  );

  const getFontWeight = useCallback(
    (weight: '400' | '500' | '600' | '700' | '800') =>
      dynamicTypeService.getFontWeight(weight),
    [shouldUseBoldText]
  );

  return {
    fontSizes: dynamicTypeService.getScaledFontSizes(),
    spacing: dynamicTypeService.getScaledSpacing(),
    fontScale,
    scaleFontSize,
    scaleSpacing,
    isLargeText: dynamicTypeService.isLargeTextEnabled(),
    shouldReduceMotion,
    shouldUseBoldText,
    shouldAnimate: !shouldReduceMotion,
    getAnimationDuration,
    getFontWeight,
  };
}

/**
 * Simple hook that just returns the current font scale
 */
export function useFontScale(): number {
  const [scale, setScale] = useState(PixelRatio.getFontScale());

  useEffect(() => {
    const unsubscribe = dynamicTypeService.addListener(() => {
      setScale(PixelRatio.getFontScale());
    });
    return unsubscribe;
  }, []);

  return Math.min(Math.max(scale, 0.85), 1.5);
}

/**
 * Hook for checking if animations should be reduced
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(
    dynamicTypeService.shouldReduceMotion()
  );

  useEffect(() => {
    const unsubscribe = dynamicTypeService.addListener(() => {
      setReduceMotion(dynamicTypeService.shouldReduceMotion());
    });
    return unsubscribe;
  }, []);

  return reduceMotion;
}
