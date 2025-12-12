/**
 * Widget Data Service
 * 
 * Manages data sharing between React Native app and native widgets.
 * Uses App Groups (iOS) and SharedPreferences (Android) for data persistence.
 */

import {Platform} from 'react-native';

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

// App Group identifier (must match iOS widget configuration)
const APP_GROUP = 'group.com.goshopperai.widgets';

// SharedPreferences name (must match Android widget configuration)
const SHARED_PREFS_NAME = 'com.goshopperai.widgets';

// Widget data keys
const WIDGET_KEYS = {
  SPENDING: 'widget_spending_data',
  QUICK_STATS: 'widget_quick_stats',
  SHOPPING_LIST: 'widget_shopping_list',
};

// Lazy load the shared preferences library
let SharedGroupPreferences: any = null;

const loadSharedPreferences = async (): Promise<boolean> => {
  if (SharedGroupPreferences !== null) {
    return SharedGroupPreferences !== false;
  }

  try {
    SharedGroupPreferences = require('react-native-shared-group-preferences').default;
    return true;
  } catch (error) {
    console.log('Widget Service: react-native-shared-group-preferences not available');
    SharedGroupPreferences = false;
    return false;
  }
};

class WidgetDataService {
  private isAvailable: boolean = false;

  /**
   * Initialize the widget data service
   */
  async initialize(): Promise<void> {
    this.isAvailable = await loadSharedPreferences();
    
    if (this.isAvailable) {
      console.log('Widget Service: Initialized successfully');
    }
  }

  /**
   * Check if widget data sharing is available
   */
  isWidgetDataAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Save data to shared storage accessible by widgets
   */
  private async saveData(key: string, data: any): Promise<void> {
    if (!this.isAvailable || !SharedGroupPreferences) return;

    try {
      const jsonData = JSON.stringify(data);
      
      if (Platform.OS === 'ios') {
        await SharedGroupPreferences.setItem(key, jsonData, APP_GROUP);
      } else {
        await SharedGroupPreferences.setItem(key, jsonData, SHARED_PREFS_NAME);
      }
      
      console.log('Widget Service: Saved data for key:', key);
    } catch (error) {
      console.error('Widget Service: Failed to save data:', error);
    }
  }

  /**
   * Read data from shared storage
   */
  private async getData<T>(key: string): Promise<T | null> {
    if (!this.isAvailable || !SharedGroupPreferences) return null;

    try {
      let jsonData: string | null;
      
      if (Platform.OS === 'ios') {
        jsonData = await SharedGroupPreferences.getItem(key, APP_GROUP);
      } else {
        jsonData = await SharedGroupPreferences.getItem(key, SHARED_PREFS_NAME);
      }
      
      if (jsonData) {
        return JSON.parse(jsonData) as T;
      }
    } catch (error) {
      console.error('Widget Service: Failed to get data:', error);
    }
    
    return null;
  }

  /**
   * Update spending widget data
   */
  async updateSpendingWidget(data: WidgetSpendingData): Promise<void> {
    await this.saveData(WIDGET_KEYS.SPENDING, {
      ...data,
      lastUpdated: new Date().toISOString(),
    });
    
    // Trigger widget refresh
    this.refreshWidgets();
  }

  /**
   * Update quick stats widget data
   */
  async updateQuickStatsWidget(data: WidgetQuickStats): Promise<void> {
    await this.saveData(WIDGET_KEYS.QUICK_STATS, data);
    this.refreshWidgets();
  }

  /**
   * Update shopping list widget data
   */
  async updateShoppingListWidget(data: WidgetShoppingList): Promise<void> {
    await this.saveData(WIDGET_KEYS.SHOPPING_LIST, data);
    this.refreshWidgets();
  }

  /**
   * Get current spending widget data
   */
  async getSpendingWidgetData(): Promise<WidgetSpendingData | null> {
    return this.getData<WidgetSpendingData>(WIDGET_KEYS.SPENDING);
  }

  /**
   * Get current quick stats widget data
   */
  async getQuickStatsWidgetData(): Promise<WidgetQuickStats | null> {
    return this.getData<WidgetQuickStats>(WIDGET_KEYS.QUICK_STATS);
  }

  /**
   * Get current shopping list widget data
   */
  async getShoppingListWidgetData(): Promise<WidgetShoppingList | null> {
    return this.getData<WidgetShoppingList>(WIDGET_KEYS.SHOPPING_LIST);
  }

  /**
   * Trigger native widget refresh
   * Note: Actual implementation requires native code
   */
  private refreshWidgets(): void {
    // On iOS, this would trigger WidgetKit timeline reload
    // On Android, this would send broadcast to update AppWidget
    // The actual implementation is in the native widget code
    console.log('Widget Service: Refresh triggered');
  }

  /**
   * Update all widget data at once
   */
  async updateAllWidgets(data: {
    spending?: WidgetSpendingData;
    quickStats?: WidgetQuickStats;
    shoppingList?: WidgetShoppingList;
  }): Promise<void> {
    const promises: Promise<void>[] = [];
    
    if (data.spending) {
      promises.push(this.saveData(WIDGET_KEYS.SPENDING, data.spending));
    }
    if (data.quickStats) {
      promises.push(this.saveData(WIDGET_KEYS.QUICK_STATS, data.quickStats));
    }
    if (data.shoppingList) {
      promises.push(this.saveData(WIDGET_KEYS.SHOPPING_LIST, data.shoppingList));
    }
    
    await Promise.all(promises);
    this.refreshWidgets();
  }

  /**
   * Clear all widget data
   */
  async clearAllWidgetData(): Promise<void> {
    if (!this.isAvailable || !SharedGroupPreferences) return;

    try {
      const keys = Object.values(WIDGET_KEYS);
      
      for (const key of keys) {
        if (Platform.OS === 'ios') {
          await SharedGroupPreferences.setItem(key, '', APP_GROUP);
        } else {
          await SharedGroupPreferences.setItem(key, '', SHARED_PREFS_NAME);
        }
      }
      
      console.log('Widget Service: Cleared all widget data');
    } catch (error) {
      console.error('Widget Service: Failed to clear data:', error);
    }
  }
}

export const widgetDataService = new WidgetDataService();
