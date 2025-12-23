/**
 * Price Alert Notification System (Premium Feature)
 * Monitors price changes and alerts users when target prices are reached
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {config} from '../config';

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Send price drop alert notification
 */
async function sendPriceDropAlert(
  userId: string,
  itemName: string,
  storeName: string,
  oldPrice: number,
  newPrice: number,
  targetPrice?: number,
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

    const priceDrop = oldPrice - newPrice;
    const percentDrop = Math.round((priceDrop / oldPrice) * 100);

    const title = targetPrice
      ? '🎯 Prix Cible Atteint!'
      : '💰 Alerte Baisse de Prix!';
    const titleEn = targetPrice ? '🎯 Target Price Reached!' : '💰 Price Drop Alert!';

    const message = targetPrice
      ? `${itemName} est maintenant à $${newPrice.toFixed(2)} (votre cible: $${targetPrice.toFixed(2)}) chez ${storeName}`
      : `${itemName} maintenant $${newPrice.toFixed(2)} (était $${oldPrice.toFixed(2)}, -${percentDrop}%) chez ${storeName}`;

    const messageEn = targetPrice
      ? `${itemName} is now $${newPrice.toFixed(2)} (your target: $${targetPrice.toFixed(2)}) at ${storeName}`
      : `${itemName} now $${newPrice.toFixed(2)} (was $${oldPrice.toFixed(2)}, -${percentDrop}%) at ${storeName}`;

    // Send FCM notification
    await messaging.send({
      token: fcmToken,
      notification: {
        title: language === 'fr' ? title : titleEn,
        body: language === 'fr' ? message : messageEn,
      },
      data: {
        type: 'price_alert',
        itemName,
        storeName,
        oldPrice: oldPrice.toString(),
        newPrice: newPrice.toString(),
        targetPrice: targetPrice?.toString() || '',
        priceDrop: priceDrop.toString(),
        percentDrop: percentDrop.toString(),
        action: 'view_item',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'price_alerts',
          icon: 'ic_notification',
          color: '#f59e0b',
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
      type: 'price_alert',
      title: language === 'fr' ? title : titleEn,
      titleFr: title,
      message: language === 'fr' ? message : messageEn,
      messageFr: message,
      priority: 'high',
      itemName,
      storeName,
      oldPrice,
      newPrice,
      targetPrice,
      priceDrop,
      percentDrop,
      read: false,
      actionUrl: '/items',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      `📧 Sent price alert to user ${userId} (${itemName}: $${oldPrice} → $${newPrice})`,
    );
  } catch (error) {
    console.error('Error sending price alert:', error);
  }
}

/**
 * Firestore trigger: Monitor city item price changes
 */
export const onCityItemPriceUpdate = functions
  .region(config.app.region)
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .firestore.document('artifacts/{appId}/cityItems/{itemId}')
  .onUpdate(async (change, context) => {
    try {
      const oldData = change.before.data();
      const newData = change.after.data();

      const oldPrice = oldData.price;
      const newPrice = newData.price;

      // Only proceed if price decreased
      if (!oldPrice || !newPrice || newPrice >= oldPrice) {
        return null;
      }

      const itemName = newData.name;
      const storeName = newData.storeName || 'Unknown store';
      const itemId = context.params.itemId;

      console.log(
        `💰 Price drop detected: ${itemName} from $${oldPrice} to $${newPrice}`,
      );

      // Find all users with price alerts for this item
      const alertsSnapshot = await db
        .collectionGroup('priceAlerts')
        .where('itemId', '==', itemId)
        .where('isActive', '==', true)
        .get();

      console.log(`   Found ${alertsSnapshot.size} active price alerts`);

      for (const alertDoc of alertsSnapshot.docs) {
        const alert = alertDoc.data();
        const userId = alert.userId;
        const targetPrice = alert.targetPrice;

        // Check if user has Premium subscription (price alerts are Premium-only)
        const subscriptionDoc = await db
          .doc(`artifacts/${config.app.id}/users/${userId}/subscription/${userId}`)
          .get();

        if (!subscriptionDoc.exists) {
          console.log(`   Skipping user ${userId} - no subscription`);
          continue;
        }

        const subscription = subscriptionDoc.data();
        if (subscription?.planId !== 'premium') {
          console.log(`   Skipping user ${userId} - not Premium subscriber`);
          continue;
        }

        // Send alert if new price is at or below target price
        if (targetPrice && newPrice <= targetPrice) {
          await sendPriceDropAlert(
            userId,
            itemName,
            storeName,
            oldPrice,
            newPrice,
            targetPrice,
          );

          // Mark alert as triggered
          await alertDoc.ref.update({
            triggered: true,
            triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
            triggeredPrice: newPrice,
          });
        } else if (!targetPrice) {
          // If no target price set, notify of any price drop
          const percentDrop = ((oldPrice - newPrice) / oldPrice) * 100;
          if (percentDrop >= 10) {
            // Only notify for drops of 10% or more
            await sendPriceDropAlert(
              userId,
              itemName,
              storeName,
              oldPrice,
              newPrice,
            );
          }
        }
      }

      return null;
    } catch (error) {
      console.error('City item price update trigger error:', error);
      return null;
    }
  });

/**
 * Callable function to set price alert (Premium feature)
 */
export const setPriceAlert = functions
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

    const userId = context.auth.uid;
    const {itemId, itemName, targetPrice, storeName} = data;

    if (!itemId || !itemName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'itemId and itemName are required',
      );
    }

    try {
      // Verify user has Premium subscription
      const subscriptionDoc = await db
        .doc(`artifacts/${config.app.id}/users/${userId}/subscription/${userId}`)
        .get();

      if (!subscriptionDoc.exists) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Premium subscription required for price alerts',
        );
      }

      const subscription = subscriptionDoc.data();
      if (subscription?.planId !== 'premium') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Premium subscription required for price alerts',
        );
      }

      // Create price alert
      const alertRef = db
        .collection(`artifacts/${config.app.id}/users/${userId}/priceAlerts`)
        .doc(itemId);

      await alertRef.set({
        userId,
        itemId,
        itemName,
        storeName: storeName || '',
        targetPrice: targetPrice || null,
        isActive: true,
        triggered: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(
        `📊 Price alert set for user ${userId}: ${itemName} at ${targetPrice ? `$${targetPrice}` : 'any price drop'}`,
      );

      return {
        success: true,
        message: 'Price alert set successfully',
        itemId,
        itemName,
        targetPrice,
      };
    } catch (error: any) {
      console.error('Set price alert error:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', 'Failed to set price alert');
    }
  });

/**
 * Callable function to remove price alert
 */
export const removePriceAlert = functions
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

    const userId = context.auth.uid;
    const {itemId} = data;

    if (!itemId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'itemId is required',
      );
    }

    try {
      const alertRef = db
        .collection(`artifacts/${config.app.id}/users/${userId}/priceAlerts`)
        .doc(itemId);

      await alertRef.delete();

      console.log(`🗑️ Price alert removed for user ${userId}: ${itemId}`);

      return {
        success: true,
        message: 'Price alert removed successfully',
        itemId,
      };
    } catch (error: any) {
      console.error('Remove price alert error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to remove price alert',
      );
    }
  });
