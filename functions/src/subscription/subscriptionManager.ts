/**
 * Subscription Management Cloud Functions
 * Handles subscription status, trial tracking, and plan management
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { config, collections } from '../config';
import { Subscription } from '../types';

const db = admin.firestore();

/**
 * Get current subscription status
 * Creates initial subscription if not exists
 */
export const getSubscriptionStatus = functions
  .region(config.app.region)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    
    const userId = context.auth.uid;
    
    try {
      const subscriptionRef = db.doc(collections.subscription(userId));
      const subscriptionDoc = await subscriptionRef.get();
      
      if (!subscriptionDoc.exists) {
        // Initialize new user subscription
        const initialSubscription: Partial<Subscription> = {
          userId,
          trialScansUsed: 0,
          trialScansLimit: config.app.trialScanLimit,
          isSubscribed: false,
          planId: 'free',
          status: 'trial',
          autoRenew: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await subscriptionRef.set({
          ...initialSubscription,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        return {
          ...initialSubscription,
          canScan: true,
          scansRemaining: config.app.trialScanLimit,
        };
      }
      
      const subscription = subscriptionDoc.data() as Subscription;
      
      // Check if subscription has expired
      if (subscription.isSubscribed && subscription.subscriptionEndDate) {
        const endDate = subscription.subscriptionEndDate instanceof admin.firestore.Timestamp
          ? subscription.subscriptionEndDate.toDate()
          : new Date(subscription.subscriptionEndDate);
        
        if (endDate < new Date()) {
          // Subscription expired
          await subscriptionRef.update({
            isSubscribed: false,
            status: 'expired',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          subscription.isSubscribed = false;
          subscription.status = 'expired';
        }
      }
      
      // Calculate scan availability
      const canScan = subscription.isSubscribed || 
        subscription.trialScansUsed < subscription.trialScansLimit;
      
      const scansRemaining = subscription.isSubscribed 
        ? -1 // Unlimited for subscribers
        : Math.max(0, subscription.trialScansLimit - subscription.trialScansUsed);
      
      return {
        ...subscription,
        canScan,
        scansRemaining,
      };
      
    } catch (error) {
      console.error('Get subscription error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get subscription status');
    }
  });

/**
 * Record scan usage
 * Increments trial scan count or validates subscription
 */
export const recordScanUsage = functions
  .region(config.app.region)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    
    const userId = context.auth.uid;
    
    try {
      const subscriptionRef = db.doc(collections.subscription(userId));
      
      return await db.runTransaction(async (transaction) => {
        const subscriptionDoc = await transaction.get(subscriptionRef);
        
        if (!subscriptionDoc.exists) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Subscription not initialized'
          );
        }
        
        const subscription = subscriptionDoc.data() as Subscription;
        
        // Subscribers can always scan
        if (subscription.isSubscribed) {
          return { success: true, canScan: true, scansRemaining: -1 };
        }
        
        // Check trial limit
        if (subscription.trialScansUsed >= subscription.trialScansLimit) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            'Trial limit reached. Please subscribe to continue.'
          );
        }
        
        // Increment scan count
        transaction.update(subscriptionRef, {
          trialScansUsed: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        const newScansUsed = subscription.trialScansUsed + 1;
        const scansRemaining = subscription.trialScansLimit - newScansUsed;
        
        return {
          success: true,
          canScan: scansRemaining > 0,
          scansRemaining,
          scansUsed: newScansUsed,
        };
      });
      
    } catch (error) {
      console.error('Record scan usage error:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError('internal', 'Failed to record scan usage');
    }
  });

/**
 * Upgrade subscription (called after successful payment)
 */
export const upgradeSubscription = functions
  .region(config.app.region)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    
    const userId = context.auth.uid;
    const { planId, transactionId, paymentDetails } = data;
    
    if (!planId || !transactionId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Plan ID and transaction ID are required'
      );
    }
    
    const validPlans = ['basic', 'premium'];
    if (!validPlans.includes(planId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid plan');
    }
    
    try {
      const subscriptionRef = db.doc(collections.subscription(userId));
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
      
      await subscriptionRef.set({
        userId,
        isSubscribed: true,
        planId,
        status: 'active',
        subscriptionStartDate: admin.firestore.Timestamp.fromDate(now),
        subscriptionEndDate: admin.firestore.Timestamp.fromDate(endDate),
        lastPaymentDate: admin.firestore.Timestamp.fromDate(now),
        transactionId,
        autoRenew: true,
        ...paymentDetails,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      return {
        success: true,
        planId,
        expiresAt: endDate.toISOString(),
      };
      
    } catch (error) {
      console.error('Upgrade subscription error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to upgrade subscription');
    }
  });

/**
 * Cancel subscription
 */
export const cancelSubscription = functions
  .region(config.app.region)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    
    const userId = context.auth.uid;
    
    try {
      const subscriptionRef = db.doc(collections.subscription(userId));
      const subscriptionDoc = await subscriptionRef.get();
      
      if (!subscriptionDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Subscription not found');
      }
      
      const subscription = subscriptionDoc.data() as Subscription;
      
      if (!subscription.isSubscribed) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'No active subscription to cancel'
        );
      }
      
      // Don't immediately cancel - disable auto-renew
      // User keeps access until subscription end date
      await subscriptionRef.update({
        autoRenew: false,
        status: 'cancelled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      return {
        success: true,
        message: 'Subscription will not renew. Access continues until expiry.',
        expiresAt: subscription.subscriptionEndDate,
      };
      
    } catch (error) {
      console.error('Cancel subscription error:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError('internal', 'Failed to cancel subscription');
    }
  });

/**
 * Scheduled function to check and expire subscriptions
 * Runs daily at midnight
 */
export const checkExpiredSubscriptions = functions
  .region(config.app.region)
  .pubsub.schedule('0 0 * * *')
  .timeZone('Africa/Kinshasa')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    
    try {
      // Find all expired subscriptions that are still marked as active
      const expiredQuery = await db
        .collectionGroup('subscription')
        .where('isSubscribed', '==', true)
        .where('subscriptionEndDate', '<', now)
        .get();
      
      const batch = db.batch();
      let count = 0;
      
      expiredQuery.docs.forEach((doc) => {
        batch.update(doc.ref, {
          isSubscribed: false,
          status: 'expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        count++;
      });
      
      if (count > 0) {
        await batch.commit();
        console.log(`Expired ${count} subscriptions`);
      }
      
      return null;
      
    } catch (error) {
      console.error('Check expired subscriptions error:', error);
      return null;
    }
  });
