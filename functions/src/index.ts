/**
 * GoShopperAI Cloud Functions
 * Main entry point - exports all cloud functions
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export functions
export { parseReceipt, parseReceiptV2 } from './receipt/parseReceipt';

// Payment functions
export { initiateMokoPayment, verifyMokoPayment, mokoPaymentWebhook } from './payments/mokoAfrika';
export { createCardPaymentIntent, confirmCardPayment, stripeWebhook } from './payments/stripe';

// Subscription functions
export { 
  getSubscriptionStatus, 
  recordScanUsage, 
  upgradeSubscription,
  cancelSubscription,
  checkExpiredSubscriptions,
  extendTrial,
} from './subscription/subscriptionManager';

// Price functions
export { savePriceData, getPriceComparison, getPriceHistory } from './prices/priceService';

// Authentication & Verification functions
export {
  sendVerificationCode,
  verifyCode,
  completeRegistration,
  checkIdentifierAvailability,
} from './auth/verification';

// Phase 1.1 - Price Alerts functions
export {
  checkPriceAlerts,
  scheduledAlertCheck,
  createPriceAlert,
  getUserAlerts,
} from './alerts/priceAlerts';

// Phase 1.2 - Natural Language Query functions
export {
  processNLQuery,
  getSpendingSuggestions,
} from './assistant/naturalLanguage';
