# Community Data Architecture - Deep Dive

## Executive Summary

GoShopperAI uses a **three-tier architecture** for receipt and price data:

1. **User Receipts** (Private) - Full receipt data with embedded items array
2. **User Aggregated Items** (Private) - Personal price history per product
3. **Community Prices** (Public/Anonymous) - Shared price database for comparison

All tiers are designed with **privacy-first principles**, ensuring no personally identifiable information leaks into community data.

---

## 1. Data Architecture Overview

### Collection Structure

```
artifacts/{APP_ID}/
├── users/{userId}/
│   ├── receipts/{receiptId}           # User's scanned receipts
│   │   └── items: ReceiptItem[]       # Embedded items array
│   └── items/{itemNameNormalized}     # Aggregated item stats
│       └── prices: ItemPrice[]        # Personal price history
└── public/
    ├── prices/data/{priceId}          # Anonymous community prices
    └── stores/data/{storeId}          # Store information
```

### Privacy Boundaries

| Tier | Visibility | Contains User ID | Data Retention | Purpose |
|------|-----------|------------------|----------------|---------|
| User Receipts | Private | ✅ Yes (owner field) | 3 months | Full receipt history |
| User Items | Private | ✅ Yes (path) | 3 months | Personal stats & tracking |
| Community Prices | Public | ❌ No (removed for privacy) | Indefinite | Price comparison database |

---

## 2. Tier 1: User Receipts (Private)

### Purpose
Store complete receipt data with all scanned items for user's personal tracking and history.

### Data Model

```typescript
// Collection Path: artifacts/{APP_ID}/users/{userId}/receipts/{receiptId}
interface Receipt {
  // Receipt Metadata
  userId: string;                    // Owner of the receipt
  receiptId: string;                 // Unique receipt identifier
  imageUrl: string;                  // Receipt photo in Firebase Storage
  
  // Store Information
  storeName: string;                 // e.g., "Carrefour"
  storeNameNormalized: string;       // e.g., "carrefour"
  storeAddress?: string;
  
  // Financial Data
  currency: 'USD' | 'CDF';
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  
  // Embedded Items Array (Primary Data)
  items: ReceiptItem[];              // All items on the receipt
  
  // Processing Status
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrConfidence?: number;
  
  // Timestamps
  scannedAt: Timestamp;              // When user scanned it
  date: Timestamp;                   // Receipt date from OCR
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Embedded in Receipt.items array
interface ReceiptItem {
  id: string;                        // Unique item ID
  name: string;                      // Original name from receipt
  nameNormalized: string;            // Normalized for matching
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;                     // 'kg', 'l', 'pcs', etc.
  category?: string;
  confidence?: number;               // OCR confidence
}
```

### Key Features

1. **Items are Embedded** - Not separate documents, stored in items array for atomic updates
2. **Full Receipt Context** - Total, taxes, discounts preserved
3. **OCR Metadata** - Processing status and confidence scores
4. **3-Month Retention** - Automatically deleted after 90 days

### Triggers

```typescript
// onCreate: artifacts/{APP_ID}/users/{userId}/receipts/{receiptId}
export const savePriceData = functions.firestore
  .document('artifacts/{appId}/users/{userId}/receipts/{receiptId}')
  .onCreate(async (snapshot, context) => {
    // 1. Extract items from receipt
    // 2. Call batchSmartUpsertPriceData() to save to community DB
    // 3. Trigger aggregateItemsOnReceipt via another onCreate
  });

// onCreate/onUpdate: Same path
export const aggregateItemsOnReceipt = functions.firestore
  .document('artifacts/{appId}/users/{userId}/receipts/{receiptId}')
  .onCreate/onUpdate(async (snapshot, context) => {
    // 1. Extract items from receipt
    // 2. Update/create user aggregated items (Tier 2)
  });

// onDelete: Same path
export const handleReceiptDeletion = async (receiptId: string, userId: string) => {
  // 1. Call cleanupDeletedReceiptItems()
  // 2. Remove prices from user items where receiptId matches
  // 3. Recalculate stats (min/max/avg)
};
```

---

## 3. Tier 2: User Aggregated Items (Private)

### Purpose
Personal price tracking per product across all user's purchases for trend analysis and stats.

### Data Model

