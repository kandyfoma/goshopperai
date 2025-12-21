# Shopping List Enhancements - Community Item Search & Price Comparison

## Overview

Enhanced the shopping list feature to integrate with community price data, enabling users to:
1. Search and add items from the community database
2. View price comparisons across different shops for each item
3. See total cost in both USD and CDF currencies

---

## New Features

### 1. Community Item Search

**What Changed:**
- Add Item Modal now includes a search bar
- Searches through community items (via `getCityItems` function)
- Real-time search with debouncing (300ms delay)
- Displays top 10 search results with price ranges

**User Flow:**
```
1. User opens Add Item modal
2. Types in search bar: "sucre"
3. Search results appear showing:
   - Item name: "Sucre"
   - Store count: "5 magasins"
   - Price range: "$2.50 - $4.00"
4. User clicks on search result
5. Item details populate with name
6. User adjusts quantity and adds to list
```

**Technical Implementation:**
```typescript
// Search function with debouncing
const searchCommunityItems = useCallback(async (query: string) => {
  if (!query.trim() || !userProfile?.defaultCity) {
    setSearchResults([]);
    return;
  }
  
  setIsSearching(true);
  try {
    const functionsInstance = firebase.app().functions('europe-west1');
    const result = await functionsInstance.httpsCallable('getCityItems')({
      city: userProfile.defaultCity,
    });
    
    // Filter items by search query
    const filtered = data.items.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered.slice(0, 10));
  } finally {
    setIsSearching(false);
  }
}, [userProfile?.defaultCity]);
```

### 2. Price Comparison Per Item

