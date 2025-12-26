/**
 * Grace Period Notification System
 * Sends reminders to users during their 7-day grace period
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {differenceInDays} from 'date-fns';
import {config} from '../config';
import {Subscription} from '../types';

const db = admin.firestore();
const messaging = admin.messaging();

// Grace period notification thresholds (days before grace expires)
const GRACE_NOTIFICATION_DAYS = [7, 5, 3, 1];

/**
 * Send grace period reminder notification
 */
async function sendGracePeriodReminder(
  userId: string,
  subscription: Subscription,
  daysRemaining: number,
  scansRemaining: number,
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

    let title: string;
    let titleFr: string;
    let message: string;
    let messageFr: string;
    let priority: 'high' | 'normal';

    if (daysRemaining === 7) {
      title = 'Grace Period Active';
      titleFr = 'Période de Grâce Active';
      message = `You have 7 days to use your ${scansRemaining} remaining scans. After that, you'll switch to the free plan (3 scans/month).`;
      messageFr = `Vous avez 7 jours pour utiliser vos ${scansRemaining} scans restants. Après, vous passerez au plan gratuit (3 scans/mois).`;
      priority = 'normal';
    } else if (daysRemaining === 5) {
      title = '5 Days Left in Grace Period';
      titleFr = '5 Jours Restants en Période de Grâce';
      message = `Don't forget to use your ${scansRemaining} scans! Grace period ends in 5 days. Renew anytime to keep your plan.`;
      messageFr = `N'oubliez pas d'utiliser vos ${scansRemaining} scans! La période de grâce se termine dans 5 jours. Renouvelez pour garder votre plan.`;
      priority = 'normal';
    } else if (daysRemaining === 3) {
      title = '3 Days Left - Use Your Scans!';
      titleFr = '3 Jours Restants - Utilisez Vos Scans!';
      message = `Only 3 days left to use your ${scansRemaining} scans! Renew now to get ${subscription.planId === 'premium' ? '1,000' : subscription.planId === 'standard' ? '100' : '25'} new scans.`;
      messageFr = `Plus que 3 jours pour utiliser vos ${scansRemaining} scans! Renouvelez maintenant pour obtenir ${subscription.planId === 'premium' ? '1 000' : subscription.planId === 'standard' ? '100' : '25'} nouveaux scans.`;
      priority = 'high';
    } else {
      title = 'Last Day of Grace Period!';
      titleFr = 'Dernier Jour de Période de Grâce!';
      message = `This is your last day to use ${scansRemaining} remaining scans! Tomorrow you'll move to the free plan. Renew now to keep your benefits.`;
      messageFr = `C'est votre dernier jour pour utiliser ${scansRemaining} scans restants! Demain vous passerez au plan gratuit. Renouvelez maintenant pour garder vos avantages.`;
      priority = 'high';
    }

    // Send FCM notification
    await messaging.send({
      token: fcmToken,
      notification: {
        title: language === 'fr' ? titleFr : title,
        body: language === 'fr' ? messageFr : message,
      },
      data: {
        type: 'grace_period_reminder',
        daysRemaining: daysRemaining.toString(),
        scansRemaining: scansRemaining.toString(),
        planId: subscription.planId || 'basic',
        action: 'renew',
      },
      android: {
        priority: priority as 'high' | 'normal',
        notification: {
          channelId: 'grace_period',
          icon: 'ic_notification',
          color: daysRemaining <= 3 ? '#f59e0b' : '#10b981',
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
      type: 'grace_period_reminder',
      title: language === 'fr' ? titleFr : title,
      titleFr,
      message: language === 'fr' ? messageFr : message,
      messageFr,
      priority,
      daysRemaining,
      scansRemaining,
      planId: subscription.planId,
      read: false,
      actionUrl: '/subscription/renew',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      `📧 Sent grace period reminder to user ${userId} (${daysRemaining} days, ${scansRemaining} scans)`,
    );
  } catch (error) {
    console.error('Error sending grace period reminder:', error);
  }
}

/**
 * Scheduled function to check and send grace period reminders
 * Runs daily at 10 AM Africa/Kinshasa time
 */
export const checkGracePeriodReminders = functions
  .region(config.app.region)
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '512MB',
  })
  .pubsub.schedule('0 10 * * *')
  .timeZone('Africa/Kinshasa')
  .onRun(async context => {
    try {
      const now = new Date();
      console.log(
        `🔔 Starting grace period reminder check at ${now.toISOString()}`,
      );

      let totalNotificationsSent = 0;

      // Find all subscriptions in grace period
      const graceSubscriptions = await db
        .collectionGroup('subscription')
        .where('status', '==', 'grace')
        .get();

      console.log(
        `\n📅 Found ${graceSubscriptions.size} subscriptions in grace period`,
      );

      for (const doc of graceSubscriptions.docs) {
        const subscription = doc.data() as Subscription;
        const userId = subscription.userId;

        // Calculate days until grace period expires
        const graceEndDate =
          subscription.subscriptionEndDate instanceof admin.firestore.Timestamp
            ? subscription.subscriptionEndDate.toDate()
            : new Date(subscription.subscriptionEndDate!);

        // Grace period is 7 days after subscription end
        graceEndDate.setDate(graceEndDate.getDate() + 7);

        const daysRemaining = differenceInDays(graceEndDate, now);

        // Only send notifications on specific days
        if (!GRACE_NOTIFICATION_DAYS.includes(daysRemaining)) {
          continue;
        }

        // Check if we've already sent notification for this day
        const lastNotificationDay = subscription.graceNotificationDay;
        if (lastNotificationDay === daysRemaining) {
          console.log(
            `   ⏭️ Skipping user ${userId} - notification already sent for day ${daysRemaining}`,
          );
          continue;
        }

        // Calculate remaining scans
        const scansRemaining =
          (subscription.scansRemaining || 0) > 0
            ? subscription.scansRemaining
            : 0;

        // Send notification
        await sendGracePeriodReminder(
          userId,
          subscription,
          daysRemaining,
          scansRemaining!,
        );

        // Update subscription with notification tracking
        await doc.ref.update({
          graceNotificationDay: daysRemaining,
          graceNotificationSent: true,
          graceNotificationDate: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        totalNotificationsSent++;
      }

      console.log(
        `\n✅ Grace period reminder check complete: ${totalNotificationsSent} notifications sent`,
      );

      return null;
    } catch (error) {
      console.error('Grace period reminder check error:', error);
      return null;
    }
  });

/**
 * Manually send grace period reminder to a specific user
 */
export const sendManualGracePeriodReminder = functions
  .region(config.app.region)
  .runWith({
    timeoutSeconds: 30,
    memory: '256MB',
  })
  .https.onCall(async (data, context) => {
    // Authentication required
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required',
      );
    }

    const requestingUserId = context.auth.uid;
    const {userId = requestingUserId} = data;

    // Users can only send to themselves
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

      if (subscription.status !== 'grace') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Subscription is not in grace period',
        );
      }

      const now = new Date();
      const graceEndDate =
        subscription.subscriptionEndDate instanceof admin.firestore.Timestamp
          ? subscription.subscriptionEndDate.toDate()
          : new Date(subscription.subscriptionEndDate!);

      graceEndDate.setDate(graceEndDate.getDate() + 7);

      const daysRemaining = differenceInDays(graceEndDate, now);

      if (daysRemaining < 0) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Grace period has expired',
        );
      }

      const scansRemaining = subscription.scansRemaining || 0;

      // Send notification
      await sendGracePeriodReminder(
        userId,
        subscription,
        daysRemaining,
        scansRemaining,
      );

      // Update tracking
      await subscriptionRef.update({
        graceNotificationDay: daysRemaining,
        graceNotificationSent: true,
        graceNotificationDate: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: `Grace period reminder sent (${daysRemaining} days, ${scansRemaining} scans remaining)`,
        daysRemaining,
        scansRemaining,
      };
    } catch (error: any) {
      console.error('Manual grace period reminder error:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        'internal',
        'Failed to send grace period reminder',
      );
    }
  });