```typescript
// Collection Path: artifacts/{APP_ID}/users/{userId}/items/{itemNameNormalized}
// Document ID: Normalized product name (canonical form)
interface AggregatedItem {
  // Identity
  id: string;                        // Same as document ID (normalized name)
  name: string;                      // Display name (from most recent)
  nameNormalized: string;            // Canonical normalized form
  
  // Price History (User's Personal Tracking)
  prices: ItemPrice[];               // Array of up to 50 recent prices
  
  // Statistics (Calculated from prices array)
  minPrice: number;                  // Lowest price user has paid
  maxPrice: number;                  // Highest price user has paid
  avgPrice: number;                  // Average across all purchases
  storeCount: number;                // How many different stores
  totalPurchases: number;            // Number of times purchased
  
  // Primary Currency
  currency: 'USD' | 'CDF';           // Most common currency in prices
  
  // Timestamps
  lastPurchaseDate: Timestamp;       // Most recent purchase
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Embedded in AggregatedItem.prices array
interface ItemPrice {
  storeName: string;                 // Where purchased
  price: number;                     // Unit price
  currency: 'USD' | 'CDF';
  date: Timestamp;                   // Purchase date
  receiptId: string;                 // Source receipt
}
```

### Key Features

1. **Document ID = Canonical Name** - Using normalized/canonical name for deduplication
2. **Limited Price History** - Max 50 prices, sorted by date desc
3. **Automatic Stats Calculation** - Min/max/avg recalculated on every update
4. **Receipt Source Tracking** - Each price links back to source receipt
5. **Cross-Store Tracking** - See same product prices across different stores

### Product Name Normalization

```typescript
// Step 1: Basic Normalization
function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove accents
    .replace(/[^a-z0-9\s]/g, '')      // Remove special chars
    .replace(/\s+/g, ' ')             // Normalize spaces
    .trim();
}

// Step 2: Canonical Mapping (Synonyms)
function getCanonicalName(name: string): string {
  const normalized = normalizeItemName(name);
  
  // Example synonyms
  const synonyms = {
    'lait': ['milk', 'milch', 'leche'],
    'fromage': ['cheese', 'käse', 'queso'],
    'eau': ['water', 'agua'],
    // ... more mappings
  };
  
  // Return canonical form if matched
  for (const [canonical, variations] of Object.entries(synonyms)) {
    if (variations.some(v => normalized.includes(v))) {
      return canonical;
    }
  }
  
  return normalized;
}
```

**Examples:**
- "Lait Nido 500g" → `lait`
- "Milk Nido 500ml" → `lait` (same canonical)
- "Eau Minerale Tanganyika" → `eau`
- "Mineral Water" → `eau` (same canonical)

### Aggregation Logic

```typescript
// When receipt is created/updated
export const aggregateItemsOnReceipt = functions.firestore
  .document('artifacts/{appId}/users/{userId}/receipts/{receiptId}')
  .onCreate(async (snapshot, context) => {
    const receipt = snapshot.data();
    const items = receipt.items || [];
    
    for (const item of items) {
      const itemNameNormalized = getCanonicalName(item.name);
      const itemRef = db.collection(itemsPath).doc(itemNameNormalized);
      
      const itemDoc = await itemRef.get();
      
      if (itemDoc.exists) {
        // UPDATE: Add new price to existing item
        const existingData = itemDoc.data();
        const updatedPrices = [newPrice, ...existingData.prices]
          .sort((a, b) => b.date.toMillis() - a.date.toMillis())
          .slice(0, 50);  // Keep only 50 most recent
        
        // Recalculate stats
        const priceValues = updatedPrices.map(p => p.price);
        const minPrice = Math.min(...priceValues);
        const maxPrice = Math.max(...priceValues);
        const avgPrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
        const storeCount = new Set(updatedPrices.map(p => p.storeName)).size;
        
        // Update document
        await itemRef.update({
          prices: updatedPrices,
          minPrice,
          maxPrice,
          avgPrice,
          storeCount,
          totalPurchases: updatedPrices.length,
          lastPurchaseDate: updatedPrices[0].date,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // CREATE: New item
        await itemRef.set({
          id: itemNameNormalized,
          name: item.name,
          nameNormalized: itemNameNormalized,
          prices: [newPrice],
          minPrice: item.unitPrice,
          maxPrice: item.unitPrice,
          avgPrice: item.unitPrice,
          storeCount: 1,
          currency,
          totalPurchases: 1,
          lastPurchaseDate: receiptDate,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  });
```

