# Data Models

## Overview

Invoice Intelligence uses Cloud Firestore with two distinct data domains:
- **Public Data**: Store prices available to all authenticated users
- **Private Data**: User-specific invoices and settings

## Firestore Collection Structure

```
/artifacts/{appId}/
│
├── public/
│   └── data/
│       ├── storePrices/              # Public price database
│       │   └── {priceId}/
│       │
│       ├── stores/                   # Store directory
│       │   └── {storeId}/
│       │
│       └── categories/               # Item categories
│           └── {categoryId}/
│
└── users/
    └── {userId}/
        ├── invoices/                 # User's scanned invoices
        │   └── {invoiceId}/
        │
        ├── profile/                  # User profile (single doc)
        │   └── settings
        │
        └── subscription/             # Subscription info (single doc)
            └── status
```

## Document Schemas

### 1. Public Store Prices

**Collection**: `/artifacts/{appId}/public/data/storePrices`

```typescript
interface StorePrice {
  // Document ID: auto-generated or composite (itemName_storeId)
  id: string;
  
  // Item information
  itemName: string;              // "Cooking Oil (5L)"
  itemNameNormalized: string;    // "cooking oil 5l" (for search)
  category: string;              // "Groceries"
  unit: string;                  // "5L", "kg", "piece"
  
  // Price information
  price: number;                 // 12.00
  currency: string;              // "USD" or "CDF"
  pricePerUnit?: number;         // For comparison (price per kg, etc.)
  
  // Store information
  storeName: string;             // "Shoprite Gombe"
  storeId: string;               // Reference to stores collection
  storeLocation?: string;        // "Gombe, Kinshasa"
  
  // Metadata
  uploadDate: Timestamp;         // When price was recorded
  validUntil?: Timestamp;        // Optional expiry
  sourceType: 'Store Upload' | 'Admin Entry';
  isActive: boolean;             // For soft delete
  
  // Search helpers
  keywords: string[];            // ["cooking", "oil", "huile"]
}
```

**Example Document:**
```json
{
  "id": "cooking_oil_5l_shop001",
  "itemName": "Cooking Oil (5L)",
  "itemNameNormalized": "cooking oil 5l",
  "category": "Groceries",
  "unit": "5L",
  "price": 12.00,
  "currency": "USD",
  "pricePerUnit": 2.40,
  "storeName": "Shoprite Gombe",
  "storeId": "shop_001",
  "storeLocation": "Gombe, Kinshasa",
  "uploadDate": "2025-12-01T10:00:00Z",
  "validUntil": "2025-12-31T23:59:59Z",
  "sourceType": "Store Upload",
  "isActive": true,
  "keywords": ["cooking", "oil", "huile", "cuisine"]
}
```

### 2. Stores Directory

**Collection**: `/artifacts/{appId}/public/data/stores`

```typescript
interface Store {
  id: string;                    // "shop_001"
  name: string;                  // "Shoprite"
  displayName: string;           // "Shoprite Gombe"
  
  // Location
  address: string;
  city: string;                  // "Kinshasa"
  neighborhood: string;          // "Gombe"
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  // Contact
  phone?: string;
  website?: string;
  
  // Metadata
  category: 'Supermarket' | 'Market' | 'Pharmacy' | 'Electronics' | 'Other';
  isVerified: boolean;
  isActive: boolean;
  lastPriceUpdate: Timestamp;
  totalProducts: number;
  
  // Branding
  logoUrl?: string;
}
```

### 3. Item Categories

**Collection**: `/artifacts/{appId}/public/data/categories`

```typescript
interface Category {
  id: string;                    // "groceries"
  name: string;                  // "Groceries"
  nameFr: string;                // "Épicerie"
  icon: string;                  // "shopping-basket"
  color: string;                 // "#22c55e"
  sortOrder: number;             // For display ordering
  isActive: boolean;
}
```

**Default Categories:**
```json
[
  { "id": "groceries", "name": "Groceries", "nameFr": "Épicerie", "icon": "shopping-basket" },
  { "id": "beverages", "name": "Beverages", "nameFr": "Boissons", "icon": "coffee" },
  { "id": "household", "name": "Household", "nameFr": "Ménage", "icon": "home" },
  { "id": "personal_care", "name": "Personal Care", "nameFr": "Soins personnels", "icon": "heart" },
  { "id": "electronics", "name": "Electronics", "nameFr": "Électronique", "icon": "smartphone" },
  { "id": "pharmacy", "name": "Pharmacy", "nameFr": "Pharmacie", "icon": "plus-circle" },
  { "id": "other", "name": "Other", "nameFr": "Autre", "icon": "package" }
]
```

### 4. User Invoices (Private)

**Collection**: `/artifacts/{appId}/users/{userId}/invoices`

```typescript
interface Invoice {
  id: string;                    // Auto-generated
  userId: string;                // Firebase Auth UID
  
  // Invoice header
  shopName: string;              // "Shoprite"
  shopAddress?: string;
  date: string;                  // "2025-11-28" (invoice date)
  invoiceNumber?: string;        // If visible on receipt
  
  // Totals
  subtotal?: number;
  tax?: number;
  total: number;                 // 35.75
  currency: string;              // "USD"
  
  // Line items
  items: InvoiceItem[];
  
  // Metadata
  timestamp: Timestamp;          // When scanned/saved
  imageUrl?: string;             // Cloud Storage reference
  parseConfidence?: number;      // AI confidence score (0-1)
  wasEdited: boolean;            // User made corrections
  
  // Categorization
  primaryCategory?: string;      // Most common category in items
}

interface InvoiceItem {
  name: string;                  // "Banana (kg)"
  nameNormalized: string;        // "banana kg"
  quantity: number;              // 2.0
  unitPrice: number;             // 1.50
  totalPrice: number;            // 3.00
  unit?: string;                 // "kg"
  category?: string;             // "Groceries"
}
```

