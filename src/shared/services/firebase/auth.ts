// Authentication Service
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {User, UserProfile} from '@/shared/types';
import {COLLECTIONS, APP_ID} from './config';

class AuthService {
  private currentUser: FirebaseAuthTypes.User | null = null;

  constructor() {
    // Listen to auth state changes
    auth().onAuthStateChanged(user => {
      this.currentUser = user;
    });
  }

  /**
   * Sign in anonymously - primary auth method for MVP
   */
  async signInAnonymously(): Promise<User> {
    try {
      const credential = await auth().signInAnonymously();
      const user = this.mapFirebaseUser(credential.user);
      
      // Create user profile if new user
      await this.createUserProfileIfNotExists(user.uid);
      
      return user;
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    const firebaseUser = auth().currentUser;
    if (!firebaseUser) return null;
    return this.mapFirebaseUser(firebaseUser);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!auth().currentUser;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(
    callback: (user: User | null) => void,
  ): () => void {
    return auth().onAuthStateChanged(firebaseUser => {
      const user = firebaseUser ? this.mapFirebaseUser(firebaseUser) : null;
      callback(user);
    });
  }

  /**
   * Create user profile document if it doesn't exist
   */
  private async createUserProfileIfNotExists(userId: string): Promise<void> {
    const profileRef = firestore().doc(`${COLLECTIONS.users(userId)}/profile`);
    const doc = await profileRef.get();

    if (!doc.exists) {
      const profile: UserProfile = {
        userId,
        preferredLanguage: 'fr', // Default to French for DRC
        preferredCurrency: 'USD',
        notificationsEnabled: true,
        priceAlertsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await profileRef.set(profile);
    }
  }

  /**
   * Map Firebase user to our User type
   */
  private mapFirebaseUser(firebaseUser: FirebaseAuthTypes.User): User {
    return {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      isAnonymous: firebaseUser.isAnonymous,
      email: firebaseUser.email || undefined,
      displayName: firebaseUser.displayName || undefined,
      phoneNumber: firebaseUser.phoneNumber || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
    };
  }
}

export const authService = new AuthService();
