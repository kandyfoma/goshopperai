# Data Sources Summary - Items Screens

## Overview

The app has **two separate item list screens** with different data sources:

1. **ItemsScreen** - User's personal items (private data)
2. **CityItemsScreen** - Community items from same city (aggregated data)

---

## 1. ItemsScreen (Personal Items)

### Purpose
Show the user their **personal purchase history** with price tracking across all their receipts.

### Data Source
- **Collection Path**: `artifacts/{APP_ID}/users/{userId}/items/{itemNameNormalized}`
- **Architecture Tier**: **Tier 2 - User Aggregated Items**
- **Maintained By**: Cloud Functions (automatic triggers on receipt create/update/delete)
- **Privacy**: Private to user only

### Data Structure
```typescript
interface ItemData {
  id: string;                 // Canonical product name
  name: string;               // Display name
  nameNormalized: string;     // Normalized for matching
  prices: ItemPrice[];        // Up to 50 recent prices
  minPrice: number;           // Lowest price user paid
  maxPrice: number;           // Highest price user paid
  avgPrice: number;           // Average across all purchases
  storeCount: number;         // Number of different stores
  currency: 'USD' | 'CDF';    // Primary currency
  totalPurchases: number;     // Count of purchases
  lastPurchaseDate: Date;     // Most recent purchase
}

interface ItemPrice {
  storeName: string;
  price: number;
  currency: 'USD' | 'CDF';
  date: Date;
  receiptId: string;          // Links back to source receipt
}
```

### Query
```typescript
// Direct Firestore query to user's items collection
const itemsSnapshot = await firestore()
  .collection('artifacts')
  .doc(APP_ID)
  .collection('users')
  .doc(user.uid)
  .collection('items')
  .orderBy('lastPurchaseDate', 'desc')
  .get();
```

### Features
- ✅ **Pre-aggregated**: No frontend calculation needed
- ✅ **Fast loading**: Single query to get all items
- ✅ **Automatic updates**: Backend triggers maintain data
- ✅ **Price history**: See prices across all stores and dates
- ✅ **Personal stats**: Min/max/avg specific to user's purchases

### Backend Maintenance
The collection is automatically updated by Cloud Functions:

1. **onCreate receipt** → `aggregateItemsOnReceipt` trigger
   - Extracts items from receipt
   - Creates or updates item documents
   - Adds new prices to arrays
   - Recalculates min/max/avg

2. **onUpdate receipt** → Same trigger
   - Updates item documents with new data
   - Recalculates statistics

3. **onDelete receipt** → `cleanupDeletedReceiptItems`
   - Removes prices from deleted receipt
   - Recalculates stats without those prices
   - Deletes items with no remaining prices

---

## 2. CityItemsScreen (Community Items)

### Purpose
Show **aggregated items from all users** in the same city for community price comparison.

### Data Source
- **Method**: Cloud Function `getCityItems(city: string)`
- **Source Collection**: Multiple users' items collections
- **Architecture Tier**: **Uses Tier 2 data but aggregated across users**
- **Privacy**: Shows data from multiple users but respects user privacy

### Data Structure
```typescript
interface CityItemData {
  id: string;                 // Canonical product name
  name: string;               // Display name
  prices: ItemPrice[];        // Prices from all users in city
  minPrice: number;           // Lowest price in city
  maxPrice: number;           // Highest price in city
  avgPrice: number;           // Average across all users
  storeCount: number;         // Number of different stores
  currency: 'USD' | 'CDF';    // Primary currency
  userCount: number;          // How many users purchased this
  lastPurchaseDate: Date;     // Most recent purchase in city
}

interface ItemPrice {
  storeName: string;
  price: number;
  currency: 'USD' | 'CDF';
  date: Date;
  userId: string;             // ⚠️ Note: userId included here
}
```

### Query
```typescript
// Cloud Function call
const functionsInstance = firebase.app().functions('europe-west1');
const result = await functionsInstance.httpsCallable('getCityItems')({
  city: userProfile.defaultCity,
});
```

### Cloud Function Logic
```typescript
// functions/src/items/itemAggregation.ts
export const getCityItems = functions.https.onCall(async (data, context) => {
  const { city } = data;
  
  // 1. Get all users in the city
  const usersSnapshot = await db
    .collection(`artifacts/${config.app.id}/users`)
    .where('defaultCity', '==', city)
    .get();
  
  // 2. For each user, get their items
  const itemsMap = new Map();
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const itemsSnapshot = await db
      .collection(`artifacts/${config.app.id}/users/${userId}/items`)
      .get();
    
    // 3. Aggregate items by canonical name
    itemsSnapshot.docs.forEach(doc => {
      const itemData = doc.data();
      const itemName = itemData.nameNormalized;
      
      if (!itemsMap.has(itemName)) {
        itemsMap.set(itemName, {
          id: itemName,
          name: itemData.name,
          prices: [],
          userCount: 0,
        });
      }
      
      // Add this user's prices to the aggregated item
      const aggregatedItem = itemsMap.get(itemName);
      aggregatedItem.prices.push(...itemData.prices.map(p => ({
        ...p,
        userId: userId,  // Track which user contributed the price
      })));
      aggregatedItem.userCount++;
    });
  }
  
  // 4. Calculate statistics across all users
  // ... recalculate min/max/avg/storeCount
  
  return { success: true, items: Array.from(itemsMap.values()), city };
});
```

