// Password strength indicator component
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '@/shared/theme/theme';
import { passwordService } from '@/shared/services/password';

interface PasswordStrengthIndicatorProps {
  value: string;
  showDetails?: boolean;
  style?: ViewStyle;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  value,
  showDetails = true,
  style,
}) => {
  const validation = passwordService.validatePassword(value);
  const getStrengthConfig = (strength: 'weak' | 'medium' | 'strong') => {
    switch (strength) {
      case 'weak':
        return {
          color: '#ff4757',
          backgroundColor: '#ffebee',
          text: 'Faible',
          width: '33%',
        };
      case 'medium':
        return {
          color: '#ffa502',
          backgroundColor: '#fff3e0',
          text: 'Moyen',
          width: '66%',
        };
      case 'strong':
        return {
          color: '#2ed573',
          backgroundColor: '#e8f5e8',
          text: 'Fort',
          width: '100%',
        };
    }
  };

  const config = getStrengthConfig(validation.strength);

  return (
    <View style={[styles.container, style]}>
      {/* Strength Bar */}
      <View style={styles.strengthBarContainer}>
        <View style={styles.strengthBarBackground}>
          <View 
            style={[
              styles.strengthBarFill,
              { 
                backgroundColor: config.color,
                width: config.width as any,
              }
            ]} 
          />
        </View>
        <Text style={[styles.strengthText, { color: config.color }]}>
          {config.text} ({validation.score}%)
        </Text>
      </View>

      {/* Errors */}
      {showDetails && validation.errors.length > 0 && (
        <View style={styles.errorsContainer}>
          {validation.errors.map((error, index) => (
            <Text key={index} style={styles.errorText}>
              • {error}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  strengthBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border.light,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    minWidth: 60,
  },
  errorsContainer: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.status.error,
    lineHeight: 16,
    marginBottom: 2,
  },
});