/**
 * Scan Limit Warning System
 * Sends notifications when users approach their monthly scan limits
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {config} from '../config';
import {Subscription} from '../types';

const db = admin.firestore();
const messaging = admin.messaging();

// Scan limit thresholds for warnings
const SCAN_LIMIT_THRESHOLDS = {
  WARNING_80: 80, // 80% used
  WARNING_90: 90, // 90% used
  LIMIT_REACHED: 100, // 100% used
};

// Plan scan limits (must match subscriptionManager.ts)
const PLAN_SCAN_LIMITS: {[key: string]: number} = {
  freemium: 3,
  basic: 20,
  standard: 50,
  premium: 200,
  trial: 10,
};

/**
 * Send scan limit warning notification
 */
async function sendScanLimitWarning(
  userId: string,
  scansUsed: number,
  scanLimit: number,
  percentUsed: number,
  planId: string,
): Promise<void> {
  try {
    // Get user's FCM token and language
    const userDoc = await db
      .doc(`artifacts/${config.app.id}/users/${userId}`)
      .get();
    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;
    const language = userData?.language || 'fr';

    if (!fcmToken) {
      console.log(`No FCM token for user ${userId}`);
      return;
    }

    const scansRemaining = scanLimit - scansUsed;

    let title: string;
    let titleFr: string;
    let message: string;
    let messageFr: string;
    let priority: 'high' | 'normal';
    let notificationType: string;

    if (percentUsed >= 100) {
      title = 'Monthly Scan Limit Reached';
      titleFr = 'Limite de Scans Atteinte';
      message = `You've used all ${scanLimit} scans this month. Upgrade to continue scanning or wait until next month.`;
      messageFr = `Vous avez utilisé tous vos ${scanLimit} scans ce mois-ci. Passez à un plan supérieur ou attendez le mois prochain.`;
      priority = 'high';
      notificationType = 'scan_limit_reached';
    } else if (percentUsed >= 90) {
      title = 'Almost Out of Scans!';
      titleFr = 'Presque Plus de Scans!';
      message = `Only ${scansRemaining} scans left out of ${scanLimit}. Upgrade now for more scans!`;
      messageFr = `Plus que ${scansRemaining} scans sur ${scanLimit}. Passez à un plan supérieur maintenant!`;
      priority = 'high';
      notificationType = 'scan_limit_90';
    } else {
      title = 'Scan Usage Update';
      titleFr = 'Mise à Jour Utilisation';
      message = `You've used ${scansUsed}/${scanLimit} scans this month (${Math.round(percentUsed)}%). ${scansRemaining} scans remaining.`;
      messageFr = `Vous avez utilisé ${scansUsed}/${scanLimit} scans ce mois-ci (${Math.round(percentUsed)}%). ${scansRemaining} scans restants.`;
      priority = 'normal';
      notificationType = 'scan_limit_80';
    }

    // Send FCM notification
    await messaging.send({
      token: fcmToken,
      notification: {
        title: language === 'fr' ? titleFr : title,
        body: language === 'fr' ? messageFr : message,
      },
      data: {
        type: notificationType,
        scansUsed: scansUsed.toString(),
        scanLimit: scanLimit.toString(),
        scansRemaining: scansRemaining.toString(),
        percentUsed: percentUsed.toString(),
        planId,
        action: percentUsed >= 90 ? 'upgrade' : 'view',
      },
      android: {
        priority: priority as 'high' | 'normal',
        notification: {
          channelId: 'scan_limits',
          icon: 'ic_notification',
          color: percentUsed >= 100 ? '#ef4444' : percentUsed >= 90 ? '#f59e0b' : '#10b981',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
          },
        },
      },
    });

    // Save notification to Firestore
    const notificationsRef = db
      .collection(`artifacts/${config.app.id}/users`)
      .doc(userId)
      .collection('notifications');

    await notificationsRef.add({
      type: notificationType,
      title: language === 'fr' ? titleFr : title,
      titleFr,
      message: language === 'fr' ? messageFr : message,
      messageFr,
      priority,
      scansUsed,
      scanLimit,
      scansRemaining,
      percentUsed,
      planId,
      read: false,
      actionUrl: percentUsed >= 90 ? '/subscription/upgrade' : '/subscription',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      `📧 Sent scan limit warning to user ${userId} (${scansUsed}/${scanLimit} - ${Math.round(percentUsed)}%)`,
    );
  } catch (error) {
    console.error('Error sending scan limit warning:', error);
  }
}

/**
 * Firestore trigger: Check scan limit when receipt is created
 */
