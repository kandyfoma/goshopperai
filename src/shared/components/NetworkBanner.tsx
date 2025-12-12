// Network Detection Hook and Banner - Urbanist Design
import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Icon from './Icon';

// Urbanist Design Colors
const URBANIST_COLORS = {
  cardBg: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#6B7280',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  warningAccent: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  errorAccent: '#FEE2E2',
};

export interface NetworkState {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean | null;
}

export function useNetwork() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    type: 'unknown',
    isInternetReachable: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });
    });

    return () => unsubscribe();
  }, []);

  return networkState;
}

// Network Banner Component
interface NetworkBannerProps {
  networkState: NetworkState;
  onRetry?: () => void;
}

export function NetworkBanner({networkState, onRetry}: NetworkBannerProps) {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const shouldShow =
    !networkState.isConnected || networkState.isInternetReachable === false;

  useEffect(() => {
    if (shouldShow) {
      // Slide in animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  const isNoConnection = !networkState.isConnected;
  const statusColor = isNoConnection
    ? URBANIST_COLORS.error
    : URBANIST_COLORS.warning;
  const bgColor = isNoConnection
    ? URBANIST_COLORS.errorBg
    : URBANIST_COLORS.warningBg;
  const accentColor = isNoConnection
    ? URBANIST_COLORS.errorAccent
    : URBANIST_COLORS.warningAccent;

  const getMessage = () => {
    if (!networkState.isConnected) {
      return 'Pas de connexion réseau';
    }
    if (networkState.isInternetReachable === false) {
      return "Pas d'accès à Internet";
    }
    return 'Connexion limitée';
  };

  const getIcon = () => {
    if (!networkState.isConnected) {
      return 'wifi-off-line';
    }
    return 'signal-wifi-error-line';
  };

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: bgColor,
          transform: [{translateY: slideAnim}],
          opacity: opacityAnim,
        },
      ]}>
      <View style={[styles.accentBar, {backgroundColor: statusColor}]} />

      <View style={styles.bannerContent}>
        <Animated.View
          style={[
            styles.iconContainer,
            {backgroundColor: accentColor, transform: [{scale: pulseAnim}]},
          ]}>
          <Icon name={getIcon()} size="sm" color={statusColor} />
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={styles.bannerText}>{getMessage()}</Text>
          <Text style={styles.bannerSubtext}>Vérifiez votre connexion</Text>
        </View>

        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={[styles.retryButton, {backgroundColor: accentColor}]}
            activeOpacity={0.7}>
            <Icon name="refresh" size="sm" color={statusColor} />
            <Text style={[styles.retryText, {color: statusColor}]}>
              Réessayer
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 20,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: URBANIST_COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  bannerSubtext: {
    fontSize: 12,
    color: URBANIST_COLORS.textSecondary,
    marginTop: 2,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
