/**
 * Button Component
 *
 * A versatile, animated button component with multiple variants
 */

import React, {useRef} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import {
  Colors,
  Typography,
  BorderRadius,
  Spacing,
  Shadows,
  Layout,
  Animations,
} from '../theme/theme';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      ...Animations.spring.stiff,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...Animations.spring.gentle,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: Layout.buttonHeight[size],
      borderRadius: BorderRadius.base,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
    };

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.border.medium : Colors.primary,
          ...Shadows.md,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: Colors.white,
          borderWidth: 1.5,
          borderColor: disabled ? Colors.border.medium : Colors.primary,
        };
      case 'accent':
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.border.medium : Colors.accent,
          ...Shadows.accent,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: disabled ? Colors.border.medium : Colors.border.dark,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: Typography.fontWeight.semiBold,
      fontSize:
        size === 'sm' ? Typography.fontSize.md : Typography.fontSize.base,
    };

    switch (variant) {
      case 'primary':
      case 'accent':
        return {...baseStyle, color: Colors.white};
      case 'secondary':
        return {
          ...baseStyle,
          color: disabled ? Colors.text.tertiary : Colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          color: disabled ? Colors.text.tertiary : Colors.primary,
        };
      case 'outline':
        return {
          ...baseStyle,
          color: disabled ? Colors.text.tertiary : Colors.text.primary,
        };
      default:
        return baseStyle;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary' || variant === 'accent'
              ? Colors.white
              : Colors.primary
          }
        />
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>{icon}</View>
        )}
        <Text style={[getTextStyles(), textStyle]}>{title}</Text>
        {icon && iconPosition === 'right' && (
          <View style={styles.iconRight}>{icon}</View>
        )}
      </>
    );
  };

  return (
    <Animated.View style={[{transform: [{scale: scaleAnim}]}, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={getButtonStyles()}>
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});

export default Button;
