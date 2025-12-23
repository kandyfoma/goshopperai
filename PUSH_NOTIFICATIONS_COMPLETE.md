# Push Notifications Implementation Guide

## Overview
Complete push notification system implemented for GoShopper with 6 new notification types plus existing notifications.

## ✅ Implemented Notification Systems

### 1. **Grace Period Notifications** 🟢
**File:** `functions/src/notifications/gracePeriodNotifications.ts`

**Schedule:** Daily at 10:00 AM (Africa/Kinshasa)

**Triggers:** Days 7, 5, 3, and 1 before grace period expires

**Messages:**
- **Day 7:** "⏳ Grace Period Active - 7 days to use X remaining scans"
- **Day 5:** "⏰ 5 Days Left in Grace Period"
- **Day 3:** "⚠️ 3 Days Left - Use Your Scans!"
- **Day 1:** "🚨 Last Day of Grace Period!"

**Cloud Function:** `checkGracePeriodReminders`

---

### 2. **Scan Limit Warnings** 🔴
**File:** `functions/src/notifications/scanLimitNotifications.ts`

**Trigger:** Firestore trigger on receipt creation

**Thresholds:**
- **80% used:** "📊 Scan Usage Update - X/Y scans used"
- **90% used:** "⚠️ Almost Out of Scans! - Only X left"
- **100% used:** "🚫 Monthly Scan Limit Reached"

**Cloud Functions:**
- `onReceiptCreated` - Firestore trigger
- `resetScanLimitWarnings` - Monthly reset (1st of month at 00:01 AM)

---

### 3. **Payment Success Confirmations** 💳
**File:** `functions/src/notifications/paymentNotifications.ts`

**Integrated with:** `functions/src/payments/mokoAfrika.ts` (webhook handler)

**Types:**
- **Payment Success:** "✅ Paiement Réussi! - Your X subscription is active"
- **Payment Failed:** "❌ Paiement Échoué - Please try again"
- **Auto-Renewal:** "🔄 Abonnement Renouvelé - Next renewal: X"

**Functions:**
- `sendPaymentSuccessNotification()`
- `sendPaymentFailedNotification()`
- `sendAutoRenewalNotification()`

---

### 4. **Price Alert Notifications** 💰 (Premium Feature)
**File:** `functions/src/notifications/priceAlertNotifications.ts`

**Trigger:** Firestore trigger on city item price updates

**Messages:**
- **Target Reached:** "🎯 Prix Cible Atteint! - Item now $X (target: $Y)"
- **Price Drop:** "💰 Alerte Baisse de Prix! - Item now $X (was $Y, -Z%)"

**Cloud Functions:**
- `onCityItemPriceUpdate` - Firestore trigger
- `setPriceAlert` - Callable function (Premium only)
- `removePriceAlert` - Callable function

---

### 5. **Monthly Summary Report** 📈
**File:** `functions/src/notifications/monthlySummaryNotifications.ts`

**Schedule:** 1st of every month at 10:00 AM

**Content:**
- Total spent
- Number of receipts & items
- Top category & store
- Comparison to previous month
- Spending trend indicator (💚 less, ⚠️ more, 📊 same)

**Cloud Function:** `sendMonthlySummaries`

---

### 6. **Feature Unlock Notifications** 🎉
**File:** `functions/src/notifications/featureUnlockNotifications.ts`

**Trigger:** Firestore trigger on subscription plan changes

**Messages:**
- **Upgrade:** "🎉 Welcome to X! You now have access to: [features]"
- **Downgrade:** "📉 Plan Changed to X - Some features may no longer be available"

**Cloud Function:** `onSubscriptionPlanChange`

---

### 7. **Existing Notifications** (Already Implemented)
**File:** `functions/src/notifications/notifications.ts`

- **Subscription Expiration** (7, 3, 1 days)
- **Trial Expiration** (7, 3, 1 days)
- **Weekly Savings Tips** (Saturdays 10 AM, AI-powered)
- **Achievement Unlocked**
- **Sync Complete**
- **Admin Broadcast**

---

## 📱 React Native Integration

### **Service: Push Notification Handler**
**File:** `src/shared/services/firebase/pushNotifications.ts`

**Features:**
- ✅ FCM token registration
- ✅ Token refresh handling
- ✅ Foreground notifications with alerts
- ✅ Background/quit state handlers
- ✅ Notification engagement tracking
- ✅ Platform-specific permissions (Android 13+, iOS)

