# Component Architecture

## Overview

The React Native application is organized into a modular component structure, optimized for the DRC market with Hermes engine, offline-first data, and image compression.

## Key Optimizations

| Optimization | Technology | Benefit |
|--------------|------------|---------|
| **JS Engine** | Hermes | 53% faster startup, 33% smaller bundle |
| **Offline Database** | WatermelonDB | Complex queries work offline |
| **Image Compression** | react-native-image-resizer | 90% smaller uploads |
| **Fallback OCR** | ML Kit | Basic scanning without internet |
| **State Management** | Zustand | Lightweight, fast |

## Project Structure

```
src/
├── app/                        # App entry and configuration
│   ├── App.tsx                 # Root component
│   ├── navigation/             # Navigation configuration
│   │   ├── RootNavigator.tsx
│   │   ├── MainTabNavigator.tsx
│   │   └── AuthNavigator.tsx
│   └── providers/              # Context providers
│       ├── AuthProvider.tsx
│       ├── SubscriptionProvider.tsx
│       ├── DatabaseProvider.tsx    # WatermelonDB provider
│       └── ThemeProvider.tsx
│
├── database/                   # WatermelonDB setup (NEW)
│   ├── index.ts                # Database initialization
│   ├── schema.ts               # Table schemas
│   ├── models/                 # Model definitions
│   │   ├── Invoice.ts
│   │   ├── InvoiceItem.ts
│   │   └── ShoppingListItem.ts
│   └── sync.ts                 # Firestore sync logic
│
├── features/                   # Feature-based modules
│   ├── scanner/                # Invoice scanning feature
│   │   ├── screens/
│   │   │   ├── CameraScreen.tsx
│   │   │   ├── ValidationScreen.tsx
│   │   │   └── OfflineResultScreen.tsx  # NEW
│   │   ├── components/
│   │   │   ├── CameraOverlay.tsx
│   │   │   ├── ItemEditor.tsx
│   │   │   ├── ScanPreview.tsx
│   │   │   └── CompressionIndicator.tsx # NEW
│   │   ├── hooks/
│   │   │   ├── useInvoiceScanner.ts
│   │   │   └── useHybridScanner.ts      # NEW (online/offline)
│   │   └── services/
│   │       ├── geminiProxy.ts           # Cloud Function client
│   │       ├── imageCompressor.ts       # NEW
│   │       └── offlineOcr.ts            # NEW (ML Kit)
│   │
│   ├── comparison/             # Price comparison feature
│   │   ├── screens/
│   │   │   ├── ComparisonListScreen.tsx
│   │   │   └── ItemDetailScreen.tsx
│   │   ├── components/
│   │   │   ├── PriceCard.tsx
│   │   │   ├── BestPriceBadge.tsx
│   │   │   └── StoreFilter.tsx
│   │   └── hooks/
│   │       └── usePriceComparison.ts
│   │
│   ├── reports/                # Spending reports feature
│   │   ├── screens/
│   │   │   ├── DashboardScreen.tsx
│   │   │   └── ReportDetailScreen.tsx
│   │   ├── components/
│   │   │   ├── SpendingChart.tsx
│   │   │   ├── SavingsCard.tsx
│   │   │   └── CategoryBreakdown.tsx
│   │   └── hooks/
│   │       ├── useSpendingReports.ts
│   │       └── useOfflineReports.ts     # NEW (WatermelonDB)
│   │
│   ├── subscription/           # Payment & subscription
│   │   ├── screens/
│   │   │   ├── PaywallScreen.tsx
│   │   │   └── SubscriptionScreen.tsx
│   │   ├── components/
│   │   │   ├── PaymentModal.tsx
│   │   │   ├── PlanCard.tsx
│   │   │   └── TrialCounter.tsx
│   │   └── hooks/
│   │       └── useSubscription.ts
│   │
│   ├── alerts/                 # Price alerts (NEW)
│   │   ├── screens/
│   │   │   ├── AlertsListScreen.tsx
│   │   │   └── CreateAlertScreen.tsx
│   │   ├── components/
│   │   │   └── AlertCard.tsx
│   │   └── hooks/
│   │       └── usePriceAlerts.ts
│   │
│   ├── shopping/               # Shopping list (NEW)
│   │   ├── screens/
│   │   │   ├── ShoppingListScreen.tsx
│   │   │   └── OptimizedPlanScreen.tsx
│   │   ├── components/
│   │   │   └── ShoppingItem.tsx
│   │   └── hooks/
│   │       └── useShoppingOptimizer.ts
│   │
│   └── profile/                # User profile
│       ├── screens/
│       │   ├── ProfileScreen.tsx
│       │   └── AchievementsScreen.tsx   # NEW
│       └── components/
│           ├── SettingsItem.tsx
│           └── AchievementBadge.tsx     # NEW
│
├── shared/                     # Shared/common code
│   ├── components/             # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── OfflineBanner.tsx           # NEW
│   │   └── SyncIndicator.tsx           # NEW
│   │
│   ├── hooks/                  # Shared hooks
│   │   ├── useAuth.ts
│   │   ├── useFirestore.ts
│   │   ├── useNetworkStatus.ts
│   │   └── useDatabase.ts              # NEW (WatermelonDB)
│   │
│   ├── services/               # External service integrations
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   ├── firestore.ts
│   │   │   ├── functions.ts            # NEW (Cloud Functions client)
│   │   │   └── storage.ts
│   │   ├── gemini/
│   │   │   └── proxy.ts                # Calls Cloud Function
│   │   ├── image/
│   │   │   ├── compression.ts          # NEW
│   │   │   └── presets.ts              # NEW
│   │   ├── ocr/
│   │   │   ├── mlkit.ts                # NEW
│   │   │   └── offlineParser.ts        # NEW
│   │   └── payment/
│   │       └── mokoafrika.ts           # Moko Afrika DRC payments
│   │
│   ├── utils/                  # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── network.ts                  # NEW (connectivity check)
│   │
│   └── types/                  # TypeScript type definitions
│       ├── invoice.types.ts
│       ├── price.types.ts
│       ├── user.types.ts
│       ├── api.types.ts
│       └── database.types.ts           # NEW (WatermelonDB)
│
├── store/                      # Global state management
│   ├── index.ts
│   ├── authStore.ts
│   ├── invoiceStore.ts
│   ├── priceStore.ts
│   ├── subscriptionStore.ts
│   ├── alertStore.ts                   # NEW
│   └── syncStore.ts                    # NEW (sync status)
│
└── assets/                     # Static assets
    ├── images/
    ├── fonts/
    └── animations/
```