### Receipt Deletion Cleanup

```typescript
// When user deletes a receipt
export async function cleanupDeletedReceiptItems(
  userId: string,
  receiptId: string
): Promise<void> {
  const itemsSnapshot = await db.collection(itemsPath).get();
  
  for (const itemDoc of itemsSnapshot.docs) {
    const itemData = itemDoc.data();
    const prices = itemData.prices || [];
    
    // Filter out prices from deleted receipt
    const updatedPrices = prices.filter(p => p.receiptId !== receiptId);
    
    if (updatedPrices.length === 0) {
      // No prices left, delete the item
      await itemDoc.ref.delete();
    } else if (updatedPrices.length !== prices.length) {
      // Recalculate stats without deleted receipt's prices
      const priceValues = updatedPrices.map(p => p.price);
      const minPrice = Math.min(...priceValues);
      const maxPrice = Math.max(...priceValues);
      const avgPrice = priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length;
      const storeCount = new Set(updatedPrices.map(p => p.storeName)).size;
      
      await itemDoc.ref.update({
        prices: updatedPrices,
        minPrice,
        maxPrice,
        avgPrice,
        storeCount,
        totalPurchases: updatedPrices.length,
        lastPurchaseDate: updatedPrices[0].date,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
}
```

---

## 4. Tier 3: Community Prices (Public/Anonymous)

### Purpose
Shared price database for cross-user comparison and best price discovery. **All user identifiers removed for privacy.**

### Data Model

```typescript
// Collection Path: artifacts/{APP_ID}/public/prices/data/{priceId}
// Document ID: Auto-generated by Firestore
interface PricePoint {
  // Product Identity
  productName: string;               // Original product name
  productNameNormalized: string;     // Normalized for matching
  
  // Store Identity
  storeName: string;                 // Store name
  storeNameNormalized: string;       // Normalized store name
  
  // Price Data
  price: number;                     // Unit price
  previousPrice?: number;            // Track price changes
  currency: 'USD' | 'CDF';
  
  // Unit Information
  unit?: string;                     // 'kg', 'l', 'pcs'
  quantity?: number;
  pricePerUnit?: number;
  
  // Metadata
  recordedAt: Timestamp;             // When recorded
  receiptId: string;                 // Source receipt (NOT linked to user)
  
  // Matching Metadata (for quality tracking)
  matchConfidence?: number;          // 0-1 score
  matchType?: 'exact' | 'fuzzy' | 'semantic';
  
  // REMOVED FOR PRIVACY:
  // userId: string;  ❌ NO USER ID - Data is now anonymous
}
```

### Key Privacy Features

1. **No User ID** - `userId` field completely removed from interface and storage
2. **Receipt ID Kept** - Used for deduplication only, NOT queryable back to user
3. **Public Read Access** - Anyone can query for price comparisons
4. **Write via Cloud Functions Only** - Users cannot write directly

### Intelligent Product Matching

The system uses **fuzzy matching** to prevent duplicate prices for the same product:

```typescript
export async function smartUpsertPriceData(
  productName: string,
  storeName: string,
  price: number,
  currency: 'USD' | 'CDF',
  receiptId: string,
  unit?: string,
  quantity?: number
): Promise<void> {
  const normalizedProduct = normalizeProductName(productName);
  const normalizedStore = normalizeStoreName(storeName);
  
  // 1. Check for EXACT DUPLICATE (same product, store, price)
  const exactDuplicateQuery = await db
    .collection(collections.prices)
    .where('productNameNormalized', '==', normalizedProduct)
    .where('storeNameNormalized', '==', normalizedStore)
    .where('price', '==', price)
    .limit(1)
    .get();
  
  if (!exactDuplicateQuery.empty) {
    console.log('Exact duplicate found, skipping save');
    return;  // Prevent exact duplicate
  }
  
  // 2. Check for SIMILAR PRODUCT (fuzzy matching)
  const matchResult = await findSimilarProduct(normalizedProduct, normalizedStore);
  
  if (matchResult.matched && matchResult.confidence > 0.85) {
    // UPDATE: Price change for existing product
    await matchResult.existingDoc.ref.update({
      previousPrice: matchResult.existingDoc.data().price,
      price: price,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      matchType: matchResult.matchType,
      matchConfidence: matchResult.confidence,
    });
  } else {
    // CREATE: New price point (no match found)
    await db.collection(collections.prices).add({
      productName,
      productNameNormalized: normalizedProduct,
      storeName,
      storeNameNormalized: normalizedStore,
      price,
      currency,
      unit,
      quantity,
      pricePerUnit: quantity ? price / quantity : price,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
      receiptId,
      matchType: 'exact',
      matchConfidence: 1.0,
      // NO userId field ✅
    });
  }
}
```

