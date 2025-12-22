# Item Data Architecture

## Overview

GoShopper maintains **TWO separate data stores** for item/price data:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FIRESTORE DATABASE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  USER PERSONAL DATA (user can delete)                            │  │
│  │  Path: artifacts/goshopper/users/{userId}/                       │  │
│  │                                                                  │  │
│  │  ├── receipts/{receiptId}    ← User's scanned receipts          │  │
│  │  │   └── items[], total, storeName, date, etc.                  │  │
│  │  │                                                               │  │
│  │  └── items/{itemId}          ← User's personal item history     │  │
│  │      └── prices[], minPrice, maxPrice, avgPrice, etc.           │  │
│  │                                                                  │  │
│  │  🗑️ DELETED when user deletes their receipts                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MASTER CITY ITEMS TABLE (community data - NEVER deleted)        │  │
│  │  Path: artifacts/goshopper/cityItems/{city}/items/{itemId}       │  │
│  │                                                                  │  │
│  │  Example: cityItems/Lubumbashi/items/coca_cola                   │  │
│  │                                                                  │  │
│  │  Contains:                                                       │  │
│  │  - prices[] with userId tracking (who bought, where, when)       │  │
│  │  - minPrice, maxPrice, avgPrice across ALL users                 │  │
│  │  - storeCount (how many stores sell this)                        │  │
│  │  - userCount (how many users bought this)                        │  │
│  │  - userIds[] (array of contributing users)                       │  │
│  │                                                                  │  │
│  │  🔒 NEVER deleted by users - community price database            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### When User Scans a Receipt

```
User scans receipt
       │
       ▼
┌──────────────────────┐
│ Receipt saved to     │
│ users/{userId}/      │
│ receipts/{receiptId} │
└──────────┬───────────┘
           │
           │ Triggers Cloud Function:
           │ aggregateItemsOnReceipt
           │
           ▼
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐  ┌─────────────┐
│ UPDATE  │  │ UPDATE      │
│ User    │  │ City Master │
│ Items   │  │ Items       │
└─────────┘  └─────────────┘
    │             │
    ▼             ▼
users/{uid}/   cityItems/
items/{item}   {city}/items/{item}
```

### When User Deletes a Receipt

```
User deletes receipt
       │
       ▼
┌──────────────────────┐
│ Receipt deleted from │
│ users/{userId}/      │
│ receipts/{receiptId} │
└──────────┬───────────┘
           │
           │ Triggers Cloud Function:
           │ cleanupDeletedReceiptItems
           │
           ▼
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐  ┌─────────────┐
│ CLEANUP │  │ UNTOUCHED   │
│ User    │  │ City Master │
│ Items   │  │ Items       │
└─────────┘  └─────────────┘
    │             │
    │             │
Prices removed   Prices REMAIN
from user's      for community
collection       database
```

## Data Schemas

### User Personal Item
```typescript
// Path: artifacts/goshopper/users/{userId}/items/{itemId}
interface UserItem {
  id: string;                    // e.g., "coca_cola"
  name: string;                  // e.g., "Coca Cola 330ml"
  nameNormalized: string;        // e.g., "coca cola"
  prices: ItemPrice[];           // User's price history (max 50)
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  storeCount: number;            // Stores user bought from
  currency: 'USD' | 'CDF';
  totalPurchases: number;
  lastPurchaseDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ItemPrice {
  storeName: string;
  price: number;
  currency: 'USD' | 'CDF';
  date: Timestamp;
  receiptId: string;
}
```

### Master City Item
```typescript
// Path: artifacts/goshopper/cityItems/{city}/items/{itemId}
interface CityItem {
  id: string;                    // e.g., "coca_cola"
  name: string;                  // Best display name
  nameNormalized: string;
  city: string;                  // e.g., "Lubumbashi"
  prices: CityItemPrice[];       // All prices (max 100)
  minPrice: number;              // Lowest across ALL stores/users
  maxPrice: number;              // Highest across ALL stores/users
  avgPrice: number;              // Average across ALL stores/users
  storeCount: number;            // Total stores selling this
  userCount: number;             // Total users who bought this
  userIds: string[];             // List of contributing users
  currency: 'USD' | 'CDF';
  totalPurchases: number;
  lastPurchaseDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface CityItemPrice extends ItemPrice {
  userId: string;                // Who recorded this price
}
```

## Cloud Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `aggregateItemsOnReceipt` | `onWrite` receipt | Updates BOTH user items AND city items |
| `cleanupDeletedReceiptItems` | Called on receipt delete | Cleans ONLY user items (NOT city items) |
| `getCityItems` | HTTPS callable | Reads from master city items table |
| `rebuildItemsAggregation` | HTTPS callable | Rebuilds user's personal items only |

## Why This Architecture?

### 1. Community Price Database
- Even if a user deletes their account, their contribution to community pricing remains
- Builds up a comprehensive price database over time
- More users = more accurate pricing data

### 2. User Privacy
- Users can delete their personal data (receipts + personal items)
- Their identity is stored as `userId` in city items, but no personal info
- Users can see their own history separately from community data

### 3. Performance
- City items are pre-aggregated, no need to query all users
- Single collection query for city prices
- Scales with number of products, not number of users

### 4. Data Integrity
- Community data persists through user churn
- Price history maintains accuracy over time
- Prevents data loss from accidental deletions

## Security Rules

```javascript
// City items - read by authenticated users in that city
match /cityItems/{city}/items/{itemId} {
  allow read: if request.auth != null;
  allow write: if false; // Only Cloud Functions can write
}

// User items - full access by owner only
match /users/{userId}/items/{itemId} {
  allow read, write: if request.auth.uid == userId;
}
```

## Future Considerations

1. **Data Retention**: Implement cleanup for very old city prices (> 1 year)
2. **Price Anomaly Detection**: Flag outlier prices in city items
3. **Regional Aggregation**: Roll up city data to country/region level
4. **Export API**: Allow bulk export of anonymized pricing data
