/**
 * Feature Unlock Notification System
 * Sends notifications when users upgrade and unlock new features
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {config} from '../config';
import {Subscription} from '../types';

const db = admin.firestore();
const messaging = admin.messaging();

// Plan feature sets
const PLAN_FEATURES: {
  [key: string]: {fr: string[]; en: string[]};
} = {
  freemium: {
    fr: ['3 scans par mois', 'IA basique', 'Historique 7 jours', '1 liste de courses'],
    en: ['3 scans per month', 'Basic AI', '7-day history', '1 shopping list'],
  },
  basic: {
    fr: [
      '25 scans par mois',
      'IA avancée',
      'Historique illimité',
      'Listes illimitées',
      'Synchronisation cloud',
    ],
    en: [
      '25 scans per month',
      'Advanced AI',
      'Unlimited history',
      'Unlimited lists',
      'Cloud sync',
    ],
  },
  standard: {
    fr: [
      '100 scans par mois',
      'Comparaison de prix',
      'Statistiques détaillées',
      'Historique illimité',
      'Export de données',
    ],
    en: [
      '100 scans per month',
      'Price comparison',
      'Detailed statistics',
      'Unlimited history',
      'Data export',
    ],
  },
  premium: {
    fr: [
      '1,000 scans par mois',
      'Alertes de prix',
      'Analytics avancés',
      'Export de données',
      'Support prioritaire',
      'IA premium',
    ],
    en: [
      '1,000 scans per month',
      'Price alerts',
      'Advanced analytics',
      'Data export',
      'Priority support',
      'Premium AI',
    ],
  },
};

/**
 * Send feature unlock notification
 */
