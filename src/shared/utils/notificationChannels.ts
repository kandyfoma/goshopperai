/**
 * Android Notification Channels Setup
 * Note: Channels are defined in Cloud Functions and sent with each notification
 * This file documents the channels for reference
 */

export const NOTIFICATION_CHANNELS = {
  GRACE_PERIOD: {
    id: 'grace_period',
    name: 'Grace Period Alerts',
    description: 'Notifications about your grace period status',
    importance: 'high',
    color: '#f59e0b',
  },
  SCAN_LIMITS: {
    id: 'scan_limits',
    name: 'Scan Limit Warnings',
    description: 'Notifications when approaching your monthly scan limit',
    importance: 'high',
    color: '#ef4444',
  },
  SUBSCRIPTION_ALERTS: {
    id: 'subscription_alerts',
    name: 'Subscription Alerts',
    description: 'Subscription expiration and renewal notifications',
    importance: 'high',
    color: '#ef4444',
  },
  PAYMENT_CONFIRMATIONS: {
    id: 'payment_confirmations',
    name: 'Payment Confirmations',
    description: 'Payment success and failure notifications',
    importance: 'high',
    color: '#10b981',
  },
  PRICE_ALERTS: {
    id: 'price_alerts',
    name: 'Price Alerts',
    description: 'Notifications when prices drop (Premium feature)',
    importance: 'high',
    color: '#f59e0b',
  },
  FEATURE_UNLOCK: {
    id: 'feature_unlock',
    name: 'Feature Unlocks',
    description: 'Notifications when you unlock new features',
    importance: 'high',
    color: '#8b5cf6',
  },
  MONTHLY_SUMMARY: {
    id: 'monthly_summary',
    name: 'Monthly Summaries',
    description: 'Your monthly spending summary reports',
    importance: 'default',
    color: '#3b82f6',
  },
  SAVINGS_TIPS: {
    id: 'savings_tips',
    name: 'Savings Tips',
    description: 'Weekly AI-powered savings tips',
    importance: 'default',
    color: '#10b981',
  },
  ACHIEVEMENTS: {
    id: 'achievements',
    name: 'Achievements',
    description: 'Achievement unlock notifications',
    importance: 'high',
    color: '#f59e0b',
  },
  SYNC_NOTIFICATIONS: {
    id: 'sync_notifications',
    name: 'Sync Notifications',
    description: 'Data synchronization status',
    importance: 'low',
    color: '#10b981',
  },
  ADMIN_BROADCAST: {
    id: 'admin_broadcast',
    name: 'Important Updates',
    description: 'Important announcements and updates',
    importance: 'high',
    color: '#10b981',
  },
} as const;

export type NotificationChannel = keyof typeof NOTIFICATION_CHANNELS;

