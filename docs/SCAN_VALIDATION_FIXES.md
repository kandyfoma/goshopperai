# Scan Validation & City Requirement Fixes

## Overview
Fixed critical issues where users could scan receipts without proper validation, leading to:
- Scans being processed without checking subscription status
- Items being saved without city data
- Failed scan recording due to missing subscription documents
- Users bypassing scan limits

## Root Causes

### 1. **Missing Subscription Documents**
- New users registering didn't have subscription documents created
- ProfileSetup screen didn't create subscription after profile completion
- Users could authenticate but have no subscription → `canScan` = false but no clear error

### 2. **Late Validation**
- Subscription checks only happened BEFORE taking photos, not before processing
- After user took photos and spent time, processing would fail during `recordScan()`
- Wasted API calls (Gemini) and user time

### 3. **No City Validation**
- Scanner didn't check if user had `defaultCity` set
- Items saved without city couldn't be found by `getCityItems`
- Community database appeared empty even with scanned items

### 4. **Silent Failures**
- When subscription didn't exist, errors were caught but not surfaced
- `calculateState()` returned false for `canScan` but no explanation why
- Users confused about why they couldn't scan

## Fixes Implemented

### 1. **Early Validation in Scanner** ([UnifiedScannerScreen.tsx](../src/features/scanner/screens/UnifiedScannerScreen.tsx))

Added comprehensive checks BEFORE processing:

```typescript
const handleProcess = useCallback(async (): Promise<void> => {
  // ... existing photo check ...

  // Validate subscription before processing (double-check)
  if (!canScan) {
    analyticsService.logCustomEvent('scan_blocked_no_scans');
    Alert.alert(
      'Limite atteinte',
      isTrialActive
        ? `Vous avez utilisé vos scans gratuits pour ce mois...`
        : 'Vous avez atteint votre limite de scans...',
      [
        {text: 'Annuler', style: 'cancel'},
        {text: 'Voir Premium', onPress: () => navigation.push('Subscription')},
      ]
    );
    setState('idle');
    setPhotos([]);
    return;
  }

  // Validate user has a city set
  if (!profile?.defaultCity) {
    analyticsService.logCustomEvent('scan_blocked_no_city');
    Alert.alert(
      'Ville requise',
      'Veuillez configurer votre ville dans les paramètres...',
      [
        {text: 'Annuler', style: 'cancel'},
        {text: 'Configurer', onPress: () => navigation.push('ProfileSetup')},
      ]
    );
    setState('idle');
    setPhotos([]);
    return;
  }

  setState('processing');
  // ... rest of processing ...
```

**Benefits:**
- ✅ Blocks processing before API calls are made
- ✅ Clear error messages guide user to fix the issue
- ✅ Prevents wasted time and API usage
- ✅ Analytics tracking for each block reason

### 2. **Subscription Null Checks** ([SubscriptionContext.tsx](../src/shared/contexts/SubscriptionContext.tsx))

Updated `calculateState` to handle missing subscriptions:

```typescript
const calculateState = useCallback(
  (subscription: Subscription | null): SubscriptionState => {
    // If no subscription or inactive status, user cannot scan
    if (!subscription || subscription.status === 'inactive') {
      console.warn('⚠️ No active subscription found - user cannot scan');
      return {
        subscription: subscription || null,
        isLoading: false,
        canScan: false,
        scansRemaining: 0,
        isTrialActive: false,
        trialDaysRemaining: 0,
        isExpiringSoon: false,
        daysUntilExpiration: 0,
        error: subscription ? null : 'Abonnement non trouvé. Veuillez compléter votre profil.',
      };
    }
    // ... rest of calculation ...
```

**Benefits:**
- ✅ Properly handles `null` subscription
- ✅ Clear error message in state
- ✅ Console warnings for debugging
- ✅ Prevents crashes from undefined access

### 3. **Subscription Validation in recordScanUsage** ([subscription.ts](../src/shared/services/firebase/subscription.ts))

Added check at the start of scan recording:

```typescript
async recordScanUsage(): Promise<void> {
  const user = authService.getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  let subscription = await this.getStatus();
  
  // Check if subscription exists and is not inactive
  if (!subscription || subscription.status === 'inactive') {
    throw new Error('Abonnement non trouvé. Veuillez compléter votre profil ou contacter le support.');
  }

  // ... rest of recording logic ...
```

**Benefits:**
- ✅ Early exit with clear error
- ✅ Prevents increment attempts on non-existent documents
- ✅ Proper error propagation to UI

### 4. **Auto-Create Subscription on Profile Setup** ([ProfileSetupScreen.tsx](../src/features/onboarding/screens/ProfileSetupScreen.tsx))

Now creates subscription document during onboarding:

