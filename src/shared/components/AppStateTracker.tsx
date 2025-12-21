// App State Tracker - Tracks user sessions for ML behavior analysis
import {useEffect, useRef} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {useAuth} from '@/shared/contexts';
import {userBehaviorService} from '@/shared/services/firebase';

export function AppStateTracker() {
  const {user} = useAuth();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const sessionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // App going to background or inactive
      if (
        appState.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        
        // Only track sessions longer than 5 seconds
        if (user?.uid && sessionDuration >= 5) {
          userBehaviorService
            .trackUserSession(user.uid, sessionDuration)
            .catch(err => console.log('Failed to track session:', err));
        }
      }

      // App coming to foreground
      if (
        (appState.current === 'background' || appState.current === 'inactive') &&
        nextAppState === 'active'
      ) {
        sessionStartTime.current = Date.now();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user?.uid]);

  return null;
}
