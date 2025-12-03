# Data Flow Documentation

## Overview

This document describes how data flows through the Invoice Intelligence system, including the dual data pipelines for public and private data.

## Data Flow Diagrams

### 1. Invoice Scanning Flow (Private Data)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INVOICE SCANNING FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

User                    App                     Gemini API              Firestore
 │                       │                          │                       │
 │  1. Tap "Scan"        │                          │                       │
 │──────────────────────▶│                          │                       │
 │                       │                          │                       │
 │  2. Camera opens      │                          │                       │
 │◀──────────────────────│                          │                       │
 │                       │                          │                       │
 │  3. Capture receipt   │                          │                       │
 │──────────────────────▶│                          │                       │
 │                       │                          │                       │
 │                       │  4. Send image + schema  │                       │
 │                       │─────────────────────────▶│                       │
 │                       │                          │                       │
 │                       │  5. Return JSON data     │                       │
 │                       │◀─────────────────────────│                       │
 │                       │                          │                       │
 │  6. Show validation   │                          │                       │
 │◀──────────────────────│                          │                       │
 │                       │                          │                       │
 │  7. Edit & confirm    │                          │                       │
 │──────────────────────▶│                          │                       │
 │                       │                          │                       │
 │                       │  8. Check subscription   │                       │
 │                       │─────────────────────────────────────────────────▶│
 │                       │                          │                       │
 │                       │  9. Subscription status  │                       │
 │                       │◀─────────────────────────────────────────────────│
 │                       │                          │                       │
 │                       │  10. Save invoice        │                       │
 │                       │─────────────────────────────────────────────────▶│
 │                       │                          │                       │
 │                       │  11. Increment trial     │                       │
 │                       │─────────────────────────────────────────────────▶│
 │                       │                          │                       │
 │  12. Success!         │                          │                       │
 │◀──────────────────────│                          │                       │
 │                       │                          │                       │
```

**Step Details:**

| Step | Action | Data |
|------|--------|------|
| 1 | User initiates scan | None |
| 2 | Camera module activates | None |
| 3 | Image captured | `ImageData` (base64 or URI) |
| 4 | API request | `{ image, schema, prompt }` |
| 5 | Parsed response | `InvoiceData` JSON |
| 6 | Display for editing | Parsed items, totals |
| 7 | User corrections | Edited `InvoiceData` |
| 8 | Query subscription | `userId` |
| 9 | Subscription check | `{ isSubscribed, trialRemaining }` |
| 10 | Write invoice | Full `Invoice` document |
| 11 | Update trial count | `trialScansUsed += 1` |
| 12 | Confirmation | Success message |

### 2. Price Comparison Flow (Public Data)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRICE COMPARISON FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

User                    App                     Firestore (Public)      
 │                       │                          │                   
 │  1. Open Compare tab  │                          │                   
 │──────────────────────▶│                          │                   
 │                       │                          │                   
 │                       │  2. Query public prices  │                   
 │                       │─────────────────────────▶│                   
 │                       │                          │                   
 │                       │  3. Return price list    │                   
 │                       │◀─────────────────────────│                   
 │                       │                          │                   
 │  4. Display items     │                          │                   
 │◀──────────────────────│                          │                   
 │                       │                          │                   
 │  5. Search "cooking oil"                         │                   
 │──────────────────────▶│                          │                   
 │                       │                          │                   
 │                       │  6. Filtered query       │                   
 │                       │─────────────────────────▶│                   
 │                       │                          │                   
 │                       │  7. Matching prices      │                   
 │                       │◀─────────────────────────│                   
 │                       │                          │                   
 │  8. Show results      │                          │                   
 │◀──────────────────────│                          │                   
 │                       │                          │                   
 │  9. Tap item detail   │                          │                   
 │──────────────────────▶│                          │                   
 │                       │                          │                   
 │                       │  10. Get all store prices│                   
 │                       │─────────────────────────▶│                   
 │                       │                          │                   
 │                       │  11. Price comparison    │                   
 │                       │◀─────────────────────────│                   
 │                       │                          │                   
 │                       │  12. Get user history    │                   
 │                       │─────────────────────────▶│ (Private invoices)
 │                       │                          │                   
 │  13. Full comparison  │                          │                   
 │◀──────────────────────│                          │                   
 │                       │                          │                   
```