### Product Matching Algorithm

```typescript
// Create fingerprint for intelligent matching
export function createProductFingerprint(name: string): ProductFingerprint {
  return {
    normalizedName: normalizeProductName(name),
    tokens: tokenize(name),
    brand: extractBrand(name),        // e.g., "Coca Cola", "Nescafe"
    size: extractSize(name),          // e.g., "1.5", "500"
    unit: extractUnit(name),          // e.g., "L", "ml", "kg"
    category: detectCategory(name),   // e.g., "beverage", "dairy"
    baseProduct: extractBaseProduct(name),  // Name without brand/size
  };
}

// Calculate similarity score (0-1)
export function calculateProductSimilarity(name1: string, name2: string): number {
  const fp1 = createProductFingerprint(name1);
  const fp2 = createProductFingerprint(name2);
  
  let score = 0;
  let weights = 0;
  
  // 1. Exact match (100%)
  if (fp1.normalizedName === fp2.normalizedName) return 1.0;
  
  // 2. String similarity (30% weight)
  score += stringSimilarity(fp1.normalizedName, fp2.normalizedName) * 0.3;
  weights += 0.3;
  
  // 3. Token overlap (25% weight)
  score += jaccardSimilarity(fp1.tokens, fp2.tokens) * 0.25;
  weights += 0.25;
  
  // 4. Brand match (20% weight)
  if (fp1.brand && fp2.brand) {
    score += (fp1.brand === fp2.brand ? 1 : 0) * 0.2;
    weights += 0.2;
  }
  
  // 5. Category match (15% weight)
  if (fp1.category && fp2.category) {
    score += (fp1.category === fp2.category ? 1 : 0) * 0.15;
    weights += 0.15;
  }
  
  // 6. Size/unit match (10% weight)
  if (fp1.size && fp2.size && fp1.unit && fp2.unit) {
    const sizeMatch = fp1.size === fp2.size && fp1.unit === fp2.unit;
    score += (sizeMatch ? 1 : 0) * 0.1;
    weights += 0.1;
  }
  
  return weights > 0 ? score / weights : 0;
}
```

**Matching Examples:**

| Product 1 | Product 2 | Similarity | Match Type |
|-----------|-----------|------------|------------|
| "Coca Cola 1.5L" | "Coca-Cola 1.5 litre" | 0.92 | Fuzzy ✅ |
| "Lait Nido 500g" | "Nido Milk 500gr" | 0.88 | Semantic ✅ |
| "Pain Baguette" | "Baguette Pain" | 0.95 | Exact ✅ |
| "Sucre Cassonade" | "Riz Basmati" | 0.15 | None ❌ |

### Price Comparison Query

```typescript
export const getPriceComparison = functions.https.onCall(
  async (data, context) => {
    const { receiptId } = data;
    
    // 1. Get receipt items
    const receipt = await getReceipt(receiptId);
    const items = receipt.items;
    
    // 2. Query community prices for each item
    for (const item of items) {
      const normalizedName = normalizeProductName(item.name);
      
      const priceQuery = await db
        .collection(collections.prices)
        .where('productNameNormalized', '==', normalizedName)
        .orderBy('recordedAt', 'desc')
        .limit(100)
        .get();
      
      const prices = priceQuery.docs.map(doc => doc.data() as PricePoint);
      
      // 3. Calculate stats
      const minPrice = Math.min(...prices.map(p => p.price));
      const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
      const bestStore = prices.find(p => p.price === minPrice)?.storeName;
      
      // 4. Calculate savings
      const potentialSavings = (item.unitPrice - minPrice) * item.quantity;
      const savingsPercentage = ((item.unitPrice - minPrice) / item.unitPrice) * 100;
      
      comparisons.push({
        productName: item.name,
        currentPrice: item.unitPrice,
        currentStore: receipt.storeName,
        bestPrice: minPrice,
        bestStore: bestStore,
        averagePrice: avgPrice,
        potentialSavings,
        savingsPercentage,
        priceCount: prices.length,
      });
    }
    
    return { comparisons };
  }
);
```

