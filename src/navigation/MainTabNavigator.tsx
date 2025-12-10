// Main Tab Navigator - Bottom tabs
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {View, Text, StyleSheet} from 'react-native';
import {MainTabParamList} from '@/shared/types';
import {COLORS} from '@/shared/utils/constants';

// Screens
import {HomeScreen} from '@/features/home/screens';
import {HistoryScreen} from '@/features/history/screens';
import {StatsScreen} from '@/features/stats/screens';
import {ProfileScreen} from '@/features/profile/screens';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  focused: boolean;
  icon: string;
  label: string;
}

function TabIcon({focused, icon, label}: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
        {icon}
      </Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
    </View>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="🏠" label="Accueil" />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="📋" label="Historique" />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="📊" label="Stats" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="👤" label="Profil" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    height: 70,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  tabIconFocused: {
    transform: [{scale: 1.1}],
  },
  tabLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: COLORS.primary[500],
    fontWeight: '600',
  },
});
