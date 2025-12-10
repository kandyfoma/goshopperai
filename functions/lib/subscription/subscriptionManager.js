"use strict";
/**
 * Subscription Management Cloud Functions
 * Handles subscription status, trial tracking, and plan management
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExpiredSubscriptions = exports.cancelSubscription = exports.upgradeSubscription = exports.recordScanUsage = exports.getSubscriptionStatus = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const config_1 = require("../config");
const db = admin.firestore();
/**
 * Get current subscription status
 * Creates initial subscription if not exists
 */
exports.getSubscriptionStatus = functions
    .region(config_1.config.app.region)
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const userId = context.auth.uid;
    try {
        const subscriptionRef = db.doc(config_1.collections.subscription(userId));
        const subscriptionDoc = await subscriptionRef.get();
        if (!subscriptionDoc.exists) {
            // Initialize new user subscription
            const initialSubscription = {
                userId,
                trialScansUsed: 0,
                trialScansLimit: config_1.config.app.trialScanLimit,
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
                scansRemaining: config_1.config.app.trialScanLimit,
            };
        }
        const subscription = subscriptionDoc.data();
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
    }
    catch (error) {
        console.error('Get subscription error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get subscription status');
    }
});
/**
 * Record scan usage
 * Increments trial scan count or validates subscription
 */
exports.recordScanUsage = functions
    .region(config_1.config.app.region)
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const userId = context.auth.uid;
    try {
        const subscriptionRef = db.doc(config_1.collections.subscription(userId));
        return await db.runTransaction(async (transaction) => {
            const subscriptionDoc = await transaction.get(subscriptionRef);
            if (!subscriptionDoc.exists) {
                throw new functions.https.HttpsError('failed-precondition', 'Subscription not initialized');
            }
            const subscription = subscriptionDoc.data();
            // Subscribers can always scan
            if (subscription.isSubscribed) {
                return { success: true, canScan: true, scansRemaining: -1 };
            }
            // Check trial limit
            if (subscription.trialScansUsed >= subscription.trialScansLimit) {
                throw new functions.https.HttpsError('resource-exhausted', 'Trial limit reached. Please subscribe to continue.');
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
    }
    catch (error) {
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
exports.upgradeSubscription = functions
    .region(config_1.config.app.region)
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const userId = context.auth.uid;
    const { planId, transactionId, paymentDetails } = data;
    if (!planId || !transactionId) {
        throw new functions.https.HttpsError('invalid-argument', 'Plan ID and transaction ID are required');
    }
    const validPlans = ['basic', 'premium'];
    if (!validPlans.includes(planId)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid plan');
    }
    try {
        const subscriptionRef = db.doc(config_1.collections.subscription(userId));
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
    }
    catch (error) {
        console.error('Upgrade subscription error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to upgrade subscription');
    }
});
/**
 * Cancel subscription
 */
exports.cancelSubscription = functions
    .region(config_1.config.app.region)
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const userId = context.auth.uid;
    try {
        const subscriptionRef = db.doc(config_1.collections.subscription(userId));
        const subscriptionDoc = await subscriptionRef.get();
        if (!subscriptionDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Subscription not found');
        }
        const subscription = subscriptionDoc.data();
        if (!subscription.isSubscribed) {
            throw new functions.https.HttpsError('failed-precondition', 'No active subscription to cancel');
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
    }
    catch (error) {
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
exports.checkExpiredSubscriptions = functions
    .region(config_1.config.app.region)
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
    }
    catch (error) {
        console.error('Check expired subscriptions error:', error);
        return null;
    }
});
//# sourceMappingURL=subscriptionManager.js.map