/**
 * Widget Data Service
 * 
 * Manages data for widgets using CacheManager for better performance.
 * Native widget communication can be added later via native modules.
 */

import {cacheManager, CacheTTL, CachePriority} from './caching';

// Types for widget data
export interface WidgetSpendingData {
  monthlyTotal: number;
  monthlyBudget: number;
  currency: string;
  lastUpdated: string;
  percentUsed: number;
}

export interface WidgetQuickStats {
  totalReceipts: number;
  totalSaved: number;
  lastScanDate: string | null;
  favoriteStore: string | null;
}

export interface WidgetShoppingList {
  items: Array<{
    id: string;
    name: string;
    checked: boolean;
  }>;
  totalItems: number;
  checkedItems: number;
}

class WidgetDataService {
  /**
   * Initialize the widget data service
   */
  async initialize(): Promise<void> {
    // No initialization needed
  }

  /**
   * Check if widget data sharing is available
   */
  isWidgetDataAvailable(): boolean {
    return true;
  }

  /**
   * Update spending widget data
   */
  async updateSpendingWidget(data: WidgetSpendingData): Promise<void> {
    await cacheManager.set(
      'spending',
      {
        ...data,
        lastUpdated: new Date().toISOString(),
      },
      {
        namespace: 'widgets',
        ttl: CacheTTL.DAY,
        priority: CachePriority.HIGH,
      }
    );
  }

  /**
   * Update quick stats widget data
   */
  async updateQuickStatsWidget(data: WidgetQuickStats): Promise<void> {
    await cacheManager.set(
      'quick-stats',
      {
        ...data,
      lastUpdated: new Date().toISOString(),
    });
  }

  /**
   * Update shopping list widget data
   */
  async updateShoppingListWidget(data: WidgetShoppingList): Promise<void> {
    await cacheManager.set(
      'shopping-list',
      data,
      {
        namespace: 'widgets',
        ttl: CacheTTL.DAY,
        priority: CachePriority.NORMAL,
      }
    );
  }

  /**
   * Get spending widget data
   */
  async getSpendingWidgetData(): Promise<WidgetSpendingData | null> {
    return cacheManager.get<WidgetSpendingData>('spending', 'widgets');
  }

  /**
   * Get quick stats widget data
   */
  async getQuickStatsWidgetData(): Promise<WidgetQuickStats | null> {
    return cacheManager.get<WidgetQuickStats>('quick-stats', 'widgets');
  }

  /**
   * Get shopping list widget data
   */
  async getShoppingListWidgetData(): Promise<WidgetShoppingList | null> {
    return cacheManager.get<WidgetShoppingList>('shopping-list', 'widgets');
  }

  /**
   * Update all widget data at once
   */
  async updateAllWidgets(data: {
    spending?: WidgetSpendingData;
    quickStats?: WidgetQuickStats;
    shoppingList?: WidgetShoppingList;
  }): Promise<void> {
    const promises: Promise<boolean>[] = [];
    
    if (data.spending) {
      promises.push(
        cacheManager.set('spending', data.spending, {
          namespace: 'widgets',
          ttl: CacheTTL.DAY,
          priority: CachePriority.HIGH,
        })
      );
    }
    if (data.quickStats) {
      promises.push(
        cacheManager.set('quick-stats', data.quickStats, {
          namespace: 'widgets',
          ttl: CacheTTL.DAY,
          priority: CachePriority.HIGH,
        })
      );
    }
    if (data.shoppingList) {
      promises.push(
        cacheManager.set('shopping-list', data.shoppingList, {
          namespace: 'widgets',
          ttl: CacheTTL.DAY,
          priority: CachePriority.NORMAL,
        })
      );
    }
    
    await Promise.all(promises);
  }

  /**
   * Clear all widget data
   */
  async clearAllWidgetData(): Promise<void> {
    await cacheManager.clearNamespace('widgets');
  }
}

export const widgetDataService = new WidgetDataService();