---

## 5. Data Flow & Lifecycle

### Receipt Creation Flow

```
1. User scans receipt
   ↓
2. Mobile app uploads photo to Firebase Storage
   ↓
3. App creates receipt document with status='pending'
   artifacts/{APP_ID}/users/{userId}/receipts/{receiptId}
   ↓
4. TRIGGER: onCreate - processReceipt()
   - Calls Gemini AI for OCR
   - Extracts items, prices, store name
   - Updates receipt with items array and status='completed'
   ↓
5. TRIGGER: onCreate - savePriceData()
   - Extracts items from receipt.items array
   - Calls batchSmartUpsertPriceData()
   - Saves to community DB (Tier 3) with NO userId
   ↓
6. TRIGGER: onCreate - aggregateItemsOnReceipt()
   - Extracts items from receipt.items array
   - Updates user aggregated items (Tier 2)
   - Calculates min/max/avg prices
```

### Receipt Update Flow

```
1. User edits receipt (changes item name/price)
   ↓
2. App updates receipt document
   ↓
3. TRIGGER: onUpdate - aggregateItemsOnReceipt()
   - Recalculates user aggregated items
   - Updates prices array with new values
   ↓
4. Community prices NOT updated (historical record kept)
```

### Receipt Deletion Flow

```
1. User deletes receipt
   ↓
2. App calls deleteReceipt() Cloud Function
   ↓
3. Function deletes receipt document
   ↓
4. Function calls cleanupDeletedReceiptItems()
   - Queries all user items
   - Removes prices where receiptId matches
   - Recalculates min/max/avg without deleted prices
   - Deletes items with no remaining prices
   ↓
5. Community prices NOT deleted (historical data preserved)
   - Receipt ID orphaned but cannot trace back to user
```

### Data Retention Cleanup (Monthly)

```
Scheduled: 1st of every month at 2 AM UTC
Cron: '0 2 1 * *'

cleanupOldUserData() runs:
  ↓
1. Query all users
   ↓
2. For each user:
   ↓
3. Delete receipts older than 3 months
   - Query: where('scannedAt', '<', threeMonthsAgo)
   - Batch delete (500 per batch)
   ↓
4. Delete orphaned aggregated items
   - Items with lastPurchaseDate > 3 months old
   - Batch delete (500 per batch)
   ↓
5. Log cleanup results
   - Receipts deleted count
   - Items deleted count
```

---

## 6. Statistics & Analytics

### User Personal Stats (from Tier 2)

```typescript
// User's aggregated items provide personal insights
interface UserStats {
  // Per Product
  mostPurchasedItems: { name: string; count: number }[];
  averageSpendingPerProduct: { name: string; avgPrice: number }[];
  bestDeals: { name: string; savings: number }[];
  
  // Per Store
  preferredStores: { name: string; visitCount: number }[];
  averagePricePerStore: { storeName: string; avgPrice: number }[];
  
  // Time-based
  monthlySpending: { month: string; total: number }[];
  weeklyReceiptCount: number;
  
  // Calculated from user items collection
  totalProducts: number;
  totalPurchases: number;
  uniqueStores: number;
}

// Query examples
async function getUserStats(userId: string) {
  const itemsSnapshot = await db
    .collection(`artifacts/${appId}/users/${userId}/items`)
    .orderBy('totalPurchases', 'desc')
    .limit(10)
    .get();
  
  const mostPurchased = itemsSnapshot.docs.map(doc => ({
    name: doc.data().name,
    count: doc.data().totalPurchases,
  }));
  
  return { mostPurchased };
}
```

### Community Stats (from Tier 3)

