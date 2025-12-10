// App-wide constants

// App Info
export const APP_NAME = 'GoShopperAI';
export const APP_VERSION = '1.0.0';

// API Limits
export const TRIAL_SCAN_LIMIT = 5;
export const RATE_LIMIT_PER_MINUTE = 10;
export const RATE_LIMIT_PER_DAY_FREE = 50;
export const RATE_LIMIT_PER_DAY_PREMIUM = 500;

// Image Limits
export const MAX_IMAGE_WIDTH = 2000;
export const MAX_IMAGE_HEIGHT = 2500;
export const IMAGE_QUALITY = 0.7;
export const THUMBNAIL_SIZE = 200;

// Currency
export const DEFAULT_CURRENCY = 'USD' as const;
export const CDF_TO_USD_RATE = 2700; // Approximate rate

// Subscription Plans
export const MONTHLY_PRICE_USD = 2.99;
export const MONTHLY_PRICE_CDF = 8000;
export const YEARLY_PRICE_USD = 24.99;
export const YEARLY_PRICE_CDF = 67000;

// Subscription Plans Object (for UI)
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Gratuit',
    price: 0,
    features: [
      '5 scans gratuits',
      'Comparaison de prix basique',
      'Historique limité (7 jours)',
    ],
  },
  basic: {
    name: 'Basic',
    price: 1.99,
    features: [
      '30 scans par mois',
      'Comparaison de prix complète',
      'Historique 30 jours',
    ],
  },
  premium: {
    name: 'Premium',
    price: 2.99,
    features: [
      'Scans illimités',
      'Comparaison de prix avancée',
      'Historique illimité',
      'Alertes de prix',
      'Support prioritaire',
    ],
  },
} as const;

// Mobile Money Providers
export const MOBILE_MONEY_PROVIDERS = [
  {id: 'mpesa', name: 'M-Pesa', icon: '📱'},
  {id: 'orange', name: 'Orange Money', icon: '🟠'},
  {id: 'airtel', name: 'Airtel Money', icon: '🔴'},
  {id: 'afrimoney', name: 'AfriMoney', icon: '💚'},
] as const;

// UI Constants
export const SCREEN_PADDING = 16;
export const BORDER_RADIUS = 12;
export const ANIMATION_DURATION = 300;

// Colors (matching NativeWind/Tailwind)
export const COLORS = {
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
  info: '#3b82f6',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: '@goshopperai:preferences',
  ONBOARDING_COMPLETE: '@goshopperai:onboarding',
  LAST_SYNC: '@goshopperai:last_sync',
  CACHED_PRICES: '@goshopperai:cached_prices',
} as const;

// Common DRC Store Names (for normalization)
export const KNOWN_STORES = [
  'Shoprite',
  'Carrefour',
  'Peloustore',
  'Hasson & Frères',
  'City Market',
  'Kin Marché',
  'Super U',
] as const;

// Product Categories (French for DRC)
export const CATEGORIES = {
  FOOD: 'Alimentation',
  BEVERAGES: 'Boissons',
  DAIRY: 'Produits laitiers',
  MEAT_FISH: 'Viandes & Poissons',
  FRUITS_VEG: 'Fruits & Légumes',
  GROCERY: 'Épicerie',
  HYGIENE: 'Hygiène',
  HOUSEHOLD: 'Ménage',
  BABY: 'Bébé',
  OTHER: 'Autres',
} as const;
