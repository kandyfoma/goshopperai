// Subscription Service
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import {
  Subscription,
  SubscriptionState,
  TRIAL_SCAN_LIMIT,
} from '@/shared/types';
import {COLLECTIONS, APP_ID} from './config';
import {authService} from './auth';

class SubscriptionService {
  /**
   * Get current subscription status
   */
  async getStatus(): Promise<Subscription> {
    const user = authService.getCurrentUser();
    if (!user) {
      return this.getDefaultSubscription('');
    }

    try {
      const doc = await firestore()
        .doc(COLLECTIONS.subscription(user.uid))
        .get();

      if (!doc.exists) {
        // Initialize subscription for new user
        const subscription = this.getDefaultSubscription(user.uid);
        await this.initializeSubscription(user.uid, subscription);
        return subscription;
      }

      const data = doc.data()!;
      return this.mapSubscription(data);
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }

  /**
   * Check if user can scan (has scans remaining or is subscribed)
   */
  async canScan(): Promise<boolean> {
    const subscription = await this.getStatus();

    if (subscription.isSubscribed && subscription.status === 'active') {
      // Check if subscription hasn't expired
      if (subscription.subscriptionEndDate) {
        return new Date(subscription.subscriptionEndDate) > new Date();
      }
      return true;
    }

    // Check trial scans
    return subscription.trialScansUsed < subscription.trialScansLimit;
  }

  /**
   * Get remaining scans (for trial users)
   */
  async getScansRemaining(): Promise<number> {
    const subscription = await this.getStatus();

    if (subscription.isSubscribed && subscription.status === 'active') {
      return Infinity; // Unlimited for subscribers
    }

    return Math.max(0, subscription.trialScansLimit - subscription.trialScansUsed);
  }

  /**
   * Record a scan usage
   */
  async recordScanUsage(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const subscription = await this.getStatus();

    // Subscribed users don't consume trial scans
    if (subscription.isSubscribed && subscription.status === 'active') {
      return;
    }

    // Check if trial scans available
    if (subscription.trialScansUsed >= subscription.trialScansLimit) {
      throw new Error('No scans remaining. Please subscribe to continue.');
    }

    // Increment trial usage
    await firestore()
      .doc(COLLECTIONS.subscription(user.uid))
      .update({
        trialScansUsed: firestore.FieldValue.increment(1),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  }

  /**
   * Subscribe to subscription status changes
   */
  subscribeToStatus(
    callback: (subscription: Subscription) => void,
  ): () => void {
    const user = authService.getCurrentUser();
    if (!user) {
      callback(this.getDefaultSubscription(''));
      return () => {};
    }

    return firestore()
      .doc(COLLECTIONS.subscription(user.uid))
      .onSnapshot(
        doc => {
          if (doc.exists) {
            callback(this.mapSubscription(doc.data()!));
          } else {
            callback(this.getDefaultSubscription(user.uid));
          }
        },
        error => {
          console.error('Subscription snapshot error:', error);
        },
      );
  }

  /**
   * Verify payment with backend
   */
  async verifyPayment(transactionRef: string): Promise<boolean> {
    try {
      const verifyPayment = functions().httpsCallable('verifyPayment');
      const result = await verifyPayment({transactionRef});
      return (result.data as {verified: boolean}).verified;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  /**
   * Initialize subscription for new user
   */
  private async initializeSubscription(
    userId: string,
    subscription: Subscription,
  ): Promise<void> {
    await firestore()
      .doc(COLLECTIONS.subscription(userId))
      .set({
        ...subscription,
        trialStartDate: firestore.FieldValue.serverTimestamp(),
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  }

  /**
   * Get default subscription for new users
   */
  private getDefaultSubscription(userId: string): Subscription {
    return {
      userId,
      trialScansUsed: 0,
      trialScansLimit: TRIAL_SCAN_LIMIT,
      isSubscribed: false,
      status: 'trial',
      autoRenew: false,
    };
  }

  /**
   * Map Firestore data to Subscription type
   */
  private mapSubscription(data: any): Subscription {
    return {
      userId: data.userId,
      trialScansUsed: data.trialScansUsed || 0,
      trialScansLimit: data.trialScansLimit || TRIAL_SCAN_LIMIT,
      trialStartDate: data.trialStartDate?.toDate(),
      isSubscribed: data.isSubscribed || false,
      plan: data.plan,
      status: data.status || 'trial',
      subscriptionStartDate: data.subscriptionStartDate?.toDate(),
      subscriptionEndDate: data.subscriptionEndDate?.toDate(),
      lastPaymentDate: data.lastPaymentDate?.toDate(),
      lastPaymentAmount: data.lastPaymentAmount,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      paymentProvider: data.paymentProvider,
      mobileMoneyProvider: data.mobileMoneyProvider,
      transactionId: data.transactionId,
      transactionRef: data.transactionRef,
      customerPhone: data.customerPhone,
      autoRenew: data.autoRenew || false,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  }
}

export const subscriptionService = new SubscriptionService();
