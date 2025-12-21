# Shopping Lists - Samsung Notes Style Implementation

## Overview
This document describes the Samsung Notes-style shopping list management system implementation in GoShopper AI. The feature provides a comprehensive list management experience with full CRUD operations on both lists and items.

## Architecture

### Two-Screen Flow

#### 1. ShoppingListsScreen (Overview)
**Path:** `src/features/shopping/screens/ShoppingListsScreen.tsx`

**Purpose:** Display all shopping lists in a card-based overview

**Features:**
- **List Display:**
  - Card-based layout with gradient backgrounds
  - List name and item count
  - Progress bar showing completion status
  - Completion badge (e.g., "3/8 complétés")
  - Preview of first 3 items
  - Creation date
  - Total savings displayed

- **CRUD Operations:**
  - **Create:** Floating action button + modal with list name input
  - **Read:** Tap card to navigate to detail view
  - **Update:** Long press card to edit list name
  - **Delete:** Swipe to delete with confirmation

- **Navigation:**
  - Route: `ShoppingLists`
  - Navigate to detail: `navigation.navigate('ShoppingListDetail', {listId})`

#### 2. ShoppingListDetailScreen (Single List)
**Path:** `src/features/shopping/screens/ShoppingListDetailScreen.tsx`

**Purpose:** Manage items within a single shopping list

**Features:**
- **Item Display:**
  - Checkbox for completion status
  - Item name with strikethrough when checked
  - Quantity controls (- / + buttons)
  - Best price and store information
  - Savings indicator when available
  - Estimated price fallback

- **Community Integration:**
  - Search bar to find items from community database
  - Debounced search (300ms delay)
  - Search results show:
    - Item name
    - Number of stores
    - Price range (min - max)
  - Selected item shows price comparison panel with top 5 stores

- **Price Comparison Panel:**
  - Ranks stores by price (1-5)
  - Shows store name and currency
  - Highlights best price in green
  - Displays full price in proper format

- **Total Summary:**
  - Dual currency display (USD and CDF)
  - Exchange rate: 2700 CDF per USD
  - Shows item count
  - Gradient background with icons
  - Calculates total based on best prices or estimated prices

- **Item CRUD:**
  - **Create:** Floating action button + search-enabled modal
  - **Read:** Items displayed in scrollable list
  - **Update:** Toggle checkbox, modify quantity with +/- buttons
  - **Delete:** Swipe to delete with confirmation

- **Navigation:**
  - Route: `ShoppingListDetail`
  - Params: `{listId: string}`
  - Back button returns to overview

## Data Model

### ShoppingList
```typescript
interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  items: ShoppingListItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  totalEstimated: number;
  totalOptimized: number;
  potentialSavings: number;
  optimizedStores: StoreRecommendation[];
}
```

### ShoppingListItem
```typescript
interface ShoppingListItem {
  id: string;
  name: string;
  nameNormalized: string;
  quantity: number;
  unit?: string;
  category?: string;
  isChecked: boolean;
  estimatedPrice?: number;
  bestPrice?: number;
  bestStore?: string;
  addedAt: Date;
  checkedAt?: Date;
}
```

### CommunityItemData (from search)
```typescript
interface CommunityItemData {
  id: string;
  name: string;
  prices: {
    storeName: string;
    price: number;
    currency: 'USD' | 'CDF';
    date: Date | any;
  }[];
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  storeCount: number;
  currency: 'USD' | 'CDF';
}
```

## Service Methods

### Shopping List Service
**Path:** `src/shared/services/firebase/shoppingList.ts`

#### List Operations
- `createList(userId, name, items?)` - Create new list
- `getLists(userId, activeOnly?)` - Get all lists
- `getList(userId, listId)` - Get single list
- `updateListName(userId, listId, name)` - Update list name
- `deleteList(userId, listId)` - Delete list
- `completeList(userId, listId)` - Mark list as completed

#### Item Operations
- `addItem(userId, listId, item)` - Add item to list
- `removeItem(userId, listId, itemId)` - Remove item from list
- `toggleItem(userId, listId, itemId)` - Toggle item completion
- `updateItemQuantity(userId, listId, itemId, quantity)` - Update item quantity

