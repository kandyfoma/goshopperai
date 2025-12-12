/**
 * Input Component
 *
 * A styled text input with label and error states
 */

import React, {useState, useRef} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import {
  Colors,
  Typography,
  BorderRadius,
  Spacing,
  Layout,
  Animations,
} from '../theme/theme';
import Icon from './Icon';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: Animations.duration.fast,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: Animations.duration.fast,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? Colors.status.error : Colors.border.light,
      error ? Colors.status.error : Colors.primary,
    ],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Animated.View
        style={[
          styles.inputContainer,
          {borderColor},
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            <Icon
              name={leftIcon}
              size="sm"
              color={isFocused ? Colors.primary : Colors.text.tertiary}
            />
          </View>
        )}

        <TextInput
          {...textInputProps}
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
          ]}
          placeholderTextColor={Colors.text.tertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}>
            <Icon name={rightIcon} size="sm" color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {(error || hint) && (
        <Text style={[styles.helperText, error ? styles.errorText : null]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.base,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    height: Layout.inputHeight.md,
  },
  inputFocused: {
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: Spacing.xs,
  },
  leftIcon: {
    paddingLeft: Spacing.md,
  },
  rightIcon: {
    paddingRight: Spacing.md,
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  errorText: {
    color: Colors.status.error,
  },
});

export default Input;
