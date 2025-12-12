// Modern Toast Component - Urbanist Design
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from './Icon';

const {width} = Dimensions.get('window');

// Urbanist Design Colors
const URBANIST_COLORS = {
  cardBg: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#6B7280',
  // Status colors with soft pastels
  success: '#10B981',
  successBg: '#ECFDF5',
  successAccent: '#D1FAE5',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  errorAccent: '#FEE2E2',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  warningAccent: '#FEF3C7',
  info: '#3B82F6',
  infoBg: '#EFF6FF',
  infoAccent: '#DBEAFE',
};

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const [visible, setVisible] = useState(true);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Animate in with spring
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      dismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  if (!visible) {
    return null;
  }

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: URBANIST_COLORS.successBg,
          accentColor: URBANIST_COLORS.successAccent,
          iconColor: URBANIST_COLORS.success,
          icon: 'checkbox-circle-fill',
        };
      case 'error':
        return {
          backgroundColor: URBANIST_COLORS.errorBg,
          accentColor: URBANIST_COLORS.errorAccent,
          iconColor: URBANIST_COLORS.error,
          icon: 'error-warning-fill',
        };
      case 'warning':
        return {
          backgroundColor: URBANIST_COLORS.warningBg,
          accentColor: URBANIST_COLORS.warningAccent,
          iconColor: URBANIST_COLORS.warning,
          icon: 'alert-fill',
        };
      default:
        return {
          backgroundColor: URBANIST_COLORS.infoBg,
          accentColor: URBANIST_COLORS.infoAccent,
          iconColor: URBANIST_COLORS.info,
          icon: 'information-fill',
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{translateY}, {scale}],
          opacity,
        },
      ]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, {backgroundColor: config.iconColor}]} />

      <View style={styles.content}>
        <View
          style={[styles.iconContainer, {backgroundColor: config.accentColor}]}>
          <Icon name={config.icon} size="sm" color={config.iconColor} />
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>

      <TouchableOpacity
        onPress={dismiss}
        style={styles.closeButton}
        activeOpacity={0.7}>
        <Icon name="x" size="sm" color={URBANIST_COLORS.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    zIndex: 1000,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: URBANIST_COLORS.textPrimary,
    flex: 1,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
