// Type definitions for User and Authentication

export interface User {
  id: string; // Alias for uid
  uid: string;
  isAnonymous: boolean;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserProfile {
  userId: string;
  displayName?: string;
  preferredLanguage: 'fr' | 'en';
  preferredCurrency: 'USD' | 'CDF';
  defaultCity?: string;
  notificationsEnabled: boolean;
  priceAlertsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  userId: string;
  totalScans: number;
  totalSavings: number;
  savingsCurrency: 'USD' | 'CDF';
  favoriteStore?: string;
  mostPurchasedCategory?: string;
  lastScanDate?: Date;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}
