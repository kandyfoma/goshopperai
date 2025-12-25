/**
 * @format
 */

// CRITICAL: This must be at the very top before any other imports
import 'react-native-gesture-handler';

import {AppRegistry} from 'react-native';
import notifee, {EventType} from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

// Register background event handler for notifee
// This is required to handle notification events when the app is in background/killed state
notifee.onBackgroundEvent(async ({type, detail}) => {
  console.log('Background notification event:', type, detail);

  switch (type) {
    case EventType.DISMISSED:
      console.log('User dismissed notification', detail.notification?.id);
      break;
    case EventType.PRESS:
      console.log('User pressed notification', detail.notification?.id);
      break;
    case EventType.ACTION_PRESS:
      console.log('User pressed action:', detail.pressAction?.id);
      break;
    default:
      break;
  }
});

AppRegistry.registerComponent(appName, () => App);
