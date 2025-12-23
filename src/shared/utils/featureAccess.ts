/**
 * Feature Access Control System
 * Controls which features are available based on subscription tier
 */

import {Subscription} from '../types';
import {Alert} from 'react-native';

export type FeatureName =
  | 'stats'
  | 'analytics'
  | 'priceComparison'
  | 'priceHistory'
  | 'priceAlerts'
  | 'categoryAnalysis'
  | 'dataExport'
  | 'offlineMode'
  | 'shoppingLists'
  | 'multipleShoppingLists';

/**
 * Feature availability by plan
 */
const FEATURE_ACCESS: Record<FeatureName, string[]> = {
  // Stats/Analytics - Standard+
  stats: ['standard', 'premium'],
  analytics: ['premium'],
  
  // Price features - Standard+
  priceComparison: ['standard', 'premium'],
  priceHistory: ['standard', 'premium'],
  priceAlerts: ['premium'],
  
  // Analysis - Standard+
  categoryAnalysis: ['standard', 'premium'],
  
  // Data management - Premium
  dataExport: ['premium'],
  
  // Offline - Standard+
  offlineMode: ['standard', 'premium'],
  
  // Shopping Lists - Basic+ (freemium gets 1 list only)
  shoppingLists: ['basic', 'standard', 'premium'],
  multipleShoppingLists: ['basic', 'standard', 'premium'],
};

/**
 * Feature descriptions for upgrade prompts
 */
const FEATURE_DESCRIPTIONS: Record<FeatureName, {
  name: string;
  description: string;
  minPlan: string;
}> = {
  stats: {
    name: 'Statistiques',
    description: 'Visualisez vos dépenses mensuelles et tendances',
    minPlan: 'Standard',
  },
  analytics: {
    name: 'Analytics Pro',
    description: 'Analyses avancées et prévisions de dépenses',
    minPlan: 'Premium',
  },
  priceComparison: {
    name: 'Comparaison de prix',
    description: 'Comparez les prix entre différents magasins',
    minPlan: 'Standard',
  },
  priceHistory: {
    name: 'Historique des prix',
    description: 'Suivez l\'évolution des prix dans le temps',
    minPlan: 'Standard',
  },
  priceAlerts: {
    name: 'Alertes de prix',
    description: 'Recevez des alertes quand les prix baissent',
    minPlan: 'Premium',
  },
  categoryAnalysis: {
    name: 'Analyse par catégorie',
    description: 'Analysez vos dépenses par catégorie de produits',
    minPlan: 'Standard',
  },
  dataExport: {
    name: 'Export de données',
    description: 'Exportez vos reçus et statistiques',
    minPlan: 'Premium',
  },
  offlineMode: {
    name: 'Mode hors ligne',
    description: 'Scannez sans connexion internet',
    minPlan: 'Standard',
  },
  shoppingLists: {
    name: 'Listes de courses',
    description: 'Créez et gérez vos listes de courses',
    minPlan: 'Basic',
  },
  multipleShoppingLists: {
    name: 'Plusieurs listes',
    description: 'Créez plusieurs listes de courses',
    minPlan: 'Basic',
  },
};

/**
 * Check if user has access to a feature
 */
export function hasFeatureAccess(
  feature: FeatureName,
  subscription: Subscription | null,
): boolean {
  if (!subscription) return false;

  const planId = subscription.planId || 'freemium';
  const allowedPlans = FEATURE_ACCESS[feature];

  // During trial, user has access to all features
  if (subscription.status === 'trial' && subscription.trialScansUsed !== undefined && subscription.trialEndDate) {
    const now = new Date();
    const trialEnd = subscription.trialEndDate instanceof Date 
      ? subscription.trialEndDate 
      : new Date(subscription.trialEndDate);
    if (now < trialEnd) {
      return true;
    }
  }

  return allowedPlans.includes(planId);
}

/**
 * Show upgrade prompt for locked feature
 */
export function showUpgradePrompt(
  feature: FeatureName,
  onUpgrade: () => void,
): void {
  const featureInfo = FEATURE_DESCRIPTIONS[feature];

  Alert.alert(
    `${featureInfo.name} - ${featureInfo.minPlan}`,
    `${featureInfo.description}\n\nMettez à niveau vers ${featureInfo.minPlan} pour débloquer cette fonctionnalité.`,
    [
      {
        text: 'Plus tard',
        style: 'cancel',
      },
      {
        text: 'Mettre à niveau',
        onPress: onUpgrade,
      },
    ],
  );
}

/**
 * Get minimum plan required for a feature
 */
export function getMinimumPlanFor(feature: FeatureName): string {
  return FEATURE_DESCRIPTIONS[feature].minPlan;
}

/**
 * Check if user can create more shopping lists
 */
export function canCreateShoppingList(
  subscription: Subscription | null,
  currentListCount: number,
): {canCreate: boolean; reason?: string} {
  if (!subscription) {
    return {canCreate: false, reason: 'Aucun abonnement'};
  }

  const planId = subscription.planId || 'freemium';

  // Freemium: 1 list only
  if (planId === 'freemium') {
    if (currentListCount >= 1) {
      return {
        canCreate: false,
        reason: 'Passez à Basic pour créer plusieurs listes',
      };
    }
  }

  // All other plans: unlimited
  return {canCreate: true};
}

/**
 * Get user-friendly plan name
 */
export function getPlanDisplayName(planId: string): string {
  const planNames: Record<string, string> = {
    freemium: 'Gratuit',
    free: 'Essai Gratuit',
    basic: 'Basic',
    standard: 'Standard',
    premium: 'Premium',
  };
  return planNames[planId] || planId;
}