### Features
- ✅ **Community insights**: See what other users in your city are buying
- ✅ **Better price comparison**: More data points from multiple users
- ✅ **User count tracking**: See how popular an item is
- ✅ **Cross-user aggregation**: Combined statistics from all users
- ⚠️ **Privacy consideration**: userId is included in prices (may need review)

---

## Comparison Table

| Feature | ItemsScreen (Personal) | CityItemsScreen (Community) |
|---------|----------------------|---------------------------|
| **Data Source** | `users/{userId}/items` | Cloud Function `getCityItems` |
| **Scope** | Single user | All users in city |
| **Privacy** | 100% private | Aggregated (userId in prices) |
| **Query Type** | Direct Firestore query | Cloud Function call |
| **Speed** | Very fast (1 query) | Slower (multiple user queries) |
| **Data Points** | User's purchases only | All city users' purchases |
| **Statistics** | Personal min/max/avg | City-wide min/max/avg |
| **User Count** | N/A | Shows # of users |
| **Purpose** | Personal tracking | Community comparison |

---

## Architecture Alignment

### Before Fix (WRONG ❌)
- **ItemsScreen**: Was manually parsing receipts in frontend
- **Problem**: Slow, inefficient, duplicated backend logic
- **Impact**: Poor performance, wasted client resources

### After Fix (CORRECT ✅)
- **ItemsScreen**: Queries pre-aggregated items from backend
- **Benefit**: Fast, efficient, uses backend-maintained data
- **Architecture**: Properly uses Tier 2 (User Aggregated Items)

### How It Works Together

```
User Scans Receipt
       ↓
Receipt saved (Tier 1)
       ↓
Cloud Function Triggers:
       ↓
├─ savePriceData → Community Prices (Tier 3)
└─ aggregateItemsOnReceipt → User Items (Tier 2)
                                     ↓
                          ┌──────────┴──────────┐
                          ↓                     ↓
                    ItemsScreen         CityItemsScreen
                 (Personal Items)      (Community Items)
                  Query Tier 2          Aggregate Tier 2
                  Single user          Across all city users
```

---

## Privacy & Security Considerations

### ItemsScreen ✅ Fully Private
- User can only access their own items
- Firestore security rules enforce `userId` check
- No cross-user data exposure

### CityItemsScreen ⚠️ Partial Privacy
- **Good**: No direct access to other users' receipts
- **Good**: Data aggregated by city, not individual users
- **Concern**: `userId` included in price objects
- **Recommendation**: Consider removing `userId` from prices or hashing it

### Suggested Improvement
```typescript
// In getCityItems function, remove userId before returning
aggregatedItem.prices.push(...itemData.prices.map(p => ({
  storeName: p.storeName,
  price: p.price,
  currency: p.currency,
  date: p.date,
  // userId: userId,  ❌ Remove this for better privacy
})));
```

This way, users benefit from community data without exposing individual user IDs.

---

## Testing Checklist

### ItemsScreen
- [ ] Verify items load from `users/{userId}/items` collection
- [ ] Confirm min/max/avg prices are pre-calculated
- [ ] Check that prices array contains up to 50 entries
- [ ] Verify sorting by lastPurchaseDate descending
- [ ] Test search functionality with pre-aggregated data

### CityItemsScreen
- [ ] Verify `getCityItems` function is called with correct city
- [ ] Confirm items from multiple users are aggregated
- [ ] Check that userCount reflects number of contributors
- [ ] Verify city-wide statistics are correct
- [ ] Test behavior when no city is set in user profile

### Backend
- [ ] Verify `aggregateItemsOnReceipt` trigger fires on receipt create
- [ ] Confirm items collection updates with new prices
- [ ] Test `cleanupDeletedReceiptItems` removes orphaned prices
- [ ] Check that stats recalculate correctly on updates

---

## Troubleshooting

### ItemsScreen shows no items
1. Check if user has any receipts scanned
2. Verify backend triggers are deployed
3. Check if items collection exists for user
4. Look for errors in Cloud Functions logs

### CityItemsScreen shows no items
1. Verify user profile has `defaultCity` set
2. Check if other users in city have items
3. Verify `getCityItems` function is deployed
4. Check Cloud Functions logs for errors

### Items not updating after scanning receipt
1. Verify `aggregateItemsOnReceipt` trigger is deployed
2. Check Cloud Functions logs for trigger execution
3. Verify receipt has items array populated
4. Check for errors in backend processing

---

## Future Enhancements

1. **Real-time Updates**: Use Firestore `.onSnapshot()` instead of `.get()`
2. **Pagination**: Load items in batches for better performance
3. **Caching**: Cache frequently accessed items locally
4. **Price Alerts**: Notify when tracked items drop below threshold
5. **Privacy Enhancement**: Remove userId from city items prices
6. **Regional Comparison**: Compare prices across multiple cities
7. **Trending Items**: Show most popular items in city this week

---

## Summary

✅ **ItemsScreen** now correctly uses **Tier 2 (User Aggregated Items)** for fast, efficient loading  
✅ **CityItemsScreen** correctly uses **getCityItems Cloud Function** for community aggregation  
✅ Both screens are now aligned with the three-tier architecture  
✅ Performance improved by eliminating frontend aggregation  
⚠️ Consider removing userId from city items for enhanced privacy
