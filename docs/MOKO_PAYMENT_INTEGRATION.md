# Moko Payment Integration

This document describes the integration of Moko Mobile Money payments into GoShopper AI using the Africanite Payment Hub.

## Architecture

### Payment Hub (External Service)
- **URL**: `https://web-production-a4586.up.railway.app`
- **Platform**: Railway (EU West region)
- **Fixed IP**: `208.77.244.15` (whitelisted by FreshPay)
- **Provider**: FreshPay PayDRC API v5 (Moko Mobile Money)
- **Database**: Supabase PostgreSQL with real-time subscriptions

### Flow
1. User selects subscription plan in GoShopper
2. App navigates to `MokoPaymentScreen`
3. User enters phone number (auto-detects provider)
4. App calls Railway payment hub endpoint
5. Hub validates and calls FreshPay API
6. User receives push notification on phone
7. User enters PIN to confirm payment
8. FreshPay webhook updates Supabase database
9. App receives real-time update via Supabase subscription
10. Payment confirmed, subscription activated

## Supported Networks

| Phone Prefix | Network | Example |
|--------------|---------|---------|
| 81, 82, 83 | Vodacom M-Pesa | 243828812498 |
| 84, 85, 86, 89, 90, 91, 97, 99 | Airtel Money | 243997654321 |
| 80 | Orange Money | 243807654321 |
| 98 | Africell Money | 243987654321 |

The service automatically detects the provider from the phone number - no need to ask users.

## Files Created

### Service Layer
- **`src/shared/services/payment/mokoPaymentService.ts`**
  - Main payment service with all business logic
  - Functions: `initiatePayment`, `subscribeToPaymentStatus`, `validatePhoneNumber`, etc.
  - Supabase client configuration
  - Provider detection logic

### UI Layer
- **`src/features/payment/screens/MokoPaymentScreen.tsx`**
  - Complete payment UI with phone number input
  - Real-time payment status tracking
  - Provider auto-detection and display
  - Payment instructions per provider

### Navigation
- **Updated `src/shared/types/index.ts`**
  - Added `MokoPayment` route type with params
- **Updated `src/navigation/RootNavigator.tsx`**
  - Registered MokoPayment screen as modal
- **Updated `src/features/subscription/screens/SubscriptionScreen.tsx`**
  - Simplified mobile money payment to navigate to MokoPayment screen

## Configuration

### Supabase Credentials (Already Configured)
```typescript
const SUPABASE_URL = 'https://oacrwvfivsybkvndooyx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Payment Hub Endpoint
```typescript
const PAYMENT_API_URL = 'https://web-production-a4586.up.railway.app/initiate-payment';
```

## Installation

Add Supabase package (already added to package.json):
```bash
npm install @supabase/supabase-js@^2.39.3
# or
yarn add @supabase/supabase-js@^2.39.3
```

## Usage Example

```typescript
import { mokoPaymentService } from '@/shared/services/payment';

// Initiate payment
const response = await mokoPaymentService.initiatePayment({
  amount: 10,
  phoneNumber: '243828812498',
  userId: user.uid,
  currency: 'USD',
  userInfo: {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com'
  }
});

// Subscribe to status updates
const unsubscribe = mokoPaymentService.subscribeToPaymentStatus(
  response.transaction_id,
  (status) => {
    if (status === 'SUCCESS') {
      console.log('Payment confirmed!');
    }
  }
);

// Cleanup
return unsubscribe;
```

## Payment States

- **PENDING**: Payment initiated, waiting for user to enter PIN
- **SUCCESS**: Payment confirmed by FreshPay
- **FAILED**: Payment failed or cancelled

## Security

✅ **What's Secure**
- Merchant credentials stored on Railway server (not in app)
- Supabase ANON key is safe (read-only permissions)
- All payment processing happens server-side
- Fixed IP whitelisting prevents unauthorized access

❌ **Never Exposed**
- Merchant ID
- Merchant Secret
- FreshPay API keys
- Supabase service role keys

## Testing

### Test Payment Flow
1. Navigate to Subscription screen
2. Select any plan
3. Select "Mobile Money" payment method
4. Tap "S'abonner"
5. Enter test phone number: `243828812498`
6. Provider auto-detects as Vodacom M-Pesa
7. Tap "Payer $X.XX"
8. Check phone for payment prompt
9. Enter PIN
10. Watch status update in real-time

### Test Scenarios
- ✅ Valid phone numbers for each provider
- ✅ Invalid phone format (should show error)
- ✅ Mismatched provider (should show error)
- ✅ Payment timeout (user doesn't enter PIN)
- ✅ Payment cancellation
- ✅ Successful payment flow

## Troubleshooting

### Payment Stuck on PENDING
- User has 2 minutes to enter PIN
- Check if user received push notification
- Verify phone number format is correct
- Check Railway logs for webhook delivery

### Invalid Phone Number
- Format must be: 243XXXXXXXXX (12 digits)
- Must start with 243 (DRC country code)
- Prefix must match a supported provider

### No Real-time Update
- Check Supabase connection
- Verify transaction_id is correct
- Check browser console for Supabase errors
- Ensure Supabase real-time is enabled

## Support

**Railway Dashboard**: https://railway.app  
**Supabase Dashboard**: https://supabase.com  
**FreshPay Merchant Portal**: https://cd.merchants.gofreshpay.com/login  
**Technical Support**: support@gofreshbakery.com

## Future Enhancements

- [ ] Add payment retry logic
- [ ] Implement payment history view
- [ ] Add refund support
- [ ] Support CDF currency
- [ ] Add payment receipts
- [ ] Implement payment analytics dashboard
- [ ] Add support for multiple apps in payment hub

## Notes

- Payments are processed in USD
- Minimum payment amount: $1
- Average payment confirmation time: 30-60 seconds
- Payment hub handles ~100 requests/minute
- Database stores 90 days of transaction history