```typescript
const handleComplete = async () => {
  // ... save profile ...

  // Create subscription document if it doesn't exist
  const subscriptionRef = firestore()
    .collection('artifacts')
    .doc(APP_ID)
    .collection('subscriptions')
    .doc(user.uid);

  const subscriptionDoc = await subscriptionRef.get();
  
  if (!subscriptionDoc.exists) {
    console.log('📝 Creating trial subscription for new user');
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 60); // 60 days trial
    
    const billingPeriodEnd = new Date(now);
    billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);
    
    await subscriptionRef.set({
      userId: user.uid,
      status: 'trial',
      planId: 'free',
      isSubscribed: false,
      trialStartDate: firestore.Timestamp.fromDate(now),
      trialEndDate: firestore.Timestamp.fromDate(trialEnd),
      trialScansUsed: 0,
      monthlyScansUsed: 0,
      currentBillingPeriodStart: firestore.Timestamp.fromDate(now),
      currentBillingPeriodEnd: firestore.Timestamp.fromDate(billingPeriodEnd),
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }
  
  // ... navigate to app ...
```

**Benefits:**
- ✅ Every new user gets a subscription automatically
- ✅ 60-day trial with 50 scans/month
- ✅ Monthly billing cycle for scan limits
- ✅ No more missing subscription errors

### 5. **Improved Error Logging** ([subscription.ts](../src/shared/services/firebase/subscription.ts))

Enhanced subscription listener to warn about missing documents:

```typescript
subscribeToStatus(callback: (subscription: Subscription) => void): () => void {
  const user = authService.getCurrentUser();
  if (!user) {
    callback(this.getDefaultSubscription(''));
    return () => {};
  }

  return firestore()
    .doc(COLLECTIONS.subscription(user.uid))
    .onSnapshot(
      doc => {
        if (doc.exists) {
          callback(this.mapSubscription(doc.data()!));
        } else {
          console.warn('⚠️ Subscription document does not exist for user:', user.uid);
          console.warn('⚠️ User should complete onboarding or subscription needs to be created');
          callback(this.getDefaultSubscription(user.uid));
        }
      },
      error => {
        console.error('❌ Subscription snapshot error:', error);
      },
    );
}
```

**Benefits:**
- ✅ Clear console warnings during development
- ✅ Easier debugging of subscription issues
- ✅ Helps identify onboarding problems

## Migration for Existing Users

For users who registered before these fixes, use the migration script:

```bash
node scripts/fix-user-profile.js <USER_ID> [CITY]
```

This script:
1. Sets `defaultCity`, `countryCode`, `isInDRC`, `phoneVerified` on user profile
2. Creates missing subscription document with trial
3. Updates existing receipts with city
4. Triggers Cloud Function to rebuild items collection

## Validation Flow

### Before Scanning:
```
1. User opens scanner
2. UnifiedScannerScreen checks:
   - Is user authenticated? ❌ → Redirect to login
   - Does subscription exist? ❌ → Show "complete profile" alert
   - canScan === true? ❌ → Show "upgrade" alert  
   - Has defaultCity? ❌ → Show "set city" alert
   ✅ All checks pass → Allow photo capture
```

### Before Processing:
```
1. User takes photos
2. User clicks "Process"
3. handleProcess() validates again:
   - canScan === true? ❌ → Clear photos, show alert
   - Has defaultCity? ❌ → Clear photos, show alert
   ✅ All checks pass → Start API processing
```

### After Processing:
```
1. Receipt parsed successfully
2. City added to receipt and items (from profile.defaultCity)
3. Receipt saved to Firestore
4. recordScan() called:
   - Subscription exists? ❌ → Throw error
   - Within scan limit? ❌ → Throw error
   ✅ All checks pass → Increment counter
5. Cloud Function aggregates items with city
6. Items appear in community database
```

## Analytics Events

New events for tracking blocks:
- `scan_blocked_no_scans` - User tried to scan without scans remaining
- `scan_blocked_no_city` - User tried to scan without city set

## Testing Checklist

- [ ] New user registration creates subscription automatically
- [ ] Scanner blocks if no subscription exists
- [ ] Scanner blocks if no city is set
- [ ] Scanner blocks if no scans remaining
- [ ] Clear error messages for each block reason
- [ ] Items saved with city field
- [ ] Items appear in getCityItems results
- [ ] Monthly reset works correctly
- [ ] Scan recording increments counter
- [ ] Dashboard shows correct scan count

## Future Improvements

1. **Background Subscription Check**: Check subscription validity when app opens, not just when scanning
2. **City Selection**: Add city selector in Settings for easy changes
3. **Subscription Health Check**: Periodic check to auto-fix missing subscriptions
4. **Better Onboarding**: Ensure subscription is created even if user skips ProfileSetup
5. **Graceful Degradation**: Allow viewing past receipts even without active subscription

## Related Files

- `src/features/scanner/screens/UnifiedScannerScreen.tsx` - Scanner validation
- `src/shared/contexts/SubscriptionContext.tsx` - Subscription state management
- `src/shared/services/firebase/subscription.ts` - Subscription service logic
- `src/features/onboarding/screens/ProfileSetupScreen.tsx` - Profile setup with subscription creation
- `scripts/fix-user-profile.js` - Migration script for existing users
- `scripts/debug-database.js` - Diagnostic tool
