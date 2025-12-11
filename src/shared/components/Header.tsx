/**
 * Header Component
 * 
 * A flexible header component for screens
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Layout, TextStyles } from '../theme/theme';
import Icon from './Icon';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  leftIcon?: string;
  rightIcon?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  rightElement?: React.ReactNode;
  transparent?: boolean;
  dark?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  rightElement,
  transparent = false,
  dark = false,
}) => {
  const insets = useSafeAreaInsets();
  
  const textColor = dark ? Colors.white : Colors.text.primary;
  const iconColor = dark ? Colors.white : Colors.text.primary;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.sm,
          backgroundColor: transparent ? 'transparent' : Colors.background.primary,
        },
      ]}
    >
      <StatusBar
        barStyle={dark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <View style={styles.content}>
        {/* Left section */}
        <View style={styles.leftSection}>
          {leftIcon && onLeftPress && (
            <TouchableOpacity
              onPress={onLeftPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name={leftIcon} size="md" color={iconColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center section */}
        <View style={styles.centerSection}>
          {title && (
            <Text
              style={[styles.title, { color: textColor }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: dark ? Colors.text.tertiary : Colors.text.secondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right section */}
        <View style={styles.rightSection}>
          {rightElement}
          {rightIcon && onRightPress && (
            <TouchableOpacity
              onPress={onRightPress}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name={rightIcon} size="md" color={iconColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Layout.header.height,
    paddingHorizontal: Spacing.base,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 3,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
});

export default Header;