### 3. Store Price Upload Flow (Merchant Portal)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MERCHANT UPLOAD FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Merchant          Portal           Cloud Storage      Cloud Function      Firestore
 │                  │                   │                   │                │
 │  1. Login        │                   │                   │                │
 │─────────────────▶│                   │                   │                │
 │                  │                   │                   │                │
 │  2. Upload CSV   │                   │                   │                │
 │─────────────────▶│                   │                   │                │
 │                  │                   │                   │                │
 │                  │  3. Store file    │                   │                │
 │                  │──────────────────▶│                   │                │
 │                  │                   │                   │                │
 │                  │                   │  4. Trigger       │                │
 │                  │                   │──────────────────▶│                │
 │                  │                   │                   │                │
 │                  │                   │                   │  5. Validate   │
 │                  │                   │                   │───────────────▶│
 │                  │                   │                   │                │
 │                  │                   │                   │  6. Parse CSV  │
 │                  │                   │                   │────────┐       │
 │                  │                   │                   │        │       │
 │                  │                   │                   │◀───────┘       │
 │                  │                   │                   │                │
 │                  │                   │                   │  7. Write prices
 │                  │                   │                   │───────────────▶│
 │                  │                   │                   │                │
 │  8. Success email│                   │                   │                │
 │◀─────────────────────────────────────────────────────────│                │
 │                  │                   │                   │                │
```

**CSV Format Expected:**
```csv
item_name,price,currency,unit,category
Cooking Oil (5L),12.00,USD,5L,Groceries
Rice (25kg),45.00,USD,25kg,Groceries
Bottled Water (1.5L),1.50,USD,1.5L,Beverages
```

### 4. Payment/Subscription Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PAYMENT FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

User          App           Moko Afrika        Webhook Function      Firestore
 │             │                │                    │                   │
 │  1. Paywall │                │                    │                   │
 │◀────────────│                │                    │                   │
 │             │                │                    │                   │
 │  2. Select  │                │                    │                   │
 │────────────▶│                │                    │                   │
 │             │                │                    │                   │
 │             │  3. Init payment                    │                   │
 │             │───────────────▶│                    │                   │
 │             │                │                    │                   │
 │             │  4. Payment URL│                    │                   │
 │             │◀───────────────│ (or USSD code)     │                   │
 │             │                │                    │                   │
 │  5. Mobile Money UI          │                    │                   │
 │◀─────────────────────────────│                    │                   │
 │             │                │                    │                   │
 │  6. Confirm │                │                    │                   │
 │─────────────────────────────▶│                    │                   │
 │             │                │                    │                   │
 │             │                │  7. Webhook        │                   │
 │             │                │───────────────────▶│                   │
 │             │                │                    │                   │
 │             │                │                    │  8. Update sub    │
 │             │                │                    │──────────────────▶│
 │             │                │                    │                   │
 │             │  9. Real-time update               │                   │
 │             │◀───────────────────────────────────────────────────────│
 │             │                │                    │                   │
 │  10. Access │                │                    │                   │
 │◀────────────│                │                    │                   │
 │             │                │                    │                   │
```

### 5. Reporting Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REPORTING FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

User                    App                     Firestore (Private)     
 │                       │                          │                   
 │  1. Open Dashboard    │                          │                   
 │──────────────────────▶│                          │                   
 │                       │                          │                   
 │                       │  2. Query user invoices  │                   
 │                       │─────────────────────────▶│                   
 │                       │                          │                   
 │                       │  3. Invoice list         │                   
 │                       │◀─────────────────────────│                   
 │                       │                          │                   
 │                       │  4. Calculate locally:   │                   
 │                       │     - Monthly total      │                   
 │                       │     - Category breakdown │                   
 │                       │     - Savings estimate   │                   
 │                       │                          │                   
 │  5. Display reports   │                          │                   
 │◀──────────────────────│                          │                   
 │                       │                          │                   
 │  6. Change date range │                          │                   
 │──────────────────────▶│                          │                   
 │                       │                          │                   
 │                       │  7. Re-query with range  │                   
 │                       │─────────────────────────▶│                   
 │                       │                          │                   
 │                       │  8. Filtered invoices    │                   
 │                       │◀─────────────────────────│                   
 │                       │                          │                   
 │  9. Updated reports   │                          │                   
 │◀──────────────────────│                          │                   
 │                       │                          │                   
