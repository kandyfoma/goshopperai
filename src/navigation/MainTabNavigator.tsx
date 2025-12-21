// Main Tab Navigator - Bottom tabs with modern design
import React, {useEffect, useRef} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet, Animated, Platform} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {MainTabParamList} from '@/shared/types';
import {
  Colors,
  Typography,
  Spacing,
  Shadows,
  Layout,
} from '@/shared/theme/theme';
import {Icon} from '@/shared/components';

// Screens
import {HomeScreen} from '@/features/home/screens';
import {HistoryScreen} from '@/features/history/screens';
import {UnifiedScannerScreen} from '@/features/scanner/screens';
import {ItemsScreen, CityItemsScreen} from '@/features/items';
import {ProfileScreen} from '@/features/profile/screens';

// Custom Tab Bar Component
function CustomTabBar({state, descriptors, navigation}: any) {
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
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name;

            const isFocused = state.index === index;

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
              <Animated.View key={index} style={styles.tabItem}>
                <Animated.Pressable
                  accessibilityRole="button"
                  accessibilityState={isFocused ? {selected: true} : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  testID={options.tabBarTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.tabButton}>
                  {options.tabBarIcon ? options.tabBarIcon({focused: isFocused}) : null}
                </Animated.Pressable>
              </Animated.View>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

interface TabIconProps {
  focused: boolean;
  icon: string;
  label: string;
}

function TabIcon({focused, icon, label}: TabIconProps) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const translateYAnim = useRef(new Animated.Value(focused ? -4 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1 : 0.9,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.spring(translateYAnim, {
        toValue: focused ? -4 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
    ]).start();
  }, [focused, scaleAnim, translateYAnim]);

  return (
    <Animated.View
      style={[
        styles.tabIconContainer,
        {
          transform: [{scale: scaleAnim}, {translateY: translateYAnim}],
        },
      ]}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperFocused]}>
        <Icon
          name={icon}
          size="sm"
          color={focused ? Colors.primary : Colors.text.tertiary}
          variant={focused ? 'filled' : 'outline'}
        />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </Animated.View>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="home" label="Accueil" />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="receipt" label="Historique" />
          ),
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={UnifiedScannerScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="camera" label="Scanner" />
          ),
        }}
      />
      <Tab.Screen
        name="Items"
        component={CityItemsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="cart" label="Articles" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="user" label="Profil" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    ...Shadows.lg,
  },
  tabBarGradient: {
    borderRadius: 24,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 16,
  },
  tabBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 56,
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
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  iconWrapperFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  tabLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 4,
    opacity: 0.7,
  },
  tabLabelFocused: {
    opacity: 1,
    fontWeight: Typography.fontWeight.semiBold,
  },
});
