// Modern Toast Component
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
import {Colors} from '../theme/theme';

const {width} = Dimensions.get('window');

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

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
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
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  if (!visible) return null;

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: Colors.status.successLight,
          borderColor: Colors.status.success,
          icon: 'check-circle',
          iconColor: Colors.status.success,
        };
      case 'error':
        return {
          backgroundColor: Colors.status.errorLight,
          borderColor: Colors.status.error,
          icon: 'alert-circle',
          iconColor: Colors.status.error,
        };
      case 'warning':
        return {
          backgroundColor: Colors.status.warningLight,
          borderColor: Colors.status.warning,
          icon: 'alert-triangle',
          iconColor: Colors.status.warning,
        };
      default:
        return {
          backgroundColor: Colors.status.infoLight,
          borderColor: Colors.status.info,
          icon: 'info',
          iconColor: Colors.status.info,
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
          borderColor: config.borderColor,
          transform: [{translateY}],
          opacity,
        },
      ]}>
      <View style={styles.content}>
        <Icon name={config.icon} size="sm" color={config.iconColor} />
        <Text style={[styles.message, {color: config.iconColor}]}>
          {message}
        </Text>
      </View>
      <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
        <Icon name="x" size="xs" color={config.iconColor} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});