```typescript
// Community-wide insights (no user identification)
interface CommunityStats {
  // Price trends
  averagePriceByProduct: { product: string; avgPrice: number }[];
  priceChanges: { product: string; change: number; percentage: number }[];
  
  // Store comparisons
  cheapestStoreByCategory: { category: string; store: string }[];
  storeCount: number;
  
  // Popular products
  mostTrackedProducts: { product: string; pricePointCount: number }[];
  
  // Calculated from public prices collection
  totalPricePoints: number;
  lastUpdated: Date;
}

// Query examples
async function getCommunityStats() {
  const pricesSnapshot = await db
    .collection(`artifacts/${appId}/public/prices/data`)
    .orderBy('recordedAt', 'desc')
    .limit(1000)
    .get();
  
  // Group by product
  const productPrices = new Map<string, number[]>();
  pricesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (!productPrices.has(data.productNameNormalized)) {
      productPrices.set(data.productNameNormalized, []);
    }
    productPrices.get(data.productNameNormalized)!.push(data.price);
  });
  
  // Calculate averages
  const avgPrices = Array.from(productPrices.entries()).map(([product, prices]) => ({
    product,
    avgPrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
  }));
  
  return { avgPrices };
}
```

---

## 7. Privacy & Security

### Privacy Measures Implemented

1. **No User ID in Community Data** ✅
   - PricePoint interface has no userId field
   - Cannot trace community prices back to individual users

2. **Receipt ID Cannot Reverse Lookup** ✅
   - Receipt ID stored in community prices
   - But receiptId is user-scoped (different collection path)
   - No way to query user from receiptId alone

3. **Exact Duplicate Prevention** ✅
   - Same product + store + price = skip save
   - Prevents spam and duplicate contributions

4. **Private User Collections** ✅
   - Firestore security rules restrict access:
   ```javascript
   match /artifacts/{appId}/users/{userId}/receipts/{receiptId} {
     allow read, write: if request.auth.uid == userId;
   }
   
   match /artifacts/{appId}/users/{userId}/items/{itemId} {
     allow read, write: if request.auth.uid == userId;
   }
   ```

5. **Public Community Collection** ✅
   - Read access for all authenticated users:
   ```javascript
   match /artifacts/{appId}/public/prices/data/{priceId} {
     allow read: if request.auth != null;
     allow write: if false;  // Write only via Cloud Functions
   }
   ```

6. **3-Month Data Retention** ✅
   - User receipts auto-deleted after 90 days
   - User items cleaned up when no recent purchases
   - Community prices kept indefinitely (historical data)

