# ML & AI User Behavior Tracking System

## Overview
This system tracks user behavior to power machine learning recommendations, personalized notifications, and predictive analytics.

## Architecture

### 1. **User Profile Extensions**
Located in: `src/shared/types/user.types.ts`

Three new optional fields added to `UserProfile`:
- `behaviorProfile`: Shopping patterns, preferences, and ML features
- `recommendationPreferences`: User controls for recommendation engine
- `engagementMetrics`: App usage and engagement tracking

### 2. **Data Collection**
Located in: `src/shared/services/firebase/userBehaviorService.ts`

**Functions to call throughout the app:**

```typescript
import {userBehaviorService} from '@/shared/services/firebase/userBehaviorService';

// Track when user views an item
await userBehaviorService.trackItemView(userId, itemId, itemName, category);

// Track when user sees a recommendation
await userBehaviorService.trackRecommendationShown(
  userId,
  recommendationId,
  'personalized', // or 'price_alert', 'bundle', 'seasonal'
  [itemId1, itemId2]
);

// Track when user clicks a recommendation
await userBehaviorService.trackRecommendationClick(userId, recommendationId);

// Track when user purchases a recommended item
await userBehaviorService.trackRecommendationConversion(userId, recommendationId, itemId);

// Track when user dismisses a recommendation
await userBehaviorService.trackRecommendationDismissal(userId, recommendationId);

// Track notification engagement
await userBehaviorService.trackNotificationEngagement(
  userId,
  notificationId,
  'opened' // or 'dismissed'
);

// Update shopping patterns after receipt scan
await userBehaviorService.updateShoppingPatterns(userId, {
  total: 150.50,
  itemCount: 12,
  storeName: 'Carrefour',
  categories: ['Food', 'Beverages'],
  date: new Date()
});

// Track app session
await userBehaviorService.trackUserSession(userId, 420); // 7 minutes in seconds

// Initialize for new users (call after registration)
await userBehaviorService.initializeBehaviorProfile(userId);
```

### 3. **ML Feature Calculation**
Located in: `functions/src/ml/behaviorProfile.ts`

**Automated Daily Calculation:**
- Runs every day at 3 AM UTC
- Calculates features for all users
- Updates `behaviorProfile` with ML-ready data

**Features Calculated:**
- Average basket size
- Average spending per trip
- Shopping frequency (daily/weekly/biweekly/monthly)
- Preferred shopping days and times
- Top 5 categories with interest scores
- Top 10 brand affinities
- Price consciousness level (budget/moderate/premium)
- Preferred stores
- Engagement scores (weekly, monthly)
- Churn risk score
- Data quality score

**Manual Trigger:**
```typescript
const result = await firebase.functions().httpsCallable('calculateUserMLFeatures')({
  userId: 'user123'
});
```

### 4. **Cloud Functions**
Two new functions exported:
1. `updateUserBehaviorProfile` - Scheduled daily
2. `calculateUserMLFeatures` - Manual trigger

## Data Structure

### BehaviorProfile
```typescript
{
  // Shopping Patterns
  averageBasketSize: 8.5,
  averageSpendPerTrip: 125.50,
  shoppingFrequency: 'weekly',
  preferredShoppingDays: [5, 6, 0], // Friday, Saturday, Sunday
  preferredShoppingTime: 'evening',
  
  // Category Preferences
  topCategories: [
    {
      category: 'Food',
      purchaseCount: 45,
      totalSpent: 2500.00,
      averagePrice: 55.56,
      lastPurchaseDate: '2025-12-20',
      trend: 'stable',
      interestScore: 85 // ML-calculated
    }
  ],
  
  // Brand Affinities
  brandAffinities: [
    {
      brand: 'Coca-Cola',
      purchaseCount: 12,
      loyaltyScore: 75,
      lastPurchaseDate: '2025-12-15',
      switchingProbability: 0.2
    }
  ],
  
  // Price Behavior
  priceConsciousness: 'moderate',
  dealSeeker: true,
  averageDiscountTaken: 15.5,
  
  // Store Preferences
  preferredStores: ['Carrefour', 'Kin Marché', 'Hasson'],
  
  // Engagement
  lastActiveDate: '2025-12-21',
  weeklyActiveScore: 85,
  monthlyActiveScore: 92,
  churnRiskScore: 20,
  
  // Metadata
  lastProfileUpdate: '2025-12-21T03:00:00Z',
  profileVersion: 1,
  dataQualityScore: 78
}
```

### RecommendationPreferences
```typescript
{
  enablePersonalizedRecommendations: true,
  enablePriceAlertRecommendations: true,
  enableBundleRecommendations: true,
  enableSeasonalRecommendations: true,
  recommendationStyle: 'balanced', // or 'conservative', 'exploratory'
  maxRecommendationsPerDay: 5,
  acceptedRecommendations: ['item123', 'item456'],
  dismissedRecommendations: ['item789'],
  feedbackScore: 4.2 // 0-5
}
```