**Updated Fields Saved to Firestore:**
```typescript
{
  fcmToken: string,
  fcmTokenUpdatedAt: Timestamp,
  notificationsEnabled: boolean,
  platform: 'ios' | 'android',
  deviceInfo: {
    os: string,
    version: string | number
  }
}
```

### **Custom Hook**
**File:** `src/shared/hooks/usePushNotifications.ts`

Usage:
```typescript
const {isEnabled, isLoading, checkPermission, openSettings, disable, enable} = usePushNotifications();
```

### **Notification Routing**
**File:** `src/shared/services/notificationService.ts`

Routes notifications based on type:
- `grace_period_reminder` → Subscription screen
- `scan_limit_*` → Home/Subscription
- `payment_*` → Subscription screen
- `price_alert` → Items screen
- `monthly_summary` → Home screen
- `feature_unlock` → Home screen

---

## 🔔 Notification Channels (Android)

| Channel ID | Name | Importance | Color |
|------------|------|------------|-------|
| `grace_period` | Grace Period Alerts | HIGH | #f59e0b (amber) |
| `scan_limits` | Scan Limit Warnings | HIGH | #ef4444 (red) |
| `subscription_alerts` | Subscription Alerts | HIGH | #ef4444 (red) |
| `payment_confirmations` | Payment Confirmations | HIGH | #10b981 (green) |
| `price_alerts` | Price Alerts | HIGH | #f59e0b (amber) |
| `feature_unlock` | Feature Unlocks | HIGH | #8b5cf6 (purple) |
| `monthly_summary` | Monthly Summaries | DEFAULT | #3b82f6 (blue) |
| `savings_tips` | Savings Tips | DEFAULT | #10b981 (green) |
| `achievements` | Achievements | HIGH | #f59e0b (amber) |
| `sync_notifications` | Sync Notifications | LOW | #10b981 (green) |
| `admin_broadcast` | Important Updates | HIGH | #10b981 (green) |

---

## 📊 Notification Tracking Fields

### **Subscription Document**
```typescript
{
  // Grace period
  graceNotificationDay?: number, // 7, 5, 3, 1
  graceNotificationSent?: boolean,
  graceNotificationDate?: Date,
  
  // Scan limits
  scan80PercentWarningSent?: boolean,
  scan80PercentWarningDate?: Date,
  scan90PercentWarningSent?: boolean,
  scan90PercentWarningDate?: Date,
  scanLimitReachedNotificationSent?: boolean,
  scanLimitReachedDate?: Date,
  
  // Remaining scans (for grace period)
  scansRemaining?: number,
}
```

### **User Document**
```typescript
{
  fcmToken?: string,
  notificationsEnabled: boolean,
  pushNotificationsReceived?: number,
  pushNotificationsOpened?: number,
  pushNotificationDismissed?: number,
  notificationOpenRate?: number, // 0-1
}
```

---

## 🚀 Deployment Checklist

### **Cloud Functions (Backend)**
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

**New Functions Deployed:**
- ✅ `checkGracePeriodReminders` (scheduled)
- ✅ `sendManualGracePeriodReminder` (callable)
- ✅ `onReceiptCreated` (firestore trigger)
- ✅ `resetScanLimitWarnings` (scheduled)
- ✅ `sendManualScanLimitWarning` (callable)
- ✅ `sendManualPaymentNotification` (callable)
- ✅ `onCityItemPriceUpdate` (firestore trigger)
- ✅ `setPriceAlert` (callable)
- ✅ `removePriceAlert` (callable)
- ✅ `sendMonthlySummaries` (scheduled)
- ✅ `sendManualMonthlySummary` (callable)
- ✅ `onSubscriptionPlanChange` (firestore trigger)
- ✅ `sendManualFeatureUnlockNotification` (callable)

### **React Native (Frontend)**
```bash
# No new dependencies needed - already has:
# - @react-native-firebase/messaging: ^19.0.1

# Just rebuild the app:
npm run android
# or
npm run ios
```

---

## 🧪 Testing Notifications

### **1. Test Grace Period Notification**
```typescript
// In Firebase Console or via code:
const sendManualGracePeriodReminder = functions.httpsCallable('sendManualGracePeriodReminder');
await sendManualGracePeriodReminder({userId: 'USER_ID'});
```

### **2. Test Scan Limit Warning**
```typescript
const sendManualScanLimitWarning = functions.httpsCallable('sendManualScanLimitWarning');
await sendManualScanLimitWarning({userId: 'USER_ID'});
```