## Component Hierarchy

```
App
├── Providers
│   ├── ThemeProvider
│   ├── AuthProvider
│   └── SubscriptionProvider
│
└── RootNavigator
    ├── AuthNavigator (if not authenticated)
    │   └── WelcomeScreen
    │
    └── MainTabNavigator (if authenticated)
        ├── Tab: Home (Dashboard)
        │   └── DashboardScreen
        │       ├── SpendingChart
        │       ├── SavingsCard
        │       └── RecentInvoices
        │
        ├── Tab: Scan
        │   ├── CameraScreen
        │   │   ├── CameraOverlay
        │   │   └── CaptureButton
        │   │
        │   └── ValidationScreen (after capture)
        │       ├── ScanPreview
        │       ├── ItemEditor (list)
        │       └── SaveButton
        │
        ├── Tab: Compare
        │   ├── ComparisonListScreen
        │   │   ├── SearchBar
        │   │   ├── StoreFilter
        │   │   └── PriceCard (list)
        │   │
        │   └── ItemDetailScreen
        │       ├── PriceHistory
        │       └── StoreComparison
        │
        └── Tab: Profile
            └── ProfileScreen
                ├── SubscriptionStatus
                ├── SettingsItem (list)
                └── LogoutButton
```

## Key Components Specification

### 1. Scanner Feature (Updated)

#### Hybrid Scanner Hook
```typescript
// src/features/scanner/hooks/useHybridScanner.ts

interface ScanResult {
  method: 'gemini' | 'offline_ocr' | 'manual';
  confidence: 'high' | 'medium' | 'low';
  data: Partial<ParsedReceipt>;
  needsReview: boolean;
}

export function useHybridScanner() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);
  const isOnline = useNetworkStatus();
  
  const scanReceipt = async (imageUri: string): Promise<ScanResult> => {
    setIsProcessing(true);
    
    try {
      // Step 1: Always compress first
      const compressed = await compressReceiptImage(imageUri);
      setCompressionStats({
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        savingsPercent: compressed.savingsPercent,
      });
      
      if (isOnline) {
        // Online: Use Gemini via Cloud Function
        const base64 = await imageToBase64(compressed.uri);
        const result = await geminiProxy.parseReceipt(base64);
        
        if (result.success) {
          return {
            method: 'gemini',
            confidence: 'high',
            data: result.data,
            needsReview: false,
          };
        }
      }
      
      // Offline or Gemini failed: Use ML Kit
      const ocrResult = await performOnDeviceOcr(compressed.uri);
      
      if (ocrResult.success) {
        const parsed = parseReceiptTextBasic(ocrResult.lines);
        return {
          method: 'offline_ocr',
          confidence: ocrResult.confidence > 0.8 ? 'medium' : 'low',
          data: parsed,
          needsReview: true,
        };
      }
      
      // Last resort: Manual entry
      return {
        method: 'manual',
        confidence: 'low',
        data: {},
        needsReview: true,
      };
    } finally {
      setIsProcessing(false);
    }
  };
  
  return { scanReceipt, isProcessing, compressionStats, isOnline };
}
```

#### CameraScreen (Updated)
```typescript
interface CameraScreenProps {
  // No props - entry point
}

// State
- cameraReady: boolean
- flashMode: 'on' | 'off' | 'auto'
- isCapturing: boolean
- isOnline: boolean          // NEW: network status
- compressionMode: 'auto' | 'high' | 'low'  // NEW

// Actions
- captureImage(): Promise<ImageData>
- toggleFlash(): void
- navigateToValidation(imageUri: string, scanResult: ScanResult): void
```

