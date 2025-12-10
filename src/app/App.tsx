/**
 * GoShopperAI - Invoice Intelligence App
 * Main Application Entry Point
 */

import React, {useEffect} from 'react';
import {StatusBar, LogBox} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {RootNavigator} from '@/navigation/RootNavigator';
import {AuthProvider} from '@/shared/contexts/AuthContext';
import {SubscriptionProvider} from '@/shared/contexts/SubscriptionContext';
import {ThemeProvider} from '@/shared/contexts/ThemeContext';
import {initializeFirebase} from '@/shared/services/firebase/config';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize Firebase on app start
    initializeFirebase();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <NavigationContainer>
                <StatusBar
                  barStyle="dark-content"
                  backgroundColor="transparent"
                  translucent
                />
                <RootNavigator />
              </NavigationContainer>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