async function sendFeatureUnlockNotification(
  userId: string,
  oldPlanId: string,
  newPlanId: string,
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

    const planNames: {[key: string]: {en: string; fr: string}} = {
      freemium: {en: 'Free', fr: 'Gratuit'},
      basic: {en: 'Basic', fr: 'Basique'},
      standard: {en: 'Standard', fr: 'Standard'},
      premium: {en: 'Premium', fr: 'Premium'},
    };

    const newPlan = planNames[newPlanId] || {en: newPlanId, fr: newPlanId};
    const features = PLAN_FEATURES[newPlanId] || {fr: [], en: []};
    const featureList =
      language === 'fr' ? features.fr.join(', ') : features.en.join(', ');

    const title = `Bienvenue à ${newPlan.fr}!`;
    const titleEn = `Welcome to ${newPlan.en}!`;

    const message = `Vous avez maintenant accès à: ${featureList}`;
    const messageEn = `You now have access to: ${featureList}`;

    // Send FCM notification
    await messaging.send({
      token: fcmToken,
      notification: {
        title: language === 'fr' ? title : titleEn,
        body: language === 'fr' ? message : messageEn,
      },
      data: {
        type: 'feature_unlock',
        oldPlanId,
        newPlanId,
        features: JSON.stringify(language === 'fr' ? features.fr : features.en),
        action: 'explore_features',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'feature_unlock',
          icon: 'ic_notification',
          color: '#8b5cf6',
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
      type: 'feature_unlock',
      title: language === 'fr' ? title : titleEn,
      titleFr: title,
      message: language === 'fr' ? message : messageEn,
      messageFr: message,
      priority: 'high',
      oldPlanId,
      newPlanId,
      features: language === 'fr' ? features.fr : features.en,
      read: false,
      actionUrl: '/home',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      `📧 Sent feature unlock notification to user ${userId} (${oldPlanId} → ${newPlanId})`,
    );
  } catch (error) {
    console.error('Error sending feature unlock notification:', error);
  }
}

/**
 * Send plan downgrade notification
 */
async function sendPlanDowngradeNotification(
  userId: string,
  oldPlanId: string,
  newPlanId: string,
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

    const planNames: {[key: string]: {en: string; fr: string}} = {
      freemium: {en: 'Free', fr: 'Gratuit'},
      basic: {en: 'Basic', fr: 'Basique'},
      standard: {en: 'Standard', fr: 'Standard'},
      premium: {en: 'Premium', fr: 'Premium'},
    };

    const newPlan = planNames[newPlanId] || {en: newPlanId, fr: newPlanId};

    const title = `Plan Changé vers ${newPlan.fr}`;
    const titleEn = `Plan Changed to ${newPlan.en}`;

    const message = `Votre abonnement est maintenant ${newPlan.fr}. Certaines fonctionnalités peuvent ne plus être disponibles.`;
    const messageEn = `Your subscription is now ${newPlan.en}. Some features may no longer be available.`;

    // Send FCM notification
    await messaging.send({
      token: fcmToken,
      notification: {
        title: language === 'fr' ? title : titleEn,
        body: language === 'fr' ? message : messageEn,
      },
      data: {
        type: 'plan_downgrade',
        oldPlanId,
        newPlanId,
        action: 'view_subscription',
      },
      android: {
        priority: 'normal',
        notification: {
          channelId: 'feature_unlock',
          icon: 'ic_notification',
          color: '#f59e0b',
        },
      },
      apns: {
        payload: {
          aps: {
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
      type: 'plan_downgrade',
      title: language === 'fr' ? title : titleEn,
      titleFr: title,
      message: language === 'fr' ? message : messageEn,
      messageFr: message,
      priority: 'normal',
      oldPlanId,
      newPlanId,
      read: false,
      actionUrl: '/subscription',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      `📧 Sent plan downgrade notification to user ${userId} (${oldPlanId} → ${newPlanId})`,
    );
  } catch (error) {
    console.error('Error sending plan downgrade notification:', error);
  }
}

/**
 * Firestore trigger: Detect subscription plan changes
 */
export const onSubscriptionPlanChange = functions
  .region(config.app.region)
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .firestore.document('artifacts/{appId}/users/{userId}/subscription/{subscriptionId}')
  .onUpdate(async (change, context) => {
    try {
      const oldData = change.before.data() as Subscription;
      const newData = change.after.data() as Subscription;

      const oldPlanId = oldData.planId;
      const newPlanId = newData.planId;

      // Check if plan actually changed
      if (!oldPlanId || !newPlanId || oldPlanId === newPlanId) {
        return null;
      }

      const userId = context.params.userId;

      console.log(
        `📊 Plan change detected for user ${userId}: ${oldPlanId} → ${newPlanId}`,
      );

      // Define plan hierarchy
      const planHierarchy: {[key: string]: number} = {
        freemium: 0,
        basic: 1,
        standard: 2,
        premium: 3,
      };

      const oldPlanLevel = planHierarchy[oldPlanId] || 0;
      const newPlanLevel = planHierarchy[newPlanId] || 0;

      if (newPlanLevel > oldPlanLevel) {
        // Upgrade - send feature unlock notification
        await sendFeatureUnlockNotification(userId, oldPlanId, newPlanId);
      } else if (newPlanLevel < oldPlanLevel) {
        // Downgrade - send downgrade notification
        await sendPlanDowngradeNotification(userId, oldPlanId, newPlanId);
      }

      return null;
    } catch (error) {
      console.error('Subscription plan change trigger error:', error);
      return null;
    }
  });

/**
 * Manually send feature unlock notification (for testing)
 */
export const sendManualFeatureUnlockNotification = functions
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
    const {userId = requestingUserId, oldPlanId, newPlanId} = data;

    if (userId !== requestingUserId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Can only send notifications to yourself',
      );
    }

    if (!oldPlanId || !newPlanId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'oldPlanId and newPlanId are required',
      );
    }

    try {
      await sendFeatureUnlockNotification(userId, oldPlanId, newPlanId);

      return {
        success: true,
        message: 'Feature unlock notification sent',
        oldPlanId,
        newPlanId,
      };
    } catch (error: any) {
      console.error('Manual feature unlock notification error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to send feature unlock notification',
      );
    }
  });
