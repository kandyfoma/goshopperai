// Firebase Configuration
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Firebase configuration is handled by google-services.json (Android) 
// and GoogleService-Info.plist (iOS)

let initialized = false;

export const initializeFirebase = async (): Promise<void> => {
  if (initialized) {
    return;
  }

  try {
    // Firebase auto-initializes from native config files
    // This function is for any additional setup
    
    // Enable Firestore offline persistence
    await firestore().settings({
      persistence: true,
      cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
    });

    // Set Firestore region (europe-west1 for DRC proximity)
    // This is configured in Firebase Console, not client-side

    initialized = true;
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

// Export Firebase instances
export const firebaseAuth = auth;
export const firebaseFirestore = firestore;
export const firebaseStorage = storage;

// App ID for artifact paths
export const APP_ID = 'goshopperai';

// Collection paths
export const COLLECTIONS = {
  users: (userId: string) => `artifacts/${APP_ID}/users/${userId}`,
  receipts: (userId: string) => `artifacts/${APP_ID}/users/${userId}/receipts`,
  subscription: (userId: string) => `artifacts/${APP_ID}/users/${userId}/subscription/status`,
  prices: `artifacts/${APP_ID}/public/prices`,
  stores: `artifacts/${APP_ID}/public/stores`,
} as const;
