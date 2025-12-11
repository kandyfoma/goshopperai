// Network Detection Hook and Banner
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Icon from './Icon';
import {Colors} from '../theme/theme';

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
  if (networkState.isConnected && networkState.isInternetReachable !== false) {
    return null;
  }

  const getMessage = () => {
    if (!networkState.isConnected) {
      return 'Pas de connexion réseau';
    }
    if (networkState.isInternetReachable === false) {
      return 'Pas d\'accès à Internet';
    }
    return 'Connexion limitée';
  };

  const getIcon = () => {
    if (!networkState.isConnected) {
      return 'wifi-off';
    }
    return 'wifi';
  };

  return (
    <View style={styles.banner}>
      <View style={styles.bannerContent}>
        <Icon name={getIcon()} size="sm" color={Colors.status.warning} />
        <Text style={styles.bannerText}>{getMessage()}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.status.warningLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.status.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.status.warning,
    marginLeft: 12,
  },
  retryButton: {
    backgroundColor: Colors.status.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    color: Colors.status.warning,
    fontWeight: '600',
  },
});