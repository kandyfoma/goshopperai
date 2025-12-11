/**
 * Card Component
 * 
 * A flexible card component with multiple variants and animation support
 */

import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows, Animations } from '../theme/theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'gradient' | 'accent';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  animated?: boolean;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  animated = true,
  style,
  padding = 'md',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (animated && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        ...Animations.spring.stiff,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animated && onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...Animations.spring.gentle,
        useNativeDriver: true,
      }).start();
    }
  };

  const getPaddingValue = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return Spacing.sm;
      case 'md':
        return Spacing.base;
      case 'lg':
        return Spacing.lg;
      default:
        return Spacing.base;
    }
  };

  const getCardStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.lg,
      padding: getPaddingValue(),
      overflow: 'hidden',
    };

    switch (variant) {
      case 'default':
        return {
          ...baseStyle,
          backgroundColor: Colors.white,
          ...Shadows.sm,
        };
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: Colors.white,
          ...Shadows.lg,
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: Colors.white,
          borderWidth: 1,
          borderColor: Colors.border.light,
        };
      case 'gradient':
        return {
          ...baseStyle,
          backgroundColor: Colors.primary,
        };
      case 'accent':
        return {
          ...baseStyle,
          backgroundColor: Colors.white,
          borderLeftWidth: 4,
          borderLeftColor: Colors.accent,
          ...Shadows.md,
        };
      default:
        return baseStyle;
    }
  };

  const content = (
    <Animated.View
      style={[
        getCardStyles(),
        style,
        animated && onPress ? { transform: [{ scale: scaleAnim }] } : {},
      ]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default Card;
