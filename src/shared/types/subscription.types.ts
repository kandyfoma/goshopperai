// Type definitions for Subscription

export type SubscriptionPlanId = 'free' | 'basic' | 'premium';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';
export type MobileMoneyProvider = 'mpesa' | 'orange' | 'airtel' | 'afrimoney';

export interface Subscription {
  userId: string;
  
  // Trial tracking
  trialScansUsed: number;
  trialScansLimit: number;
  trialStartDate?: Date;
  
  // Subscription details
  isSubscribed: boolean;
  planId?: SubscriptionPlanId;
  plan?: SubscriptionPlanId; // Alias for planId
  status: SubscriptionStatus;
  
  // Billing
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  expiryDate?: Date; // Alias for subscriptionEndDate
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  currency?: 'USD' | 'CDF';
  
  // Payment info
  paymentMethod?: 'mobile_money';
  paymentProvider?: 'moko_afrika';
  mobileMoneyProvider?: MobileMoneyProvider;
  transactionId?: string;
  transactionRef?: string;
  customerPhone?: string;
  
  // Auto-renewal
  autoRenew: boolean;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  canScan: boolean;
  scansRemaining: number;
  error: string | null;
}

export interface PlanPricing {
  plan: SubscriptionPlanId;
  priceUSD: number;
  priceCDF: number;
  duration: string;
  features: string[];
  popular?: boolean;
}

export const PLAN_PRICING: PlanPricing[] = [
  {
    plan: 'free',
    priceUSD: 0,
    priceCDF: 0,
    duration: 'Essai',
    features: [
      '5 scans gratuits',
      'Comparaison de prix basique',
      'Historique limité',
    ],
  },
  {
    plan: 'basic',
    priceUSD: 1.99,
    priceCDF: 5000,
    duration: 'mois',
    features: [
      '30 scans par mois',
      'Comparaison de prix complète',
      'Historique 30 jours',
    ],
  },
  {
    plan: 'premium',
    priceUSD: 2.99,
    priceCDF: 8000,
    duration: 'mois',
    features: [
      'Scans illimités',
      'Comparaison complète',
      'Historique illimité',
      'Alertes de prix',
      'Support prioritaire',
    ],
    popular: true,
  },
];

export const TRIAL_SCAN_LIMIT = 5;