export const onReceiptCreated = functions
  .region(config.app.region)
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .firestore.document('artifacts/{appId}/users/{userId}/receipts/{receiptId}')
  .onCreate(async (snap, context) => {
    try {
      const userId = context.params.userId;
      console.log(`📝 Receipt created for user ${userId}, checking scan limits...`);

      // Get subscription
      const subscriptionRef = db.doc(
        `artifacts/${config.app.id}/users/${userId}/subscription/${userId}`,
      );
      const subscriptionDoc = await subscriptionRef.get();

      if (!subscriptionDoc.exists) {
        console.log(`No subscription found for user ${userId}`);
        return null;
      }

      const subscription = subscriptionDoc.data() as Subscription;
      const planId = subscription.planId || 'freemium';
      const scanLimit = PLAN_SCAN_LIMITS[planId] || PLAN_SCAN_LIMITS.freemium;

      // Get monthly scan count
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const receiptsSnapshot = await db
        .collection(`artifacts/${config.app.id}/users/${userId}/receipts`)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(monthStart))
        .get();

      const scansUsed = receiptsSnapshot.size;
      const percentUsed = (scansUsed / scanLimit) * 100;

      console.log(
        `   User ${userId}: ${scansUsed}/${scanLimit} scans (${Math.round(percentUsed)}%)`,
      );

      // Check if we should send 80% warning
      if (
        percentUsed >= SCAN_LIMIT_THRESHOLDS.WARNING_80 &&
        percentUsed < SCAN_LIMIT_THRESHOLDS.WARNING_90 &&
        !subscription.scan80PercentWarningSent
      ) {
        await sendScanLimitWarning(userId, scansUsed, scanLimit, percentUsed, planId);
        await subscriptionRef.update({
          scan80PercentWarningSent: true,
          scan80PercentWarningDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Check if we should send 90% warning
      if (
        percentUsed >= SCAN_LIMIT_THRESHOLDS.WARNING_90 &&
        percentUsed < SCAN_LIMIT_THRESHOLDS.LIMIT_REACHED &&
        !subscription.scan90PercentWarningSent
      ) {
        await sendScanLimitWarning(userId, scansUsed, scanLimit, percentUsed, planId);
        await subscriptionRef.update({
          scan90PercentWarningSent: true,
          scan90PercentWarningDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Check if limit reached (100%)
      if (
        percentUsed >= SCAN_LIMIT_THRESHOLDS.LIMIT_REACHED &&
        !subscription.scanLimitReachedNotificationSent
      ) {
        await sendScanLimitWarning(userId, scansUsed, scanLimit, percentUsed, planId);
        await subscriptionRef.update({
          scanLimitReachedNotificationSent: true,
          scanLimitReachedDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return null;
    } catch (error) {
      console.error('Receipt created trigger error:', error);
      return null;
    }
  });

/**
 * Reset scan limit warning flags at start of each month
 * Runs on 1st of every month at 00:01 AM
 */
export const resetScanLimitWarnings = functions
  .region(config.app.region)
  .runWith({
    timeoutSeconds: 540,
    memory: '512MB',
  })
  .pubsub.schedule('1 0 1 * *')
  .timeZone('Africa/Kinshasa')
  .onRun(async context => {
    try {
      console.log('🔄 Resetting scan limit warning flags for new month...');

      const subscriptionsSnapshot = await db.collectionGroup('subscription').get();

      let resetCount = 0;
      const batch = db.batch();

      for (const doc of subscriptionsSnapshot.docs) {
        batch.update(doc.ref, {
          scan80PercentWarningSent: false,
          scan90PercentWarningSent: false,
          scanLimitReachedNotificationSent: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        resetCount++;
      }

      await batch.commit();

      console.log(`✅ Reset scan limit warnings for ${resetCount} subscriptions`);
      return null;
    } catch (error) {
      console.error('Reset scan limit warnings error:', error);
      return null;
    }
  });

/**
 * Manually send scan limit warning to a specific user
 */
export const sendManualScanLimitWarning = functions
  .region(config.app.region)
  .runWith({
    timeoutSeconds: 30,
    memory: '256MB',
  })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required',
      );
    }

    const requestingUserId = context.auth.uid;
    const {userId = requestingUserId} = data;

    if (userId !== requestingUserId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Can only send notifications to yourself',
      );
    }

    try {
      const subscriptionRef = db.doc(
        `artifacts/${config.app.id}/users/${userId}/subscription/${userId}`,
      );
      const subscriptionDoc = await subscriptionRef.get();

      if (!subscriptionDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Subscription not found',
        );
      }

      const subscription = subscriptionDoc.data() as Subscription;
      const planId = subscription.planId || 'freemium';
      const scanLimit = PLAN_SCAN_LIMITS[planId] || PLAN_SCAN_LIMITS.freemium;

      // Get monthly scan count
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const receiptsSnapshot = await db
        .collection(`artifacts/${config.app.id}/users/${userId}/receipts`)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(monthStart))
        .get();

      const scansUsed = receiptsSnapshot.size;
      const percentUsed = (scansUsed / scanLimit) * 100;

      await sendScanLimitWarning(userId, scansUsed, scanLimit, percentUsed, planId);

      return {
        success: true,
        message: `Scan limit warning sent`,
        scansUsed,
        scanLimit,
        percentUsed: Math.round(percentUsed),
      };
    } catch (error: any) {
      console.error('Manual scan limit warning error:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Failed to send scan limit warning',
      );
    }
  });
