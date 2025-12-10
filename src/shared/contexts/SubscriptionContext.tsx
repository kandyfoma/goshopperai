// Subscription Context
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {Subscription, SubscriptionState, TRIAL_SCAN_LIMIT} from '@/shared/types';
import {subscriptionService} from '@/shared/services/firebase';
import {useAuth} from './AuthContext';

interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  recordScan: () => Promise<boolean>;
  checkCanScan: () => Promise<boolean>;
  trialScansUsed: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({children}: SubscriptionProviderProps) {
  const {user, isAuthenticated} = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscription: null,
    isLoading: true,
    canScan: false,
    scansRemaining: 0,
    error: null,
  });

  // Subscribe to subscription changes
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState({
        subscription: null,
        isLoading: false,
        canScan: false,
        scansRemaining: 0,
        error: null,
      });
      return;
    }

    const unsubscribe = subscriptionService.subscribeToStatus(subscription => {
      const scansRemaining = subscription.isSubscribed
        ? Infinity
        : Math.max(0, subscription.trialScansLimit - subscription.trialScansUsed);
      
      const canScan = subscription.isSubscribed || scansRemaining > 0;

      setState({
        subscription,
        isLoading: false,
        canScan,
        scansRemaining: scansRemaining === Infinity ? -1 : scansRemaining, // -1 = unlimited
        error: null,
      });
    });

    return unsubscribe;
  }, [isAuthenticated, user]);

  const refreshSubscription = useCallback(async () => {
    setState(prev => ({...prev, isLoading: true}));
    try {
      const subscription = await subscriptionService.getStatus();
      const scansRemaining = subscription.isSubscribed
        ? Infinity
        : Math.max(0, subscription.trialScansLimit - subscription.trialScansUsed);
      
      setState({
        subscription,
        isLoading: false,
        canScan: subscription.isSubscribed || scansRemaining > 0,
        scansRemaining: scansRemaining === Infinity ? -1 : scansRemaining,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
    }
  }, []);

  const recordScan = useCallback(async (): Promise<boolean> => {
    try {
      await subscriptionService.recordScanUsage();
      await refreshSubscription();
      return true;
    } catch (error: any) {
      setState(prev => ({...prev, error: error.message}));
      return false;
    }
  }, [refreshSubscription]);

  const checkCanScan = useCallback(async (): Promise<boolean> => {
    try {
      return await subscriptionService.canScan();
    } catch {
      return false;
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        refreshSubscription,
        recordScan,
        checkCanScan,
        trialScansUsed: state.subscription?.trialScansUsed || 0,
      }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider',
    );
  }
  return context;
}
