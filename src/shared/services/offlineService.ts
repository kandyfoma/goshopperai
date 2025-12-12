/**
 * Offline Service
 * 
 * Provides offline-first data management with automatic sync when online.
 * Features:
 * - Queue actions while offline
 * - Sync when connection restored
 * - Cache recent data locally
 * - Track pending operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';

// Storage keys
const STORAGE_KEYS = {
  OFFLINE_QUEUE: '@goshopperai/offline_queue',
  CACHED_RECEIPTS: '@goshopperai/cached_receipts',
  CACHED_ITEMS: '@goshopperai/cached_items',
  CACHED_SHOPPING_LIST: '@goshopperai/cached_shopping_list',
  LAST_SYNC: '@goshopperai/last_sync',
  OFFLINE_SCANS: '@goshopperai/offline_scans',
};

// Types
export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: 'receipts' | 'items' | 'shoppingList' | 'priceAlerts';
  documentId?: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  userId: string;
}

export interface CachedReceipt {
  id: string;
  storeName: string;
  total: number;
  date: string;
  itemCount: number;
  cachedAt: number;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingActions: number;
  lastSyncTime: Date | null;
  isSyncing: boolean;
}

type SyncStatusListener = (status: SyncStatus) => void;

class OfflineService {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private pendingQueue: OfflineAction[] = [];
  private listeners: Set<SyncStatusListener> = new Set();
  private lastSyncTime: Date | null = null;
  private unsubscribeNetInfo: (() => void) | null = null;

  /**
   * Initialize offline service
   */
  async initialize(): Promise<void> {
    // Load pending queue from storage
    await this.loadPendingQueue();
    
    // Load last sync time
    await this.loadLastSyncTime();
    
    // Subscribe to network changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(this.handleNetworkChange);
    
    // Check initial network state
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? true;
    
    console.log('Offline Service: Initialized, online:', this.isOnline);
    
    // Try to sync if online and have pending actions
    if (this.isOnline && this.pendingQueue.length > 0) {
      this.processPendingQueue();
    }
  }

  /**
   * Handle network status changes
   */
  private handleNetworkChange = (state: NetInfoState): void => {
    const wasOffline = !this.isOnline;
    this.isOnline = state.isConnected ?? false;
    
    console.log('Offline Service: Network changed, online:', this.isOnline);
    
    // Came back online - process pending queue
    if (wasOffline && this.isOnline && this.pendingQueue.length > 0) {
      console.log('Offline Service: Back online, processing queue...');
      this.processPendingQueue();
    }
    
    this.notifyListeners();
  };

  /**
   * Check if device is online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      pendingActions: this.pendingQueue.length,
      lastSyncTime: this.lastSyncTime,
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Queue an action for when online
   */
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const offlineAction: OfflineAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.pendingQueue.push(offlineAction);
    await this.savePendingQueue();
    
    console.log('Offline Service: Queued action:', offlineAction.type, offlineAction.collection);
    
    // If online, process immediately
    if (this.isOnline) {
      this.processPendingQueue();
    }
    
    this.notifyListeners();
    return offlineAction.id;
  }

  /**
   * Process pending queue
   */
  async processPendingQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.pendingQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    console.log('Offline Service: Processing', this.pendingQueue.length, 'pending actions');

    const processedIds: string[] = [];
    const failedActions: OfflineAction[] = [];

    for (const action of this.pendingQueue) {
      try {
        await this.executeAction(action);
        processedIds.push(action.id);
        console.log('Offline Service: Processed action:', action.id);
      } catch (error) {
        console.error('Offline Service: Failed to process action:', action.id, error);
        
        // Increment retry count
        action.retryCount++;
        
        // Keep in queue if under max retries
        if (action.retryCount < 3) {
          failedActions.push(action);
        } else {
          console.log('Offline Service: Dropping action after max retries:', action.id);
        }
      }
    }

    // Update queue with only failed actions
    this.pendingQueue = failedActions;
    await this.savePendingQueue();
    
    // Update last sync time
    this.lastSyncTime = new Date();
    await this.saveLastSyncTime();

    this.isSyncing = false;
    this.notifyListeners();

    console.log('Offline Service: Sync complete. Remaining:', this.pendingQueue.length);
  }

  /**
   * Execute a single action (override in implementation)
   */
  private async executeAction(action: OfflineAction): Promise<void> {
    // This would be implemented with actual Firestore calls
    // For now, we'll emit an event that the app can handle
    if (this.onActionExecute) {
      await this.onActionExecute(action);
    }
  }

  // Callback for executing actions - set by the app
  public onActionExecute?: (action: OfflineAction) => Promise<void>;

  /**
   * Cache receipts locally
   */
  async cacheReceipts(receipts: CachedReceipt[]): Promise<void> {
    try {
      const data = {
        receipts,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_RECEIPTS, JSON.stringify(data));
      console.log('Offline Service: Cached', receipts.length, 'receipts');
    } catch (error) {
      console.error('Offline Service: Failed to cache receipts:', error);
    }
  }

  /**
   * Get cached receipts
   */
  async getCachedReceipts(): Promise<CachedReceipt[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_RECEIPTS);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.receipts || [];
      }
    } catch (error) {
      console.error('Offline Service: Failed to get cached receipts:', error);
    }
    return [];
  }

  /**
   * Cache shopping list locally
   */
  async cacheShoppingList(items: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_SHOPPING_LIST, JSON.stringify(items));
    } catch (error) {
      console.error('Offline Service: Failed to cache shopping list:', error);
    }
  }

  /**
   * Get cached shopping list
   */
  async getCachedShoppingList(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_SHOPPING_LIST);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Offline Service: Failed to get cached shopping list:', error);
    }
    return [];
  }

  /**
   * Store offline scan for later processing
   */
  async storeOfflineScan(scanData: {imageUri: string; timestamp: number}): Promise<void> {
    try {
      const existing = await this.getOfflineScans();
      existing.push(scanData);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_SCANS, JSON.stringify(existing));
      console.log('Offline Service: Stored offline scan');
    } catch (error) {
      console.error('Offline Service: Failed to store offline scan:', error);
    }
  }

  /**
   * Get offline scans
   */
  async getOfflineScans(): Promise<{imageUri: string; timestamp: number}[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_SCANS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Offline Service: Failed to get offline scans:', error);
    }
    return [];
  }

  /**
   * Clear processed offline scans
   */
  async clearOfflineScans(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_SCANS);
    } catch (error) {
      console.error('Offline Service: Failed to clear offline scans:', error);
    }
  }

  /**
   * Add a listener for sync status changes
   */
  addListener(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.getSyncStatus());
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const status = this.getSyncStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Load pending queue from storage
   */
  private async loadPendingQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (data) {
        this.pendingQueue = JSON.parse(data);
        console.log('Offline Service: Loaded', this.pendingQueue.length, 'pending actions');
      }
    } catch (error) {
      console.error('Offline Service: Failed to load pending queue:', error);
      this.pendingQueue = [];
    }
  }

  /**
   * Save pending queue to storage
   */
  private async savePendingQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.pendingQueue));
    } catch (error) {
      console.error('Offline Service: Failed to save pending queue:', error);
    }
  }

  /**
   * Load last sync time from storage
   */
  private async loadLastSyncTime(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (data) {
        this.lastSyncTime = new Date(JSON.parse(data));
      }
    } catch (error) {
      console.error('Offline Service: Failed to load last sync time:', error);
    }
  }

  /**
   * Save last sync time to storage
   */
  private async saveLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(this.lastSyncTime?.toISOString()));
    } catch (error) {
      console.error('Offline Service: Failed to save last sync time:', error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearAllCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.CACHED_RECEIPTS,
        STORAGE_KEYS.CACHED_ITEMS,
        STORAGE_KEYS.CACHED_SHOPPING_LIST,
        STORAGE_KEYS.OFFLINE_SCANS,
      ]);
      console.log('Offline Service: Cleared all cache');
    } catch (error) {
      console.error('Offline Service: Failed to clear cache:', error);
    }
  }

  /**
   * Clear pending queue
   */
  async clearPendingQueue(): Promise<void> {
    this.pendingQueue = [];
    await this.savePendingQueue();
    this.notifyListeners();
  }

  /**
   * Cleanup on unmount
   */
  cleanup(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    this.listeners.clear();
  }
}

export const offlineService = new OfflineService();
