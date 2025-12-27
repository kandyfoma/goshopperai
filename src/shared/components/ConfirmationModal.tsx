import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from './Icon';
import {AnimatedModal} from './AnimatedModal';
import {Colors, Typography, Spacing, BorderRadius} from '@/shared/theme/theme';

export interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;

  // Content
  title: string;
  message?: string;
  icon?: string;
  iconColor?: string;

  // Actions
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  
  // Single button mode (for success/info states)
  singleButton?: boolean;

  // Styling
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

/**
 * Confirmation Modal Component - Finly-style design
 *
 * A specialized modal for confirmation dialogs with consistent styling
 * and behavior across the app. Features a centered icon circle with
 * clean typography.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  title,
  message,
  icon,
  iconColor,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  singleButton = false,
  variant = 'info',
  loading = false,
}) => {
  // Get variant-specific styling - Gochujang/Urbanist branding colors
  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        return {
          iconName: icon || 'alert-triangle',
          iconColor: iconColor || '#FFFFFF',
          iconBgColor: '#C1121F', // Crimson Blaze
        };
      case 'warning':
        return {
          iconName: icon || 'alert-triangle',
          iconColor: iconColor || '#780000',
          iconBgColor: '#FDB913', // Yellow
        };
      case 'success':
        return {
          iconName: icon || 'check',
          iconColor: iconColor || '#FFFFFF',
          iconBgColor: '#22C55E', // Success Green
        };
      case 'info':
      default:
        return {
          iconName: icon || 'info',
          iconColor: iconColor || '#FFFFFF',
          iconBgColor: '#669BBC', // Blue Marble
        };
    }
  };

  const variantConfig = getVariantConfig();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <AnimatedModal
      visible={visible}
      onClose={handleCancel}
      variant="centered"
      overlayOpacity={0.4}>
      {/* Close button */}
      {!singleButton && (
        <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
          <Icon name="x" size="sm" color={Colors.text.tertiary} />
        </TouchableOpacity>
      )}

      {/* Icon Circle - Centered */}
      {variantConfig.iconName && (
        <View style={[styles.iconContainer, {backgroundColor: variantConfig.iconBgColor}]}>
          <Icon
            name={variantConfig.iconName}
            size="xl"
            color={variantConfig.iconColor}
          />
        </View>
      )}

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Message */}
      {message && <Text style={styles.message}>{message}</Text>}

      {/* Buttons */}
      {singleButton ? (
        // Single button mode (like Done button in the design)
        <TouchableOpacity
          style={[styles.singleButton]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}>
          <Text style={styles.singleButtonText}>
            {loading ? 'En cours...' : confirmText}
          </Text>
        </TouchableOpacity>
      ) : (
        // Two button mode
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleCancel}
            disabled={loading}
            activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>{cancelText}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.7}>
            <Text style={styles.primaryButtonText}>
              {loading ? 'En cours...' : confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </AnimatedModal>
  );
};

// ============================================
// STYLES - Finly Design System
// ============================================
const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: -Spacing.md,
    right: -Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  singleButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 100,
    backgroundColor: '#669BBC', // Blue Marble
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  singleButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
  primaryButton: {
    backgroundColor: '#C1121F', // Crimson Blaze
    borderRadius: 100,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 100,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.primary,
  },
});

export default ConfirmationModal;