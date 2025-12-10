// Export all types
export * from './receipt.types';
export * from './price.types';
export * from './user.types';
export * from './subscription.types';

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  Scanner: undefined;
  ReceiptDetail: {receiptId: string};
  PriceComparison: {receiptId: string};
  Subscription: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Stats: undefined;
  Profile: undefined;
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Common UI types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}
