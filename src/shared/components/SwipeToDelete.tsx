// Swipe to Delete Component
// Provides swipe gesture UI with delete action

import React, {useRef, useMemo, ReactNode} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import Icon from './Icon';
import {Colors, Typography, Spacing, BorderRadius} from '@/shared/theme/theme';
import {hapticService} from '@/shared/services';

interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void | Promise<void>;
  isDeleting?: boolean;
  deleteLabel?: string;
  swipeThreshold?: number;
  style?: ViewStyle;
  testID?: string;
}

export function SwipeToDelete({
  children,
  onDelete,
  isDeleting = false,
  deleteLabel = 'Supprimer',
  swipeThreshold = 100,
  style,
  testID,
}: SwipeToDeleteProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const panRef = useRef<any>(null);

  const onGestureEvent = Animated.event(
    [{nativeEvent: {translationX: translateX}}],
    {useNativeDriver: true},
  );

  const onHandlerStateChange = (
    event: PanGestureHandlerGestureEvent,
  ) => {
    if (event.nativeEvent.state === State.END) {
      const {translationX} = event.nativeEvent;

      if (translationX < -swipeThreshold) {
        // Swiped left enough to delete
        hapticService.warning();
        Animated.timing(translateX, {
          toValue: -150,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        // Reset
        Animated.timing(translateX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleDelete = async () => {
    hapticService.heavy();
    try {
      await onDelete();
      // Item will be removed from parent list
    } catch (error) {
      console.error('Delete error:', error);
      // Reset animation on error
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-5, 5]}>
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{translateX}],
            },
          ]}>
          {children}
        </Animated.View>
      </PanGestureHandler>

      {/* Delete action background */}
      <View style={styles.deleteAction}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isDeleting}
          activeOpacity={0.8}>
          <Icon name="trash-2" size="md" color={Colors.white} />
          <Text style={styles.deleteText}>{deleteLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: BorderRadius.base,
  },
  content: {
    backgroundColor: Colors.background.primary,
  },
  deleteAction: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 150,
    borderRadius: BorderRadius.base,
  },
  deleteButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  deleteText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
});
