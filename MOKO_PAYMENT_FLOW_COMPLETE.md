# Moko Payment Flow - Complete Implementation

## Overview
Complete mobile money payment integration with webhook handling, subscription activation, and push notifications.

---

## 🔄 Payment Flow

### **1. Payment Initiation** (Frontend → Cloud Function)

**Screen:** `MokoPaymentScreen.tsx`

**User Actions:**
1. User selects subscription plan (Basic, Standard, or Premium)
2. Modal opens with payment form
3. User chooses:
   - ✅ **Use registered phone number** (if available in profile)
   - ✅ **Enter a different phone number**
4. System auto-detects mobile money provider:
   - M-Pesa (243 81, 82, 83, 84, 85, 89, 90)
   - Airtel Money (243 97, 99)
   - Orange Money (243 80, 81, 82, 83, 84, 85, 86, 89, 90)
   - Africell Money (243 90)
5. User clicks "Valider" button

**Frontend Code:**
```typescript
const response = await mokoPaymentService.initiatePayment({
  amount: planAmount,
  phoneNumber: selectedPhoneNumber,
  userId: user.uid,
  currency: 'USD',
  userInfo: {
    firstname: profile?.firstName,
    lastname: profile?.surname,
    email: user.email
  }
});
```

**Cloud Function:** `initiateMokoPayment`
- Creates payment record in Firestore
- Calls Railway payment hub API
- Returns transaction ID and instructions

---

### **2. Payment Processing** (User → Mobile Money Provider)

**User receives USSD prompt on their phone:**
- M-Pesa: User enters PIN to authorize
- Airtel Money: User confirms transaction
- Orange Money: User enters code
- Africell Money: User authorizes payment

---

### **3. Webhook Callback** (Mobile Money → Backend)

**Endpoint:** `mokoPaymentWebhook`  
**File:** `functions/src/payments/mokoAfrika.ts`

**Webhook receives:**
```json
{
  "transaction_id": "TXN123456",
  "status": "COMPLETED" | "FAILED" | "CANCELLED",
  "metadata": {
    "user_id": "USER_ID"
  }
}
```

**Webhook Processing:**
```typescript
// 1. Verify webhook signature
const signature = req.headers['x-signature'];
if (signature !== expectedSignature) {
  return res.status(401).json({error: 'Invalid signature'});
}

// 2. Update payment record
await paymentRef.update({
  status: newStatus, // 'completed' or 'failed'
  updatedAt: serverTimestamp(),
  completedAt: newStatus === 'completed' ? serverTimestamp() : undefined
});

// 3. Handle success
if (newStatus === 'completed') {
  // Activate subscription
  await activateSubscription(userId, planId, payment);
  
  // Send success notification
  await sendPaymentSuccessNotification(
    userId,
    planId,
    amount,
    provider,
    transaction_id
  );
}

// 4. Handle failure
else if (newStatus === 'failed') {
  // Send failure notification
  await sendPaymentFailedNotification(
    userId,
    planId,
    amount,
    provider,
    errorReason
  );
}
```

---

### **4. Subscription Activation** (Success Path)

**Function:** `activateSubscription()`

**Actions:**
```typescript
const now = new Date();
const endDate = new Date(now);
endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

await subscriptionRef.set({
  userId,
  isSubscribed: true,
  planId: 'basic' | 'standard' | 'premium',
  status: 'active',
  subscriptionStartDate: Timestamp.fromDate(now),
  subscriptionEndDate: Timestamp.fromDate(endDate),
  lastPaymentDate: Timestamp.fromDate(now),
  lastPaymentAmount: payment.amount,
  currency: 'USD',
  paymentMethod: 'mobile_money',
  paymentProvider: 'moko_afrika',
  mobileMoneyProvider: 'mpesa' | 'airtel' | 'orange' | 'afrimoney',
  transactionId: transaction_id,
  customerPhone: phoneNumber,
  autoRenew: true,
  updatedAt: serverTimestamp(),
}, {merge: true});
```

**Result:**
- ✅ Subscription activated immediately
- ✅ User gets access to plan features
- ✅ Scan limit increased
- ✅ Premium features unlocked (if applicable)

---

### **5. Push Notification** (Backend → User)

#### **Success Notification** ✅

