// Root Navigator - Main app navigation structure
import React, {useEffect, useState} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RootStackParamList} from '@/shared/types';

// Screens
import {MainTabNavigator} from './MainTabNavigator';
import {WelcomeScreen} from '@/features/onboarding/screens';
import {ScannerScreen, MultiPhotoScannerScreen, ReceiptDetailScreen, PriceComparisonScreen} from '@/features/scanner/screens';
import {SubscriptionScreen} from '@/features/subscription/screens';
import {SettingsScreen} from '@/features/settings/screens';

// Phase 1.1 & 1.2 Screens
import {PriceAlertsScreen} from '@/features/alerts';
import {ShoppingListScreen} from '@/features/shopping';
import {AIAssistantScreen} from '@/features/assistant';
import {AchievementsScreen} from '@/features/achievements';

const Stack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDING_KEY = '@goshopperai_onboarding_complete';

export function RootNavigator() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
        setIsFirstLaunch(hasSeenOnboarding === null);
        
        // Mark onboarding as complete for future launches
        if (hasSeenOnboarding === null) {
          await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        }
      } catch (error) {
        // If error, assume first launch
        setIsFirstLaunch(true);
      }
    };

    checkFirstLaunch();
  }, []);

  // Show nothing while checking first launch status
  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={isFirstLaunch ? 'Welcome' : 'Main'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{
          animation: 'fade',
        }}
      />
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
        name="MultiPhotoScanner"
        component={MultiPhotoScannerScreen}
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
      {/* Phase 1.1 Screens */}
      <Stack.Screen
        name="PriceAlerts"
        component={PriceAlertsScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{headerShown: false}}
      />
      {/* Phase 1.2 Screens */}
      <Stack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}
