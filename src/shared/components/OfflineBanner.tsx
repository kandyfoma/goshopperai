/**
 * OfflineBanner Component
 * 
 * Shows offline status and sync information to users.
 * Also shows toast notifications when network status changes.
 */

import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {useOffline} from '../hooks/useOffline';
import {useToast} from '../contexts/ToastContext';
import {Colors, Typography, Spacing, BorderRadius} from '../theme/theme';
import Icon from './Icon';

interface OfflineBannerProps {
  showPendingCount?: boolean;
  onSyncPress?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  showPendingCount = true,
  onSyncPress,
}) => {
  const {isOffline, isSyncing, pendingActions, syncNow} = useOffline();
  const {showToast} = useToast();
  const [animation] = React.useState(new Animated.Value(0));
  const previousOfflineState = useRef<boolean | null>(null);
  const isFirstMount = useRef(true);

  // Show toast when network status changes
  useEffect(() => {
    // Skip the first render to avoid showing toast on app start
    if (isFirstMount.current) {
      isFirstMount.current = false;
      previousOfflineState.current = isOffline;
      return;
    }

    // Only show toast if state actually changed
    if (previousOfflineState.current !== null && previousOfflineState.current !== isOffline) {
      if (isOffline) {
        showToast('📴 Connexion perdue - Mode hors ligne', 'warning', 4000);
      } else {
        showToast('✅ Connexion rétablie', 'success', 3000);
      }
    }
    
    previousOfflineState.current = isOffline;
  }, [isOffline, showToast]);

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, animation]);

  // Don't render if online and no pending actions
  if (!isOffline && pendingActions === 0) {
    return null;
  }

  const handleSyncPress = () => {
    if (onSyncPress) {
      onSyncPress();
    } else {
      syncNow();
    }
  };

  // Show syncing state
  if (isSyncing) {
    return (
      <View style={[styles.container, styles.syncingContainer]}>
        <Icon name="refresh" size="xs" color={Colors.white} />
        <Text style={styles.text}>Synchronisation en cours...</Text>
      </View>
    );
  }

  // Show offline state
  if (isOffline) {
    return (
      <Animated.View 
        style={[
          styles.container, 
          styles.offlineContainer,
          {
            opacity: animation,
            transform: [{
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            }],
          },
        ]}
      >
        <Icon name="wifi-off" size="xs" color={Colors.white} />
        <Text style={styles.text}>
          Mode hors ligne
          {showPendingCount && pendingActions > 0 && (
            ` • ${pendingActions} action${pendingActions > 1 ? 's' : ''} en attente`
          )}
        </Text>
      </Animated.View>
    );
  }

  // Show pending actions when online
  if (pendingActions > 0) {
    return (
      <TouchableOpacity 
        style={[styles.container, styles.pendingContainer]}
        onPress={handleSyncPress}
        activeOpacity={0.8}
      >
        <Icon name="upload" size="xs" color={Colors.white} />
        <Text style={styles.text}>
          {pendingActions} action{pendingActions > 1 ? 's' : ''} à synchroniser
        </Text>
        <Icon name="chevron-right" size="xs" color={Colors.white} />
      </TouchableOpacity>
    );
  }

  return null;
};

/**
 * Compact offline indicator (just an icon)
 */
export const OfflineIndicator: React.FC = () => {
  const {isOffline, pendingActions} = useOffline();

  if (!isOffline && pendingActions === 0) {
    return null;
  }

  return (
    <View style={styles.indicator}>
      {isOffline ? (
        <Icon name="wifi-off" size="xs" color={Colors.status.warning} />
      ) : (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>{pendingActions}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  offlineContainer: {
    backgroundColor: Colors.status.warning,
  },
  syncingContainer: {
    backgroundColor: Colors.accentLight,
  },
  pendingContainer: {
    backgroundColor: Colors.primary,
  },
  text: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  indicator: {
    marginRight: Spacing.sm,
  },
  pendingBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default OfflineBanner;