```

## Query Patterns

### Price Comparison Queries

```typescript
// Get all prices for an item (sorted by price)
const getPricesForItem = async (itemName: string) => {
  const normalized = normalizeItemName(itemName);
  return firestore()
    .collection(`artifacts/${APP_ID}/public/data/storePrices`)
    .where('itemNameNormalized', '==', normalized)
    .where('isActive', '==', true)
    .orderBy('price', 'asc')
    .get();
};

// Search items by keyword
const searchItems = async (query: string) => {
  const keywords = query.toLowerCase().split(' ');
  return firestore()
    .collection(`artifacts/${APP_ID}/public/data/storePrices`)
    .where('keywords', 'array-contains-any', keywords)
    .where('isActive', '==', true)
    .limit(50)
    .get();
};

// Get prices by category
const getPricesByCategory = async (category: string) => {
  return firestore()
    .collection(`artifacts/${APP_ID}/public/data/storePrices`)
    .where('category', '==', category)
    .where('isActive', '==', true)
    .orderBy('price', 'asc')
    .get();
};
```

### User Invoice Queries

```typescript
// Get user's invoices (paginated)
const getUserInvoices = async (userId: string, limit = 20, lastDoc?: DocumentSnapshot) => {
  let query = firestore()
    .collection(`artifacts/${APP_ID}/users/${userId}/invoices`)
    .orderBy('timestamp', 'desc')
    .limit(limit);
  
  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }
  
  return query.get();
};

// Get invoices in date range
const getInvoicesInRange = async (userId: string, startDate: Date, endDate: Date) => {
  return firestore()
    .collection(`artifacts/${APP_ID}/users/${userId}/invoices`)
    .where('date', '>=', startDate.toISOString().split('T')[0])
    .where('date', '<=', endDate.toISOString().split('T')[0])
    .orderBy('date', 'desc')
    .get();
};

// Get user's price history for specific item
const getUserPriceHistory = async (userId: string, itemName: string) => {
  const invoices = await firestore()
    .collection(`artifacts/${APP_ID}/users/${userId}/invoices`)
    .orderBy('timestamp', 'desc')
    .get();
  
  const prices: UserPriceHistory[] = [];
  
  invoices.forEach(doc => {
    const invoice = doc.data();
    const item = invoice.items.find(i => 
      normalizeItemName(i.name) === normalizeItemName(itemName)
    );
    
    if (item) {
      prices.push({
        price: item.unitPrice,
        date: invoice.date,
        store: invoice.shopName,
      });
    }
  });
  
  return prices;
};
```

## Real-Time Listeners

### Subscription Status Listener

```typescript
// Listen for subscription changes (for payment confirmation)
const subscribeToSubscriptionStatus = (userId: string, callback: (status: SubscriptionStatus) => void) => {
  return firestore()
    .doc(`artifacts/${APP_ID}/users/${userId}/subscription/status`)
    .onSnapshot(doc => {
      if (doc.exists) {
        callback(doc.data() as SubscriptionStatus);
      }
    });
};
```

### Invoice List Listener

```typescript
// Real-time invoice updates
const subscribeToInvoices = (userId: string, callback: (invoices: Invoice[]) => void) => {
  return firestore()
    .collection(`artifacts/${APP_ID}/users/${userId}/invoices`)
    .orderBy('timestamp', 'desc')
    .limit(50)
    .onSnapshot(snapshot => {
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      callback(invoices);
    });
};
```

## Error Handling

### Network Errors

```typescript
const handleFirestoreError = (error: FirestoreError) => {
  switch (error.code) {
    case 'permission-denied':
      // User not authorized - redirect to auth
      return 'Access denied. Please sign in again.';
    
    case 'unavailable':
      // Offline - use cached data
      return 'You appear to be offline. Showing cached data.';
    
    case 'resource-exhausted':
      // Rate limited
      return 'Too many requests. Please wait a moment.';
    
    default:
      return 'Something went wrong. Please try again.';
  }
};
```

### Offline Support

```typescript
// Enable offline persistence
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

// Check network status before sync-critical operations
const saveInvoice = async (invoice: Invoice) => {
  const networkStatus = await NetInfo.fetch();
  
  if (!networkStatus.isConnected) {
    // Queue for later sync
    await AsyncStorage.setItem(
      `pending_invoice_${Date.now()}`,
      JSON.stringify(invoice)
    );
    return { success: true, pending: true };
  }
  
  // Normal save
  return firestore()
    .collection(`artifacts/${APP_ID}/users/${invoice.userId}/invoices`)
    .add(invoice);
};
```

---

*Next: [API Contracts](../api/API_CONTRACTS.md)*