**Channel:** `payment_confirmations` (HIGH priority)

**Message:**
```
Title: ✅ Paiement Réussi!
Body: Votre abonnement [Premium] est maintenant actif (1,000 scans/mois). 
      Merci pour votre confiance!
```

**Data:**
```json
{
  "type": "payment_success",
  "planId": "premium",
  "amount": "4.99",
  "paymentMethod": "mpesa",
  "transactionId": "TXN123456",
  "scans": "1000"
}
```

**Android Notification:**
- Color: #10b981 (green)
- Sound: default
- Vibration: ✅
- Badge: ✅

**Action:** Tapping opens Subscription screen

---

#### **Failure Notification** ❌

**Channel:** `payment_confirmations` (HIGH priority)

**Message:**
```
Title: ❌ Paiement Échoué
Body: Le paiement de $4.99 pour l'abonnement premium a échoué. 
      Veuillez réessayer.
```

**Data:**
```json
{
  "type": "payment_failed",
  "planId": "premium",
  "amount": "4.99",
  "paymentMethod": "mpesa",
  "errorReason": "Insufficient balance"
}
```

**Android Notification:**
- Color: #ef4444 (red)
- Sound: default
- Vibration: ✅
- Badge: ✅

**Action:** Tapping opens Payment screen to retry

---

### **6. Real-Time Status Updates** (Frontend)

**Supabase Real-Time Subscription:**

```typescript
// User sees live updates in the modal
useEffect(() => {
  if (!transactionId) return;

  const unsubscribe = mokoPaymentService.subscribeToPaymentStatus(
    transactionId,
    (status, details) => {
      setPaymentStatus(status);

      if (status === 'SUCCESS') {
        Alert.alert(
          'Paiement Réussi! 🎉',
          'Votre abonnement a été activé avec succès.',
          [{text: 'OK', onPress: () => navigation.navigate('Subscription')}]
        );
      } else if (status === 'FAILED') {
        Alert.alert(
          'Paiement Échoué',
          'Le paiement n\'a pas pu être traité. Veuillez réessayer.',
          [{text: 'Réessayer', onPress: handleRetry}]
        );
      }
    }
  );

  return unsubscribe;
}, [transactionId]);
```

---

## 📱 UI Features

### **Phone Number Selection**

#### **Option 1: Use Registered Phone** (Recommended)
- ✅ Pre-filled from user profile
- ✅ One-tap selection
- ✅ Auto-detects provider
- ✅ Faster checkout

```typescript
if (profile?.phoneNumber) {
  <TouchableOpacity onPress={() => setUseRegisteredPhone(true)}>
    <Text>Téléphone enregistré: {profile.phoneNumber}</Text>
  </TouchableOpacity>
}
```

#### **Option 2: Enter Different Number**
- ✅ Manual input field
- ✅ Real-time validation
- ✅ Provider auto-detection
- ✅ Format hints (243XXXXXXXXX)

```typescript
<TouchableOpacity onPress={() => setUseRegisteredPhone(false)}>
  <Text>Utiliser un autre numéro</Text>
</TouchableOpacity>
```

### **Provider Detection**

Automatic detection based on prefix:

| Operator | Prefixes | Display Name |
|----------|----------|--------------|
| M-Pesa | 243 81, 82, 83, 84, 85, 89, 90 | Vodacom M-Pesa |
| Airtel Money | 243 97, 99 | Airtel Money |
| Orange Money | 243 80, 81, 82, 83, 84, 85, 86, 89, 90 | Orange Money |
| Africell Money | 243 90 | Africell Money |

**Visual Feedback:**
- ✅ Green border when provider detected
- ✅ Provider logo/name displayed
- ✅ "Valider ✓ [Provider Name]" button

---

## 🔐 Security

### **Webhook Signature Verification**

```typescript
const signature = req.headers['x-signature'];
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}
```

### **Payment Record Validation**

- ✅ Verify transaction exists before processing
- ✅ Check user_id matches payment record
- ✅ Prevent duplicate processing
- ✅ Log all webhook attempts

---

## 📊 Payment Status States