#### ValidationScreen (Updated)
```typescript
interface ValidationScreenProps {
  imageUri: string;
  scanResult: ScanResult;  // NEW: includes method & confidence
}

// State
- parsedData: InvoiceData | null
- isLoading: boolean
- editedItems: InvoiceItem[]
- hasErrors: boolean
- scanMethod: 'gemini' | 'offline_ocr' | 'manual'  // NEW
- confidence: 'high' | 'medium' | 'low'             // NEW

// Actions
- updateItem(index: number, item: InvoiceItem): void
- addItem(): void
- removeItem(index: number): void
- saveInvoice(): Promise<void>  // Saves to WatermelonDB + Firestore
- reprocessWhenOnline(): void   // NEW: queue for re-scan
```

### 2. Comparison Feature

#### ComparisonListScreen
```typescript
interface ComparisonListScreenProps {
  // No props - entry point
}

// State
- items: PriceItem[]
- searchQuery: string
- selectedStore: string | null
- isLoading: boolean

// Actions
- searchItems(query: string): void
- filterByStore(storeId: string): void
- navigateToDetail(itemId: string): void
```

#### PriceCard Component
```typescript
interface PriceCardProps {
  itemName: string;
  prices: StorePrice[];
  bestPrice: StorePrice;
  userPriceHistory?: UserPrice[];
  onPress: () => void;
}
```

### 3. Reports Feature

#### DashboardScreen
```typescript
interface DashboardScreenProps {
  // No props - entry point
}

// State
- monthlySpending: number
- estimatedSavings: number
- recentInvoices: Invoice[]
- spendingByCategory: CategoryData[]
- dateRange: { start: Date; end: Date }

// Actions
- changeDateRange(range: DateRange): void
- navigateToInvoice(invoiceId: string): void
- refreshData(): void
```

### 4. Subscription Feature

#### PaywallScreen
```typescript
interface PaywallScreenProps {
  onDismiss: () => void;
  onSuccess: () => void;
}

// State
- selectedPlan: SubscriptionPlan
- isProcessing: boolean
- paymentError: string | null

// Actions
- selectPlan(plan: SubscriptionPlan): void
- initiatePayment(): Promise<void>
- handlePaymentCallback(result: PaymentResult): void
```

## State Management (Zustand)

### Store Structure

```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  linkAccount: (email: string, password: string) => Promise<void>;
}

// invoiceStore.ts
interface InvoiceState {
  invoices: Invoice[];
  currentInvoice: Invoice | null;
  isLoading: boolean;
  
  // Actions
  fetchInvoices: () => Promise<void>;
  saveInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
}

// priceStore.ts
interface PriceState {
  publicPrices: PriceItem[];
  searchResults: PriceItem[];
  isLoading: boolean;
  
  // Actions
  fetchPublicPrices: () => Promise<void>;
  searchPrices: (query: string) => Promise<void>;
}

// subscriptionStore.ts
interface SubscriptionState {
  trialScansRemaining: number;
  isSubscribed: boolean;
  subscriptionEndDate: Date | null;
  
  // Actions
  decrementTrialScan: () => void;
  updateSubscription: (status: SubscriptionStatus) => void;
  checkSubscriptionStatus: () => Promise<void>;
}
```

## Navigation Structure

```typescript
// Navigation Types
type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Paywall: undefined;
};

type AuthStackParamList = {
  Welcome: undefined;
};

type MainTabParamList = {
  Dashboard: undefined;
  Scan: undefined;
  Compare: undefined;
  Profile: undefined;
};

type ScanStackParamList = {
  Camera: undefined;
  Validation: { imageUri: string };
  Success: { invoiceId: string };
};

type CompareStackParamList = {
  List: undefined;
  ItemDetail: { itemId: string };
};
```

## Styling Approach (NativeWind/Tailwind)

### Theme Configuration
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        secondary: {
          500: '#3b82f6',
          600: '#2563eb',
        },
        accent: {
          500: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
        heading: ['Poppins', 'system-ui'],
      },
    },
  },
};
```

### Component Styling Example
```tsx
// Consistent button styling
<TouchableOpacity 
  className="bg-primary-500 px-6 py-3 rounded-xl active:bg-primary-600"
>
  <Text className="text-white font-semibold text-center">
    Scan Invoice
  </Text>
</TouchableOpacity>
```

## Error Handling Strategy

```typescript
// Global error boundary
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log to analytics/crash reporting
    logError(error, errorInfo);
  }
}

// API error handling
const handleApiError = (error: Error) => {
  if (error instanceof NetworkError) {
    showToast('No internet connection');
  } else if (error instanceof AuthError) {
    // Redirect to auth
  } else {
    showToast('Something went wrong');
  }
};
```

---

*Next: [Infrastructure Setup](./INFRASTRUCTURE.md)*