**What Changed:**
- When user selects a search result, price comparison panel appears
- Shows top 5 shops sorted by price (lowest first)
- Each shop displays:
  - Rank badge (#1, #2, #3, etc.)
  - Shop name
  - Currency type
  - Price (best price highlighted in green)

**Visual Design:**
```
┌─────────────────────────────────────┐
│ Prix dans différents magasins      │
├─────────────────────────────────────┤
│ 🥇 Carrefour        USD    $2.50   │ ← Best price (green)
│ 🥈 Shoprite         USD    $2.75   │
│ 🥉 Kin Marché       USD    $2.90   │
│ 4️⃣ Casino           USD    $3.20   │
│ 5️⃣ City Market      CDF    8,500FC │
└─────────────────────────────────────┘
```

**Code Example:**
```typescript
{selectedItemForAdd && (
  <View style={styles.priceComparisonContainer}>
    <Text style={styles.priceComparisonTitle}>
      Prix dans différents magasins
    </Text>
    <ScrollView style={styles.priceList} nestedScrollEnabled>
      {selectedItemForAdd.prices
        .sort((a, b) => a.price - b.price)
        .slice(0, 5)
        .map((priceInfo, index) => (
          <View key={`${priceInfo.storeName}-${index}`} style={styles.priceItem}>
            <View style={styles.priceRank}>
              <Text style={styles.priceRankText}>{index + 1}</Text>
            </View>
            <View style={styles.priceStoreInfo}>
              <Text style={styles.priceStoreName}>{priceInfo.storeName}</Text>
              <Text style={styles.priceCurrency}>{priceInfo.currency}</Text>
            </View>
            <Text style={[
              styles.priceAmount,
              index === 0 && styles.priceAmountBest // Green for best price
            ]}>
              {formatCurrency(priceInfo.price, priceInfo.currency)}
            </Text>
          </View>
        ))}
    </ScrollView>
  </View>
)}
```

### 3. Enhanced Item Display with Price Info

**What Changed:**
- Each list item now shows:
  - Best price with shop name (green badge)
  - Estimated price if no best price (yellow badge)
  - Savings amount if available
- Visual indicators for checked items

**Visual Design:**
```
┌─────────────────────────────────────────────┐
│ ☑ Sucre                               ⭕    │
│   x2  $2.50 @ Carrefour                    │
│   Économie: $0.50                          │
└─────────────────────────────────────────────┘
```

**Code Enhancement:**
```typescript
<View style={styles.itemDetails}>
  <View style={styles.quantityBadge}>
    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
  </View>
  {item.bestPrice && item.bestStore && (
    <View style={styles.priceBadge}>
      <Icon name="tag" size="xs" color={Colors.status.success} />
      <Text style={styles.itemPrice}>
        ${item.bestPrice.toFixed(2)} @ {item.bestStore}
      </Text>
    </View>
  )}
  {item.estimatedPrice && !item.bestPrice && (
    <View style={styles.estimatedPriceBadge}>
      <Text style={styles.itemEstimatedPrice}>
        ~${item.estimatedPrice.toFixed(2)}
      </Text>
    </View>
  )}
</View>

{/* Savings indicator */}
{item.bestPrice && item.estimatedPrice && item.estimatedPrice > item.bestPrice && (
  <View style={styles.savingsBadge}>
    <Text style={styles.savingsText}>
      Économie: ${(item.estimatedPrice - item.bestPrice).toFixed(2)}
    </Text>
  </View>
)}
```

### 4. Total Price Summary (USD & CDF)

**What Changed:**
- New summary card at bottom of shopping list
- Shows total price in both USD and CDF
- Automatic currency conversion (1 USD = 2700 CDF)
- Displays item count

**Visual Design:**
```
┌─────────────────────────────────────────┐
│ 🛒 Total à payer                        │
├─────────────────────────────────────────┤
│ USD                        $45.50       │
│ ─────────────────────────────────────   │
│ CDF                    122,850 FC       │
├─────────────────────────────────────────┤
│           12 articles                    │
└─────────────────────────────────────────┘
```

**Calculation Logic:**
```typescript
{(() => {
  let totalUSD = 0;
  let totalCDF = 0;
  const exchangeRate = 2700; // CDF per USD
  
  selectedList.items.forEach(item => {
    const price = item.bestPrice || item.estimatedPrice || 0;
    const quantity = item.quantity || 1;
    
    if (price > 0) {
      totalUSD += price * quantity;
    }
  });
  
  totalCDF = totalUSD * exchangeRate;
  
  return (
    <>
      <View style={styles.totalRow}>
        <Text style={styles.totalCurrency}>USD</Text>
        <Text style={styles.totalAmount}>
          ${totalUSD.toFixed(2)}
        </Text>
      </View>
      <View style={styles.totalDivider} />
      <View style={styles.totalRow}>
        <Text style={styles.totalCurrency}>CDF</Text>
        <Text style={styles.totalAmount}>
          {totalCDF.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FC
        </Text>
      </View>
      <View style={styles.totalItemsCount}>
        <Text style={styles.totalItemsText}>
          {selectedList.items.length} article{selectedList.items.length > 1 ? 's' : ''}
        </Text>
      </View>
    </>
  );
})()}
```

---

## Data Flow

### When User Adds Item from Search

```
1. User types search query
   ↓
2. Debounced search (300ms)
   ↓
3. Call getCityItems(city) Cloud Function
   ↓
4. Filter results by query
   ↓
5. Display top 10 matches
   ↓
6. User clicks result
   ↓
7. Show price comparison (top 5 shops)
   ↓
8. User confirms and adds to list
   ↓
9. Item saved with:
   - name
   - quantity
   - bestPrice (from community data)
   - bestStore
   - estimatedPrice (average)
   ↓
10. List refreshed
    ↓
11. Total recalculated (USD + CDF)
```

### Price Data Sources

| Data Field | Source | Description |
|------------|--------|-------------|
| `bestPrice` | Community prices | Lowest price found across all shops |
| `bestStore` | Community prices | Shop with lowest price |
| `estimatedPrice` | Community prices | Average price across all shops |
| `avgPrice` | Community prices | Used for optimization |
| `minPrice` | Community prices | Minimum from historical data |
| `maxPrice` | Community prices | Maximum from historical data |

---

## User Interface Components

### Search Results Component

```typescript
<ScrollView style={styles.searchResultsContainer} nestedScrollEnabled>
  <Text style={styles.searchResultsTitle}>Résultats ({searchResults.length})</Text>
  {searchResults.map((item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.searchResultItem}
      onPress={() => handleSelectSearchResult(item)}>
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultStats}>
          {item.storeCount} magasins • 
          {formatCurrency(item.minPrice, item.currency)} - 
          {formatCurrency(item.maxPrice, item.currency)}
        </Text>
      </View>
      <Icon name="chevron-right" size="sm" color={Colors.text.tertiary} />
    </TouchableOpacity>
  ))}
</ScrollView>
```

### Price Comparison Component

```typescript
<View style={styles.priceComparisonContainer}>
  <Text style={styles.priceComparisonTitle}>Prix dans différents magasins</Text>
  <ScrollView style={styles.priceList} nestedScrollEnabled>
    {selectedItemForAdd.prices
      .sort((a, b) => a.price - b.price)
      .slice(0, 5)
      .map((priceInfo, index) => (
        <View key={...} style={styles.priceItem}>
          <View style={styles.priceRank}>
            <Text style={styles.priceRankText}>{index + 1}</Text>
          </View>
          <View style={styles.priceStoreInfo}>
            <Text style={styles.priceStoreName}>{priceInfo.storeName}</Text>
            <Text style={styles.priceCurrency}>{priceInfo.currency}</Text>
          </View>
          <Text style={[
            styles.priceAmount,
            index === 0 && styles.priceAmountBest
          ]}>
            {formatCurrency(priceInfo.price, priceInfo.currency)}
          </Text>
        </View>
      ))}
  </ScrollView>
</View>
```

### Total Summary Component

```typescript
<View style={styles.totalSummaryCard}>
  <LinearGradient
    colors={[Colors.primary, Colors.primaryDark]}
    style={styles.totalSummaryGradient}>
    <View style={styles.totalHeader}>
      <Icon name="shopping-cart" size="md" color={Colors.white} />
      <Text style={styles.totalTitle}>Total à payer</Text>
    </View>
    
    <View style={styles.totalRow}>
      <Text style={styles.totalCurrency}>USD</Text>
      <Text style={styles.totalAmount}>${totalUSD.toFixed(2)}</Text>
    </View>
    
    <View style={styles.totalDivider} />
    
    <View style={styles.totalRow}>
      <Text style={styles.totalCurrency}>CDF</Text>
      <Text style={styles.totalAmount}>{totalCDF.toLocaleString('fr-FR')} FC</Text>
    </View>
    
    <View style={styles.totalItemsCount}>
      <Text style={styles.totalItemsText}>
        {selectedList.items.length} article(s)
      </Text>
    </View>
  </LinearGradient>
</View>
```

---

## Styling Overview

### New Styles Added

```typescript
// Search Results
searchResultsContainer: maxHeight 250, blue background
searchResultItem: white card with shadow
searchResultName: semiBold, primary text
searchResultStats: xs font, tertiary text

// Price Comparison
priceComparisonContainer: cream background
priceList: maxHeight 200, scrollable
priceItem: white card, row layout
priceRank: yellow circle badge with number
priceStoreName: semiBold
priceAmount: bold, primary color
priceAmountBest: success color (green)

// Total Summary
totalSummaryCard: gradient background (primary → primaryDark)
totalRow: space-between layout
totalAmount: 2xl font, white, bold
totalDivider: white 30% opacity line
totalItemsCount: bordered top, centered text

// Item Enhancements
estimatedPriceBadge: yellow background
savingsBadge: cream background, success text
```

---

## State Management

### New State Variables

```typescript
// Community item search
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<CommunityItemData[]>([]);
const [isSearching, setIsSearching] = useState(false);
const [selectedItemForAdd, setSelectedItemForAdd] = useState<CommunityItemData | null>(null);
const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

### New Handlers

```typescript
// Search with debouncing
const searchCommunityItems = useCallback(async (query: string) => {
  // Fetch from getCityItems
  // Filter by query
  // Set searchResults
}, [userProfile?.defaultCity]);

// Select item from search results
const handleSelectSearchResult = useCallback((item: CommunityItemData) => {
  setSelectedItemForAdd(item);
  setNewItemName(item.name);
  setSearchQuery('');
  setSearchResults([]);
}, []);

// Clean up on modal close
const handleCloseAddModal = () => {
  setShowAddItemModal(false);
  setSearchQuery('');
  setSearchResults([]);
  setSelectedItemForAdd(null);
};
```

---

## Dependencies

### New Imports

```typescript
import {firebase} from '@react-native-firebase/functions';
import {useUser} from '@/shared/contexts';
import {formatCurrency} from '@/shared/utils/helpers';
```

### Existing Services Used

```typescript
// Community data
firebase.app().functions('europe-west1').httpsCallable('getCityItems')

// Shopping list operations
shoppingListService.addItem(userId, listId, item)
shoppingListService.getList(userId, listId)
```

---

## Performance Optimizations

1. **Debounced Search**: 300ms delay prevents excessive API calls
2. **Limited Results**: Show only top 10 search results
3. **Limited Price Display**: Show only top 5 price comparisons
4. **Nested ScrollView**: Prevents layout issues in modal
5. **Memoized Callbacks**: useCallback for search and selection handlers

---

## User Experience Improvements

### Before

- Manual item entry only
- No price visibility when adding items
- No price comparison
- No total calculation
- Single currency display

### After

- Search-driven item addition ✅
- Price comparison during selection ✅
- Best price highlighted per item ✅
- Savings indicators ✅
- Dual currency totals (USD & CDF) ✅
- Visual rank indicators (#1, #2, #3) ✅
- Real-time search with loading indicator ✅
- Scroll-friendly price lists ✅

---

## Future Enhancements

1. **Store Filtering**: Filter search results by specific stores
2. **Price Alerts**: Notify when item price drops
3. **Historical Price Trends**: Show price change over time
4. **Offline Mode**: Cache recent search results
5. **Voice Search**: Speech-to-text for item search
6. **Barcode Scanning**: Add items by scanning barcode
7. **Smart Suggestions**: ML-based item recommendations
8. **Currency Settings**: User-configurable exchange rate
9. **Multi-Currency Items**: Support items with multiple currencies
10. **Export List**: Share shopping list via SMS/WhatsApp

---

## Testing Checklist

- [ ] Search returns relevant community items
- [ ] Price comparison shows correct shops and prices
- [ ] Best price highlighted in green
- [ ] Total USD calculated correctly
- [ ] Total CDF converted correctly (2700 rate)
- [ ] Item count updates properly
- [ ] Debouncing works (no spam requests)
- [ ] Search results selectable
- [ ] Modal closes properly
- [ ] State cleaned up on close
- [ ] Nested scrolling works smoothly
- [ ] Loading indicator appears during search
- [ ] Empty search results handled gracefully
- [ ] No city set handled properly

---

## Known Limitations

1. **Exchange Rate**: Currently hardcoded at 2700 CDF/USD
   - Solution: Add currency settings in user profile

2. **City Requirement**: Search only works if user has default city set
   - Solution: Prompt user to set city on first use

3. **Price Staleness**: No indication of price age
   - Solution: Show "Updated X days ago" label

4. **Network Dependency**: Requires internet for search
   - Solution: Implement offline caching

5. **Search Accuracy**: Simple text matching only
   - Solution: Implement fuzzy search or semantic search

---

## Summary

The shopping list has been transformed from a simple checklist into a powerful price comparison and budgeting tool. Users can now:

1. **Search** items from community database
2. **Compare** prices across multiple shops
3. **See** best prices and potential savings
4. **Calculate** total cost in both USD and CDF
5. **Make informed** purchasing decisions

This enhancement leverages the community price data (Tier 3 architecture) to provide real value to users while maintaining privacy and performance.