#### Optimization
- `optimizeList(userId, listId)` - Optimize prices and find best stores

### Community Search
**Cloud Function:** `getCityItems`
**Region:** europe-west1

**Usage:**
```typescript
const functionsInstance = firebase.app().functions('europe-west1');
const result = await functionsInstance.httpsCallable('getCityItems')({
  city: userProfile.defaultCity,
});
```

**Response:**
```typescript
{
  success: boolean;
  items: CommunityItemData[];
}
```

## Navigation Setup

### Route Configuration
**File:** `src/navigation/RootNavigator.tsx`

```typescript
<Stack.Screen
  name="ShoppingLists"
  component={ShoppingListsScreen}
  options={{headerShown: false}}
/>
<Stack.Screen
  name="ShoppingListDetail"
  component={ShoppingListDetailScreen}
  options={{headerShown: false}}
/>
```

### Type Definitions
**File:** `src/shared/types/index.ts`

```typescript
export type RootStackParamList = {
  // ...
  ShoppingLists: undefined;
  ShoppingListDetail: {listId: string};
  // ...
};
```

### Module Exports
**File:** `src/features/shopping/index.ts`

```typescript
export {ShoppingListsScreen} from './screens/ShoppingListsScreen';
export {ShoppingListDetailScreen} from './screens/ShoppingListDetailScreen';
```

## UI/UX Features

### Design Elements
- **Gradient Backgrounds:** Primary to primaryDark
- **Card Shadows:** Elevation-based shadows from theme
- **Border Radius:** Consistent XL radius (theme-based)
- **Spacing:** Theme-based spacing system
- **Typography:** Font family and sizes from theme

### Animations
- **Entrance:** Fade in + slide up animation
- **List Items:** Staggered appearance
- **Swipe Actions:** Smooth delete reveal
- **Modal Transitions:** Bottom sheet style

### Color Coding
- **Active Items:** White background
- **Checked Items:** Cream background with reduced opacity
- **Price Tags:** 
  - Best price: Green (success color)
  - Estimated: Yellow card background
  - Savings: Cream badge with green text

### Interactive Elements
- **Floating Action Buttons:** Gradient, circular, elevated
- **Swipe to Delete:** Red background with trash icon
- **Long Press:** Edit list name action
- **Quantity Controls:** Circular buttons with +/- icons
- **Search:** Debounced with loading indicator

## User Flow

### Creating a Shopping List
1. Open ShoppingListsScreen (overview)
2. Tap floating action button
3. Enter list name in modal
4. Tap "Créer"
5. Automatically navigate to detail view

### Adding Items to List
1. Open list detail view
2. Tap floating action button or top-right + button
3. Search for item in community database
4. Select item from results
5. View price comparison panel
6. Adjust quantity if needed
7. Tap "Ajouter"

### Editing List Name
1. Long press list card in overview
2. Modal appears with current name
3. Edit name
4. Tap "Enregistrer"

### Completing Items
1. Tap checkbox next to item
2. Item marked as checked with strikethrough
3. Progress bar updates
4. Total remains accurate

### Deleting Lists
1. Swipe list card left in overview
2. Red delete action appears
3. Tap delete
4. Confirmation dialog
5. List removed from view

## Data Flow

### List Loading
```
User opens ShoppingListsScreen
  → useEffect triggers loadLists()
  → shoppingListService.getLists(userId, false)
  → Firestore query: apps/{APP_ID}/users/{userId}/shoppingLists
  → Lists rendered with progress calculations
```

### Item Addition with Search
```
User types in search bar
  → 300ms debounce timer
  → getCityItems Cloud Function called
  → Community items filtered by query
  → Top 10 results displayed
  → User selects item
  → Price comparison panel shows top 5 stores
  → User adds item with quantity
  → shoppingListService.addItem()
  → Item added with bestPrice/bestStore data
  → List re-optimized
```

