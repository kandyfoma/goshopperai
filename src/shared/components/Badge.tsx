/**
 * Badge Component
 *
 * For status indicators, counts, and labels
 */

import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {Colors, Typography, BorderRadius, Spacing} from '../theme/theme';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'accent';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label?: string;
  count?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  count,
  variant = 'default',
  size = 'md',
  dot = false,
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return {bg: Colors.status.successLight, text: Colors.status.success};
      case 'warning':
        return {bg: Colors.status.warningLight, text: Colors.status.warning};
      case 'error':
        return {bg: Colors.status.errorLight, text: Colors.status.error};
      case 'info':
        return {bg: Colors.status.infoLight, text: Colors.status.info};
      case 'accent':
        return {bg: Colors.accent, text: Colors.white};
      default:
        return {bg: Colors.background.secondary, text: Colors.text.secondary};
    }
  };

  const getSizeStyles = () => {
    if (dot) {
      return {
        width: size === 'sm' ? 8 : size === 'md' ? 10 : 12,
        height: size === 'sm' ? 8 : size === 'md' ? 10 : 12,
      };
    }
    return {
      paddingHorizontal:
        size === 'sm' ? Spacing.sm : size === 'md' ? Spacing.md : Spacing.base,
      paddingVertical: size === 'sm' ? 2 : size === 'md' ? 4 : 6,
    };
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return Typography.fontSize.xs;
      case 'md':
        return Typography.fontSize.sm;
      case 'lg':
        return Typography.fontSize.md;
    }
  };

  const colors = getColors();

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          getSizeStyles(),
          {backgroundColor: colors.text},
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.badge,
        getSizeStyles(),
        {backgroundColor: colors.bg},
        style,
      ]}>
      <Text
        style={[styles.text, {color: colors.text, fontSize: getFontSize()}]}>
        {count !== undefined ? (count > 99 ? '99+' : count) : label}
      </Text>
    </View>
  );
};

// Notification badge (for tab bar icons)
export const NotificationBadge: React.FC<{
  count: number;
  style?: ViewStyle;
}> = ({count, style}) => {
  if (count === 0) {
    return null;
  }

  return (
    <View style={[styles.notificationBadge, style]}>
      <Text style={styles.notificationText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: Typography.fontWeight.semiBold,
  },
  dot: {
    borderRadius: BorderRadius.full,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.status.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default Badge;