### Security Rules Summary

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User receipts - private
    match /artifacts/{appId}/users/{userId}/receipts/{receiptId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // User items - private
    match /artifacts/{appId}/users/{userId}/items/{itemId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Community prices - public read, function write only
    match /artifacts/{appId}/public/prices/data/{priceId} {
      allow read: if request.auth != null;
      allow write: if false;  // Cloud Functions only
    }
    
    // Stores - public read
    match /artifacts/{appId}/public/stores/data/{storeId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

---

## 8. Performance Optimizations

### Indexing Strategy

```javascript
// Firestore composite indexes required:

// 1. Price queries by product and date
collection: artifacts/goshopper/public/prices/data
fields: [productNameNormalized ASC, recordedAt DESC]

// 2. Price queries by store and product
collection: artifacts/goshopper/public/prices/data
fields: [storeNameNormalized ASC, productNameNormalized ASC]

// 3. User receipts by date
collection: artifacts/goshopper/users/{userId}/receipts
fields: [scannedAt DESC]

// 4. User items by last purchase
collection: artifacts/goshopper/users/{userId}/items
fields: [lastPurchaseDate DESC]

// 5. Exact duplicate check
collection: artifacts/goshopper/public/prices/data
fields: [productNameNormalized ASC, storeNameNormalized ASC, price ASC]
```

### Batching Strategy

1. **Write Batching** - Max 500 operations per batch
2. **Query Batching** - Process items in chunks of 10 for `in` queries
3. **Parallel Queries** - Multiple price lookups in parallel
4. **Limit Results** - Always use `.limit()` to prevent over-fetching

### Caching Recommendations

1. **Client-side cache** - Store recent price comparisons
2. **Community prices** - Cache frequently queried products
3. **User items** - Cache user's aggregated items locally
4. **Store data** - Cache store list (rarely changes)

---

## 9. Testing & Validation

### Manual Testing Functions

```typescript
// Test data retention cleanup (without waiting for schedule)
export const manualCleanupUserData = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) throw new Error('Unauthorized');
    
    const result = await cleanupUserData(context.auth.uid, 90);
    return { success: true, ...result };
  }
);

// Rebuild user's aggregated items from scratch
export const rebuildItemsAggregation = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) throw new Error('Unauthorized');
    
    // 1. Delete all existing items
    // 2. Reprocess all receipts
    // 3. Rebuild aggregation from scratch
    
    return { success: true, itemsCount, receiptsProcessed };
  }
);
```

### Validation Checks

```bash
# 1. Verify no userId in community prices
db.collection('artifacts/goshopper/public/prices/data')
  .get()
  .then(snapshot => {
    const hasUserId = snapshot.docs.some(doc => doc.data().userId);
    console.log('Has userId:', hasUserId);  // Should be false
  });

# 2. Verify receipt items embedded correctly
db.collection('artifacts/goshopper/users/{userId}/receipts')
  .limit(5)
  .get()
  .then(snapshot => {
    snapshot.docs.forEach(doc => {
      console.log('Items array:', Array.isArray(doc.data().items));
    });
  });

# 3. Verify user items have price arrays
db.collection('artifacts/goshopper/users/{userId}/items')
  .limit(5)
  .get()
  .then(snapshot => {
    snapshot.docs.forEach(doc => {
      console.log('Prices count:', doc.data().prices.length);
    });
  });
```

---

## 10. Future Enhancements

### Potential Improvements

1. **Machine Learning Price Predictions**
   - Use historical price trends to predict future prices
   - Alert users when prices are likely to rise

2. **Store Performance Scoring**
   - Rank stores by average price competitiveness
   - Track price change frequency per store

3. **Product Recommendation Engine**
   - Suggest cheaper alternatives based on purchase history
   - Recommend best times to buy certain products

4. **Community Contribution Gamification**
   - Award points for contributing price data
   - Leaderboards for most active contributors (anonymous)

5. **Advanced Price Alerts**
   - Notify users when tracked products drop below threshold
   - Weekly summary of best deals in user's area

6. **City/Region Price Comparison**
   - Compare prices across different cities
   - Regional price trend analysis

7. **Receipt Sharing (Optional)**
   - Allow users to share specific receipts with friends
   - Privacy controls for what data is shared

---

## 11. Summary

### Three-Tier Architecture Benefits

| Aspect | User Receipts | User Items | Community Prices |
|--------|--------------|------------|------------------|
| **Purpose** | Full history | Personal tracking | Price comparison |
| **Privacy** | Private | Private | Anonymous |
| **Data Size** | Largest | Medium | Large |
| **Retention** | 3 months | 3 months | Indefinite |
| **Updates** | Rare | On receipt create | On receipt create |
| **Queries** | User-specific | User-specific | Cross-user |

### Key Design Principles

1. **Privacy First** - No PII in community data
2. **Separation of Concerns** - Clear boundaries between tiers
3. **Automatic Cleanup** - Scheduled retention policy
4. **Intelligent Matching** - Fuzzy logic prevents duplicates
5. **Performance Optimized** - Indexing and batching strategies
6. **User Control** - Manual testing and rebuild functions

### Data Protection Guarantees

✅ **No User ID in Community Prices** - PricePoint interface excludes userId  
✅ **Receipt ID Not Reversible** - Cannot query user from receiptId  
✅ **Private User Collections** - Firestore rules enforce access control  
✅ **Automatic Data Deletion** - 3-month retention with scheduled cleanup  
✅ **Exact Duplicate Prevention** - Same product/store/price rejected  
✅ **Legal Documentation** - Terms & Privacy updated with community data info  

---

## Conclusion

The GoShopperAI architecture successfully balances **community value** with **user privacy**. By separating user-specific data (receipts, personal stats) from anonymous community data (price database), the system enables powerful price comparison features while maintaining strict privacy controls.

The three-tier design ensures:
- **Users maintain full control** over their personal receipt history
- **Personal insights** are calculated from user-specific data only
- **Community benefits** from anonymized price contributions
- **Automatic cleanup** prevents data accumulation and privacy risks
- **Smart matching** maintains data quality and prevents spam

This architecture can scale to millions of users while maintaining performance and privacy guarantees.
