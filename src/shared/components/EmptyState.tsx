/**
 * Empty State Component
 * 
 * For displaying when there's no data
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '../theme/theme';
import Icon from './Icon';
import Button from './Button';
import { ScaleIn } from './AnimatedView';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'package',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <ScaleIn>
      <View style={[styles.container, style]}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size="3xl" color={Colors.text.tertiary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
        {actionLabel && onAction && (
          <View style={styles.buttonContainer}>
            <Button
              title={actionLabel}
              onPress={onAction}
              variant="primary"
              size="md"
              fullWidth={false}
            />
          </View>
        )}
      </View>
    </ScaleIn>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  buttonContainer: {
    marginTop: Spacing.sm,
  },
});

export default EmptyState;
