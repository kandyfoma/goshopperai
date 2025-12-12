/**
 * ListItem Component
 *
 * Reusable list item with icon, title, subtitle, and action
 */

import React, {useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
} from 'react-native';
import {
  Colors,
  Typography,
  BorderRadius,
  Spacing,
  Shadows,
  Animations,
} from '../theme/theme';
import Icon, {IconBox} from './Icon';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  leftIconColor?: string;
  leftIconBgColor?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  rightText?: string;
  showArrow?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  style?: ViewStyle;
}

const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  leftIconColor = Colors.primary,
  leftIconBgColor = Colors.background.secondary,
  leftElement,
  rightElement,
  rightText,
  showArrow = true,
  onPress,
  disabled = false,
  destructive = false,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: Animations.duration.fast,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: Animations.duration.fast,
        useNativeDriver: true,
      }).start();
    }
  };

  const content = (
    <Animated.View
      style={[
        styles.container,
        {transform: [{scale: scaleAnim}]},
        disabled && styles.disabled,
        style,
      ]}>
      {/* Left section */}
      {(leftIcon || leftElement) && (
        <View style={styles.leftSection}>
          {leftElement || (
            <IconBox
              name={leftIcon!}
              size="sm"
              color={destructive ? Colors.status.error : leftIconColor}
              backgroundColor={
                destructive ? Colors.status.errorLight : leftIconBgColor
              }
            />
          )}
        </View>
      )}

      {/* Content section */}
      <View style={styles.contentSection}>
        <Text
          style={[
            styles.title,
            destructive && styles.destructiveText,
            disabled && styles.disabledText,
          ]}
          numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right section */}
      <View style={styles.rightSection}>
        {rightElement}
        {rightText && <Text style={styles.rightText}>{rightText}</Text>}
        {showArrow && onPress && (
          <Icon name="chevron-right" size="sm" color={Colors.text.tertiary} />
        )}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Grouped list items with section header
interface ListSectionProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ListSection: React.FC<ListSectionProps> = ({
  title,
  children,
  style,
}) => {
  return (
    <View style={[styles.section, style]}>
      {title && <Text style={styles.sectionTitle}>{title}</Text>}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.xs,
    ...Shadows.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  leftSection: {
    marginRight: Spacing.md,
  },
  contentSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  rightText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginRight: Spacing.xs,
  },
  destructiveText: {
    color: Colors.status.error,
  },
  disabledText: {
    color: Colors.text.tertiary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
});

export default ListItem;