| Status | Description | User Action | Backend Action |
|--------|-------------|-------------|----------------|
| `PENDING` | Payment initiated, waiting for user confirmation | Enter PIN on phone | Monitor webhook |
| `PROCESSING` | Provider processing payment | Wait | Monitor webhook |
| `COMPLETED` | Payment successful | Celebrate! 🎉 | Activate subscription + Notify |
| `FAILED` | Payment failed | Retry payment | Notify failure reason |
| `CANCELLED` | User cancelled | Retry payment | Update record |

---

## 🧪 Testing

### **Test Webhook Locally**

```bash
# Use ngrok to expose local endpoint
ngrok http 5001

# Update webhook URL in Railway/Moko dashboard
https://xxxxx.ngrok.io/goshopper-ai/us-central1/mokoPaymentWebhook

# Send test webhook
curl -X POST https://xxxxx.ngrok.io/goshopper-ai/us-central1/mokoPaymentWebhook \
  -H "Content-Type: application/json" \
  -H "x-signature: YOUR_SIGNATURE" \
  -d '{
    "transaction_id": "TEST123",
    "status": "COMPLETED",
    "metadata": {
      "user_id": "TEST_USER_ID"
    }
  }'
```

### **Test Push Notifications**

```typescript
// Manually trigger payment success notification
const sendManualPaymentNotification = functions.httpsCallable('sendManualPaymentNotification');
await sendManualPaymentNotification({
  userId: 'USER_ID',
  planId: 'premium',
  amount: 4.99,
  paymentMethod: 'mpesa',
  transactionId: 'TEST123'
});
```

---

## 📈 Monitoring

### **Key Metrics to Track**

1. **Payment Success Rate**
   ```typescript
   successRate = (completedPayments / totalPayments) * 100
   ```

2. **Average Payment Time**
   ```typescript
   avgTime = (paymentCompletedAt - paymentInitiatedAt) / paymentCount
   ```

3. **Provider Distribution**
   ```typescript
   {
     mpesa: 45%,
     airtel: 30%,
     orange: 20%,
     afrimoney: 5%
   }
   ```

4. **Failure Reasons**
   - Insufficient balance
   - Invalid PIN
   - Network timeout
   - User cancelled

### **Logging**

All webhook events logged with:
- ✅ Timestamp
- ✅ Transaction ID
- ✅ User ID
- ✅ Status
- ✅ Provider
- ✅ Amount
- ✅ Processing result

---

## 🐛 Troubleshooting

### **Payment Stuck in PENDING**

**Possible Causes:**
1. Webhook not received
2. User didn't complete transaction on phone
3. Network issues

**Solutions:**
- Check webhook logs in Railway dashboard
- Verify webhook URL is correct
- Check Firestore payment record status
- Contact user to retry

### **Subscription Not Activated**

**Check:**
1. Payment status is 'completed'
2. Webhook was received and processed
3. `activateSubscription()` executed without errors
4. Subscription document updated in Firestore

**Debug:**
```typescript
// Check payment record
const payment = await firestore()
  .collection('payments')
  .doc(transactionId)
  .get();

// Check subscription
const subscription = await firestore()
  .collection('subscriptions')
  .doc(userId)
  .get();
```

### **Notification Not Received**

**Check:**
1. User has FCM token saved
2. Notification permission granted
3. Cloud Function executed successfully
4. Check FCM delivery logs

---

## 🚀 Deployment

### **Backend (Cloud Functions)**

```bash
cd functions
firebase deploy --only functions:initiateMokoPayment,functions:mokoPaymentWebhook
```

### **Frontend (React Native)**

```bash
npm run android
# or
npm run ios
```

### **Webhook Configuration**

Set in Railway/Moko dashboard:
```
Webhook URL: https://us-central1-goshopper-ai.cloudfunctions.net/mokoPaymentWebhook
Secret: [YOUR_WEBHOOK_SECRET]
Events: payment.completed, payment.failed
```

---

## ✅ Features Checklist

- ✅ Phone number selection (registered vs new)
- ✅ Auto provider detection
- ✅ Real-time status updates
- ✅ Webhook signature verification
- ✅ Automatic subscription activation
- ✅ Push notification on success
- ✅ Push notification on failure
- ✅ Payment record tracking
- ✅ Error handling
- ✅ Retry mechanism
- ✅ Security validation

---

**Last Updated:** December 23, 2025  
**Version:** 2.0.0  
**Status:** ✅ Production Ready