### Total Calculation
```
For each item in list:
  price = item.bestPrice || item.estimatedPrice || 0
  itemTotal = price × quantity
  totalUSD += itemTotal

totalCDF = totalUSD × 2700
```

## Performance Optimizations

### Search
- **Debouncing:** 300ms delay prevents excessive API calls
- **Result Limiting:** Max 10 search results displayed
- **Caching:** Community data fetched per city

### List Loading
- **Pagination:** Can add limit parameter to getLists()
- **Index Fields:** Firestore indexes on userId and updatedAt
- **Optimistic Updates:** Local state updates before Firestore confirmation

### Item Operations
- **Batch Updates:** Multiple item changes can be batched
- **Background Optimization:** List optimization runs after modifications
- **Price Caching:** Best prices stored with items

## Error Handling

### Network Errors
- Try-catch blocks around all service calls
- User-friendly error messages in French
- Alerts for critical failures (list not found, etc.)

### Validation
- List name required (trimmed, non-empty)
- Item name required
- Quantity minimum: 1
- Disable action buttons when invalid

### Edge Cases
- **Empty Lists:** Empty state with icon and message
- **No Search Results:** Clear results display
- **Missing Prices:** Falls back to estimated or shows no price
- **Deleted Lists:** Navigation guard redirects to overview

## Accessibility

### Screen Readers
- Semantic HTML/RN components
- Descriptive labels on interactive elements
- Status announcements for state changes

### Touch Targets
- Minimum 44x44 pt touch targets
- Hit slop areas on small icons
- Clear visual feedback on press

### Color Contrast
- WCAG AA compliance for text
- Icons paired with text labels
- Status communicated beyond color alone

## Future Enhancements

### Planned Features
1. **List Sharing:** Share lists with family/friends
2. **List Templates:** Common shopping list templates
3. **Category Grouping:** Group items by category in detail view
4. **Store Routing:** Optimal route through selected store
5. **Voice Input:** Add items via voice command
6. **Barcode Scanner:** Scan products to add to list
7. **Recipe Integration:** Create list from recipe ingredients
8. **Budget Limits:** Set spending limits per list
9. **Historical Lists:** Review past completed lists
10. **Smart Suggestions:** ML-based item suggestions

### Performance Ideas
- Virtual scrolling for large lists
- Image thumbnails for items
- Offline mode with sync
- Push notifications for price drops

## Testing Checklist

### Unit Tests
- [ ] shoppingListService methods
- [ ] Price calculation logic
- [ ] Search debouncing
- [ ] Currency conversion

### Integration Tests
- [ ] Create → Navigate flow
- [ ] Search → Add item flow
- [ ] Edit list name
- [ ] Delete list with confirmation
- [ ] Toggle item completion

### E2E Tests
- [ ] Full shopping list creation workflow
- [ ] Community search integration
- [ ] Price comparison display
- [ ] Total calculation accuracy
- [ ] Navigation between screens

## Migration Notes

### From Legacy ShoppingListScreen
The old `ShoppingListScreen.tsx` combined both overview and detail views. It has been:
- Marked as deprecated with comments
- Kept for backwards compatibility
- Will be removed in future version
- Quick action service updated to use `ShoppingLists` route

### Navigation Changes
- Old route: `ShoppingList` (no params)
- New routes: 
  - `ShoppingLists` (overview)
  - `ShoppingListDetail` (requires `{listId}`)

## References

### Related Documentation
- [Community Data Architecture](./architecture/COMMUNITY_DATA_ARCHITECTURE.md)
- [Shopping List Enhancements](./SHOPPING_LIST_ENHANCEMENTS.md)
- [Data Sources Summary](./DATA_SOURCES_SUMMARY.md)

### Design Inspiration
- Samsung Notes app (list management UX)
- Google Keep (card-based layout)
- Todoist (progress visualization)

### Dependencies
- React Native
- React Navigation
- Firebase Firestore
- Firebase Cloud Functions
- react-native-linear-gradient
- react-native-safe-area-context

---

**Last Updated:** January 2024  
**Version:** 1.0  
**Status:** Complete and Ready for Testing
