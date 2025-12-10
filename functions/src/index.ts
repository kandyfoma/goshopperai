/**
 * GoShopperAI Cloud Functions
 * Main entry point - exports all cloud functions
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export functions
export { parseReceipt, parseReceiptV2 } from './receipt/parseReceipt';
export { initiateMokoPayment, verifyMokoPayment, mokoPaymentWebhook } from './payments/mokoAfrika';
export { 
  getSubscriptionStatus, 
  recordScanUsage, 
  upgradeSubscription,
  cancelSubscription,
  checkExpiredSubscriptions,
} from './subscription/subscriptionManager';
export { savePriceData, getPriceComparison, getPriceHistory } from './prices/priceService';
