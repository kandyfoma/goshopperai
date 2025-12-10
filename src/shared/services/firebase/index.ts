// Firebase services barrel export
export {initializeFirebase, firebaseAuth, firebaseFirestore, firebaseStorage, APP_ID, COLLECTIONS} from './config';
export {authService} from './auth';
export {subscriptionService} from './subscription';
export {receiptStorageService} from './receiptStorage';
export type {Shop} from './receiptStorage';

// Phase 1.1 Services
export {priceAlertsService} from './priceAlerts';
export type {PriceAlert, PriceAlertInput} from './priceAlerts';

export {offlineQueueService} from './offlineQueue';
export type {QueuedReceipt, QueuedImage} from './offlineQueue';

export {pushNotificationService} from './pushNotifications';
export type {PushNotification, NotificationPreferences} from './pushNotifications';

export {savingsTrackerService} from './savingsTracker';
export type {SavingsRecord, Achievement, UserStats} from './savingsTracker';

// Phase 1.2 Services
export {shoppingListService} from './shoppingList';
export type {ShoppingList, ShoppingListItem, OptimizationResult, StoreRecommendation} from './shoppingList';

export {naturalLanguageService} from './naturalLanguage';
export type {QueryResult, ConversationMessage, ChartData} from './naturalLanguage';