### EngagementMetrics
```typescript
{
  totalSessions: 42,
  averageSessionDuration: 320, // seconds
  lastSessionDate: '2025-12-21',
  
  scansCount: 15,
  itemViewsCount: 89,
  priceComparisonsCount: 34,
  alertsCreatedCount: 8,
  shoppingListsCreatedCount: 5,
  
  pushNotificationsReceived: 25,
  pushNotificationsOpened: 18,
  pushNotificationDismissed: 7,
  notificationOpenRate: 0.72,
  
  recommendationsShown: 30,
  recommendationsClicked: 12,
  recommendationClickRate: 0.40,
  recommendationConversionRate: 0.33,
  
  daysActive: 28,
  consecutiveDaysActive: 5,
  longestStreak: 12,
  daysSinceLastActive: 0
}
```

## Integration Points

### Where to Add Tracking

1. **Receipt Scanning** (after receipt is saved)
   ```typescript
   await userBehaviorService.updateShoppingPatterns(userId, receiptData);
   ```

2. **Item Detail View** (when user opens item)
   ```typescript
   await userBehaviorService.trackItemView(userId, itemId, itemName, category);
   ```

3. **Recommendations Display** (when showing recommendations)
   ```typescript
   await userBehaviorService.trackRecommendationShown(userId, recId, type, itemIds);
   ```

4. **Recommendation Click** (when user taps recommendation)
   ```typescript
   await userBehaviorService.trackRecommendationClick(userId, recId);
   ```

5. **Push Notification** (when user opens/dismisses)
   ```typescript
   await userBehaviorService.trackNotificationEngagement(userId, notifId, action);
   ```

6. **App Session** (on app background/foreground)
   ```typescript
   await userBehaviorService.trackUserSession(userId, sessionDuration);
   ```

7. **User Registration** (after completing OTP)
   ```typescript
   await userBehaviorService.initializeBehaviorProfile(userId);
   ```

## ML Use Cases

### 1. **Personalized Recommendations**
Use `behaviorProfile.topCategories` and `brandAffinities` to recommend:
- Similar items in preferred categories
- New products from favorite brands
- Items frequently bought together

### 2. **Price Alert Suggestions**
Use `behaviorProfile.frequentItems` to suggest:
- Setting alerts on items they buy often
- Price drop notifications for preferred brands

### 3. **Churn Prevention**
Use `behaviorProfile.churnRiskScore` to:
- Send retention notifications
- Offer personalized deals
- Re-engagement campaigns

### 4. **Notification Timing**
Use `behaviorProfile.preferredShoppingTime` and `preferredShoppingDays` to:
- Send notifications at optimal times
- Schedule push notifications when user is likely to shop

### 5. **Bundle Recommendations**
Use purchase history to identify:
- Items frequently bought together
- Complementary products
- Cross-category bundles

## Privacy & Data Usage

### Data Collection
- All tracking is opt-in via `recommendationPreferences.enablePersonalizedRecommendations`
- Data is anonymized for ML training
- Users can delete their behavior data anytime

### Data Retention
- Behavior data is kept for 6 months
- ML features recalculated daily
- Old data auto-cleaned by `cleanupOldUserData` function

### User Controls
Users can control:
- Enable/disable personalized recommendations
- Recommendation style (conservative/balanced/exploratory)
- Maximum recommendations per day
- Individual recommendation types (price alerts, bundles, seasonal)

## Next Steps

### Phase 1: Data Collection (Current)
- ✅ Add tracking calls throughout app
- ✅ Collect 2-4 weeks of data
- ✅ Verify data quality scores improve

### Phase 2: ML Model Training
- Train collaborative filtering model
- Train category preference model
- Train churn prediction model
- Deploy models to Cloud Functions

### Phase 3: Recommendation Engine
- Build recommendation API
- Implement personalization logic
- A/B test recommendation quality
- Measure conversion rates

### Phase 4: Push Notifications
- Build notification scheduler
- Implement smart timing
- Track engagement rates
- Optimize notification content

## Monitoring

### Key Metrics to Track
- Data quality scores (target: >70)
- Recommendation click rates (target: >20%)
- Recommendation conversion rates (target: >10%)
- Notification open rates (target: >30%)
- Churn rate reduction (target: <10% monthly)

### Dashboards
Create Firebase dashboards for:
- Daily active users with behavior data
- Average data quality score
- Recommendation performance
- Engagement trends
- Churn risk distribution

## Example: Complete Flow

```typescript
// 1. User scans receipt
const receipt = await scanReceipt(imageUri);

// 2. Track shopping pattern
await userBehaviorService.updateShoppingPatterns(userId, {
  total: receipt.total,
  itemCount: receipt.items.length,
  storeName: receipt.storeName,
  categories: [...new Set(receipt.items.map(i => i.category))],
  date: receipt.date
});

// 3. Get ML features (next day, automatic)
// updateUserBehaviorProfile runs at 3 AM

// 4. Generate recommendations (your ML service)
const recommendations = await getPersonalizedRecommendations(userId);

// 5. Show recommendations
await userBehaviorService.trackRecommendationShown(
  userId,
  'rec_123',
  'personalized',
  recommendations.map(r => r.id)
);

// 6. User clicks recommendation
await userBehaviorService.trackRecommendationClick(userId, 'rec_123');

// 7. User purchases item
await userBehaviorService.trackRecommendationConversion(
  userId,
  'rec_123',
  purchasedItemId
);

// Result: ML model learns user responded well to this recommendation type
```
