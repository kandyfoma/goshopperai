/**
 * Button Component
 *
 * A versatile, animated button component with multiple variants
 */

import React, {useRef, useState} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  Vibration,
  Platform,
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

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
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
  hapticFeedback?: boolean; // Enable/disable vibration feedback
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
  hapticFeedback = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const [isSubmitPressed, setIsSubmitPressed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if this is a submit-type button that should have enhanced effects
  const isSubmitButton = variant === 'primary' || variant === 'danger';

  const triggerVibration = () => {
    if (Platform.OS === 'ios') {
      // iOS haptic feedback
      Vibration.vibrate([10]);
    } else {
      // Android vibration
      Vibration.vibrate(50);
    }
  };

  const triggerSubmitAnimation = () => {
    setIsSubmitPressed(true);
    
    // Pulse animation for submit buttons
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.92,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(pulseAnim, {
          toValue: 1.1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(pulseAnim, {
          toValue: 1,
          tension: 300,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setTimeout(() => setIsSubmitPressed(false), 100);
    });
  };

  // Public method to trigger success animation (can be called from parent)
  const triggerSuccessAnimation = () => {
    setShowSuccess(true);
    Animated.sequence([
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.spring(successAnim, {
        toValue: 0,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowSuccess(false);
    });
  };

  const handlePressIn = () => {
    if (isSubmitButton && !disabled && !loading) {
      if (hapticFeedback) {
        triggerVibration();
      }
      triggerSubmitAnimation();
    } else {
      // Standard animation for non-submit buttons
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        ...Animations.spring.stiff,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!isSubmitButton || disabled || loading) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...Animations.spring.gentle,
        useNativeDriver: true,
      }).start();
    }
    // Submit buttons handle animation in triggerSubmitAnimation
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
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
        // Dark blue filled button for submit/primary actions
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.border.medium : Colors.accent, // Cosmos Blue #003049
          ...Shadows.md,
        };
      case 'danger':
        // Red filled button for cancel/destructive actions
        return {
          ...baseStyle,
          backgroundColor: disabled ? Colors.border.medium : Colors.primary, // Crimson Red #C1121F
          ...Shadows.md,
        };
      case 'outline':
        // Unfilled with yellow border for other features
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: disabled ? Colors.border.medium : Colors.card.yellow, // Warm beige #F5E6C3
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: Colors.white,
          borderWidth: 1.5,
          borderColor: disabled ? Colors.border.medium : Colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
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
      case 'danger':
        // White text for filled buttons
        return {...baseStyle, color: Colors.white};
      case 'outline':
        // Dark text for outline button
        return {
          ...baseStyle,
          color: disabled ? Colors.text.tertiary : Colors.text.primary,
        };
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
            variant === 'primary' || variant === 'danger'
              ? Colors.white
              : Colors.text.primary
          }
        />
      );
    }

    if (showSuccess) {
      return (
        <Animated.View 
          style={[
            styles.successContainer,
            { 
              opacity: successAnim,
              transform: [{ scale: successAnim }]
            }
          ]}
        >
          <Text style={styles.successIcon}>✓</Text>
        </Animated.View>
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

  const animationStyle = isSubmitButton ? {
    transform: [
      { scale: scaleAnim },
      { scale: pulseAnim }
    ]
  } : {
    transform: [{ scale: scaleAnim }]
  };

  const buttonStyle = getButtonStyles();
  const enhancedButtonStyle = isSubmitPressed && isSubmitButton ? [
    buttonStyle,
    {
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    }
  ] : buttonStyle;

  return (
    <Animated.View style={[animationStyle, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={isSubmitButton ? 0.85 : 0.9}
        style={enhancedButtonStyle}>
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
  successContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
});

export default Button;