### **3. Test Payment Success**
```typescript
const sendManualPaymentNotification = functions.httpsCallable('sendManualPaymentNotification');
await sendManualPaymentNotification({
  userId: 'USER_ID',
  planId: 'premium',
  amount: 4.99,
  paymentMethod: 'mpesa',
  transactionId: 'test_123'
});
```

### **4. Test Price Alert**
```typescript
// First set an alert:
const setPriceAlert = functions.httpsCallable('setPriceAlert');
await setPriceAlert({
  itemId: 'ITEM_ID',
  itemName: 'Milk',
  targetPrice: 2.50,
  storeName: 'Carrefour'
});

// Then update the item price in Firestore (triggers notification)
```

### **5. Test Monthly Summary**
```typescript
const sendManualMonthlySummary = functions.httpsCallable('sendManualMonthlySummary');
await sendManualMonthlySummary({
  userId: 'USER_ID',
  month: 12,
  year: 2025
});
```

### **6. Test Feature Unlock**
```typescript
const sendManualFeatureUnlockNotification = functions.httpsCallable('sendManualFeatureUnlockNotification');
await sendManualFeatureUnlockNotification({
  userId: 'USER_ID',
  oldPlanId: 'basic',
  newPlanId: 'premium'
});
```

---

## 📅 Scheduled Functions Summary

| Function | Schedule | Timezone |
|----------|----------|----------|
| `checkGracePeriodReminders` | Daily at 10:00 AM | Africa/Kinshasa |
| `checkExpirationWarnings` | Daily at 9:00 AM | Africa/Kinshasa |
| `checkSubscriptionExpiration` | Daily at 9:00 AM | Africa/Kinshasa |
| `resetScanLimitWarnings` | 1st of month at 00:01 AM | Africa/Kinshasa |
| `sendMonthlySummaries` | 1st of month at 10:00 AM | Africa/Kinshasa |
| `sendWeeklySavingsTips` | Saturdays at 10:00 AM | Africa/Kinshasa |

---

## 🔐 Security & Privacy

### **Premium-Only Features**
Price alerts are gated:
```typescript
// Verify Premium subscription before creating alert
const subscription = await getSubscription(userId);
if (subscription?.planId !== 'premium') {
  throw new Error('Premium subscription required for price alerts');
}
```

### **User Authentication**
All callable functions require authentication:
```typescript
if (!context.auth) {
  throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
}
```

---

## 📈 Metrics to Monitor

1. **Notification Delivery Rate**
   - Check FCM success/failure counts
   - Monitor `pushNotificationsReceived` field

2. **Notification Open Rate**
   - Formula: `pushNotificationsOpened / pushNotificationsReceived`
   - Target: > 20%

3. **Grace Period Conversion**
   - Users who renew during grace period
   - Track via grace notification clicks → subscription screen

4. **Scan Limit Upgrades**
   - Users who upgrade after hitting 90% or 100%
   - Track via scan limit notification clicks → subscription screen

5. **Price Alert Engagement** (Premium)
   - Number of alerts set
   - Number of alerts triggered
   - Conversion to purchases

---

## 🐛 Troubleshooting

### **Notifications Not Received**
1. Check FCM token is saved: Query Firestore user document
2. Verify notification permissions: Check device settings
3. Check Cloud Functions logs: Firebase Console → Functions
4. Verify scheduled functions are running: Check execution logs

### **Foreground Notifications Not Showing**
- iOS: Must display custom alert (already implemented)
- Android: Should show automatically via FCM

### **Background Notifications Not Opening App**
- Check `onNotificationOpenedApp` handler
- Verify notification data contains proper routing info

### **Scheduled Functions Not Running**
- Check Cloud Scheduler in GCP Console
- Verify timezone is set correctly
- Check function execution logs

---

## 📝 Next Steps / Future Enhancements

1. **A/B Testing** - Test notification copy variations
2. **Quiet Hours** - Don't send notifications 10 PM - 8 AM
3. **Notification Preferences** - Let users customize which notifications they receive
4. **Rich Notifications** - Add images/actions to notifications
5. **Localization** - Add more languages beyond French/English
6. **Analytics Dashboard** - Track notification performance metrics
7. **Smart Timing** - Use ML to determine best time to send for each user

---

## 📞 Support

For issues or questions:
- Check Firebase Console logs
- Review notification engagement metrics in Firestore
- Test using manual callable functions first
- Monitor Cloud Function execution times and errors

---

**Last Updated:** December 23, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
