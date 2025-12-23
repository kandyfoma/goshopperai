/**
 * Push Notification Hook
 * Custom hook to manage push notifications in React components
 */

import {useEffect, useState, useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';
import {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import {
  initializePushNotifications,
  setupForegroundNotificationHandler,
  setupBackgroundNotificationHandler,
  handleNotificationAction,
  areNotificationsEnabled,
  openNotificationSettings,
  disableNotifications,
} from '../services/notificationService';
import {useAuth} from '../contexts/AuthContext';

export function usePushNotifications() {
  const navigation = useNavigation();
  const {user} = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize notifications when user logs in
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    const initialize = async () => {
      try {
        await initializePushNotifications(user.uid);
        const enabled = await areNotificationsEnabled();
        setIsEnabled(enabled);
      } catch (error) {
        console.error('Initialize notifications error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [user?.uid]);

  // Setup foreground notification handler
  useEffect(() => {
    if (!user?.uid) return;

    const onNotification = (notification: FirebaseMessagingTypes.RemoteMessage) => {
      handleNotificationAction(notification, navigation);
    };

    const unsubscribe = setupForegroundNotificationHandler(onNotification);

    return () => {
      unsubscribe();
    };
  }, [user?.uid, navigation]);

  // Setup background notification handler
  useEffect(() => {
    if (!user?.uid) return;

    const onNotificationTap = (notification: FirebaseMessagingTypes.RemoteMessage) => {
      handleNotificationAction(notification, navigation);
    };

    setupBackgroundNotificationHandler(onNotificationTap);
  }, [user?.uid, navigation]);

  // Check notification permission status
  const checkPermission = useCallback(async () => {
    const enabled = await areNotificationsEnabled();
    setIsEnabled(enabled);
    return enabled;
  }, []);

  // Open notification settings
  const openSettings = useCallback(async () => {
    await openNotificationSettings();
  }, []);

  // Disable notifications
  const disable = useCallback(async () => {
    if (!user?.uid) return;
    await disableNotifications(user.uid);
    setIsEnabled(false);
  }, [user?.uid]);

  // Re-enable notifications
  const enable = useCallback(async () => {
    if (!user?.uid) return;
    await initializePushNotifications(user.uid);
    const enabled = await areNotificationsEnabled();
    setIsEnabled(enabled);
    return enabled;
  }, [user?.uid]);

  return {
    isEnabled,
    isLoading,
    checkPermission,
    openSettings,
    disable,
    enable,
  };
}
