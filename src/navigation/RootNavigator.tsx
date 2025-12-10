// Root Navigator - Main app navigation structure
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/types';

// Screens
import {MainTabNavigator} from './MainTabNavigator';
import {ScannerScreen, ReceiptDetailScreen, PriceComparisonScreen} from '@/features/scanner/screens';
import {SubscriptionScreen} from '@/features/subscription/screens';
import {SettingsScreen} from '@/features/settings/screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="ReceiptDetail"
        component={ReceiptDetailScreen}
        options={{headerShown: true, title: 'Détails'}}
      />
      <Stack.Screen
        name="PriceComparison"
        component={PriceComparisonScreen}
        options={{headerShown: true, title: 'Comparaison'}}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{headerShown: true, title: 'Paramètres'}}
      />
    </Stack.Navigator>
  );
}
