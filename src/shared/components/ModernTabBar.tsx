// Enhanced Tab Bar with Notification Badges
import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Pressable,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Colors, Typography, Shadows} from '@/shared/theme/theme';
import {Icon} from '@/shared/components';

const {width: screenWidth} = Dimensions.get('window');

interface TabBarIconProps {
  focused: boolean;
  icon: string;
  label: string;
  badge?: number;
}

export function TabBarIcon({focused, icon, label, badge}: TabBarIconProps) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.15 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.8)).current;
  const badgeAnim = useRef(new Animated.Value(badge ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.15 : 1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  useEffect(() => {
    Animated.spring(badgeAnim, {
      toValue: badge ? 1 : 0,
      useNativeDriver: true,
      tension: 300,
      friction: 8,
    }).start();
  }, [badge]);

  return (
    <View style={styles.tabIconContainer}>
      <Animated.View
        style={[
          styles.iconWrapper,
          focused && styles.iconWrapperFocused,
          {
            transform: [{scale: scaleAnim}],
            opacity: opacityAnim,
          },
        ]}>
        {/* Active indicator dot */}
        {focused && <View style={styles.activeIndicator} />}
        
        {/* Icon */}
        <Icon
          name={icon}
          size="md"
          color={Colors.white}
        />

        {/* Notification Badge */}
        {badge && badge > 0 && (
          <Animated.View
            style={[
              styles.badge,
              {
                transform: [{scale: badgeAnim}],
                opacity: badgeAnim,
              },
            ]}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge.toString()}
            </Text>
          </Animated.View>
        )}
      </Animated.View>
      
      <Text
        style={[
          styles.tabLabel,
          focused && styles.tabLabelFocused,
        ]}>
        {label}
      </Text>
    </View>
  );
}

interface ModernTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  badges?: {[key: string]: number};
}

export function ModernTabBar({state, descriptors, navigation, badges = {}}: ModernTabBarProps) {
  return (
    <View style={styles.tabBarContainer}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.tabBarGradient}>
        <View style={styles.tabBarContent}>
          {state.routes.map((route: any, index: number) => {
            const {options} = descriptors[route.key];
            const isFocused = state.index === index;
            const routeBadge = badges[route.name] || 0;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <View key={index} style={styles.tabItem}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={isFocused ? {selected: true} : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={[
                    styles.tabButton,
                    isFocused && styles.tabButtonFocused,
                  ]}>
                  {options.tabBarIcon ? 
                    options.tabBarIcon({focused: isFocused, badge: routeBadge}) : null}
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Floating center scanner button (optional) */}
        {/* You can uncomment this for a special center button
        <View style={styles.centerButtonContainer}>
          <LinearGradient
            colors={[Colors.accentLight, Colors.accent]}
            style={styles.centerButton}>
            <Icon name="camera" size="lg" color={Colors.white} />
          </LinearGradient>
        </View>
        */}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    ...Shadows.lg,
  },
  tabBarGradient: {
    borderRadius: 28,
    paddingVertical: Platform.OS === 'ios' ? 16 : 14,
    paddingHorizontal: 24,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 60,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tabButtonFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  iconWrapperFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    shadowColor: Colors.white,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  tabLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 6,
    opacity: 0.8,
    textAlign: 'center',
  },
  tabLabelFocused: {
    opacity: 1,
    fontWeight: Typography.fontWeight.semiBold,
  },
  // Optional floating center button styles
  centerButtonContainer: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    ...Shadows.lg,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
});

export default ModernTabBar;