**Example Document:**
```json
{
  "id": "inv_abc123",
  "userId": "firebase_auth_uid_12345",
  "shopName": "Shoprite",
  "shopAddress": "Avenue du Commerce, Gombe",
  "date": "2025-11-28",
  "invoiceNumber": "INV-2024-001234",
  "subtotal": 33.00,
  "tax": 2.75,
  "total": 35.75,
  "currency": "USD",
  "items": [
    {
      "name": "Banana (kg)",
      "nameNormalized": "banana kg",
      "quantity": 2.0,
      "unitPrice": 1.50,
      "totalPrice": 3.00,
      "unit": "kg",
      "category": "Groceries"
    },
    {
      "name": "Cooking Oil (5L)",
      "nameNormalized": "cooking oil 5l",
      "quantity": 1.0,
      "unitPrice": 12.50,
      "totalPrice": 12.50,
      "unit": "5L",
      "category": "Groceries"
    }
  ],
  "timestamp": "2025-11-28T14:30:00Z",
  "imageUrl": "gs://invoice-intelligence-drc.appspot.com/receipts/uid_12345/inv_abc123.jpg",
  "parseConfidence": 0.95,
  "wasEdited": true,
  "primaryCategory": "Groceries"
}
```

### 5. User Profile

**Document**: `/artifacts/{appId}/users/{userId}/profile/settings`

```typescript
interface UserProfile {
  userId: string;
  
  // Account info (if upgraded from anonymous)
  email?: string;
  displayName?: string;
  
  // Preferences
  preferredCurrency: 'USD' | 'CDF';
  language: 'fr' | 'en';
  
  // Location (for relevant store suggestions)
  city?: string;
  neighborhood?: string;
  
  // Stats
  totalScans: number;
  totalInvoices: number;
  memberSince: Timestamp;
  lastActive: Timestamp;
  
  // Notification preferences
  notifications: {
    priceAlerts: boolean;
    weeklyReport: boolean;
    promotions: boolean;
  };
}
```

### 6. Subscription Status

**Document**: `/artifacts/{appId}/users/{userId}/subscription/status`

```typescript
interface SubscriptionStatus {
  userId: string;
  
  // Trial tracking
  trialScansUsed: number;        // 0-5
  trialScansLimit: number;       // 5
  trialStartDate: Timestamp;
  
  // Subscription
  isSubscribed: boolean;
  plan?: 'monthly' | 'yearly';
  amount?: number;
  currency?: string;
  
  // Billing
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
  lastPaymentDate?: Timestamp;
  lastPaymentAmount?: number;
  paymentMethod?: 'mobile_money' | 'card';
  paymentProvider?: 'moko_afrika';
  mobileMoneyProvider?: 'mpesa' | 'orange' | 'airtel' | 'afrimoney';
  
  // Payment reference
  transactionId?: string;
  customerPhone?: string;           // Customer phone number
  
  // Status
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  autoRenew: boolean;
}
```

## Indexes

### Required Composite Indexes

```
// For price comparison queries
Collection: storePrices
Fields: itemNameNormalized (ASC), price (ASC)

// For store-specific queries
Collection: storePrices
Fields: storeId (ASC), uploadDate (DESC)

// For category filtering
Collection: storePrices
Fields: category (ASC), price (ASC)

// For user invoice history
Collection: invoices
Fields: userId (ASC), timestamp (DESC)

// For date range reports
Collection: invoices
Fields: userId (ASC), date (DESC)
```

### Index Configuration File

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "storePrices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "itemNameNormalized", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "storePrices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "storePrices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "uploadDate", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Data Relationships

```
┌─────────────────┐
│    Category     │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│   StorePrice    │──────▶│      Store      │
└────────┬────────┘  N:1  └─────────────────┘
         │
         │ (name matching)
         ▼
┌─────────────────┐
│  InvoiceItem    │
└────────┬────────┘
         │ N:1
         ▼
┌─────────────────┐       ┌─────────────────┐
│    Invoice      │──────▶│      User       │
└─────────────────┘  N:1  └────────┬────────┘
                                   │ 1:1
                                   ▼
                          ┌─────────────────┐
                          │  Subscription   │
                          └─────────────────┘
```

## Data Validation Rules

### Client-Side Validation

```typescript
// Invoice validation
const invoiceSchema = z.object({
  shopName: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total: z.number().positive(),
  currency: z.enum(['USD', 'CDF']),
  items: z.array(z.object({
    name: z.string().min(1).max(200),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    totalPrice: z.number().nonnegative(),
  })).min(1),
});

// Price validation
const priceSchema = z.object({
  itemName: z.string().min(1).max(200),
  price: z.number().positive(),
  currency: z.enum(['USD', 'CDF']),
  storeName: z.string().min(1).max(100),
});
```

### Server-Side Validation (Security Rules)

See [SECURITY_RULES.md](./SECURITY_RULES.md) for Firestore security rules.

---

*Next: [Security Rules](./SECURITY_RULES.md)*
