/**
 * Items Service
 * Handles fetching and caching of aggregated item data
 */

import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {APP_ID} from './config';
import {safeToDate} from '@/shared/utils/helpers';

const ITEMS_CACHE_KEY = 'items_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface ItemPrice {
  storeName: string;
  price: number;
  currency: 'USD' | 'CDF';
  date: Date;
  receiptId: string;
}

export interface AggregatedItem {
  id: string;
  name: string;
  nameNormalized: string;
  prices: ItemPrice[];
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  storeCount: number;
  currency: 'USD' | 'CDF';
  totalPurchases: number;
  lastPurchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CachedData {
  items: AggregatedItem[];
  timestamp: number;
}

interface PaginatedResult {
  items: AggregatedItem[];
  lastDoc: FirebaseFirestoreTypes.DocumentSnapshot | null;
  hasMore: boolean;
}

class ItemsService {
  private cache: AggregatedItem[] | null = null;
  private cacheTimestamp: number = 0;

  /**
   * Get items collection reference for a user
   */
  private getItemsCollection(userId: string) {
    return firestore()
      .collection('artifacts')
      .doc(APP_ID)
      .collection('users')
      .doc(userId)
      .collection('items');
  }

  /**
   * Fetch items with pagination
   */
  async fetchItems(
    userId: string,
    options: {
      limit?: number;
      startAfter?: FirebaseFirestoreTypes.DocumentSnapshot;
      searchQuery?: string;
      orderBy?: 'lastPurchaseDate' | 'totalPurchases' | 'name';
      orderDirection?: 'asc' | 'desc';
    } = {},
  ): Promise<PaginatedResult> {
    const {
      limit = 20,
      startAfter,
      searchQuery,
      orderBy = 'lastPurchaseDate',
      orderDirection = 'desc',
    } = options;

    try {
      let query: FirebaseFirestoreTypes.Query = this.getItemsCollection(userId);

      // Apply ordering
      query = query.orderBy(orderBy, orderDirection);

      // Apply pagination
      if (startAfter) {
        query = query.startAfter(startAfter);
      }

      query = query.limit(limit + 1); // Fetch one extra to check if there's more

      const snapshot = await query.get();
      const hasMore = snapshot.docs.length > limit;
      const items = snapshot.docs
        .slice(0, limit)
        .map(doc => this.documentToItem(doc));

      // Client-side search filter (Firestore doesn't support full-text search)
      let filteredItems = items;
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredItems = items.filter(item =>
          item.name.toLowerCase().includes(query),
        );
      }

      return {
        items: filteredItems,
        lastDoc: snapshot.docs[limit - 1] || null,
        hasMore,
      };
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  }

  /**
   * Get items from cache if available and fresh
   */
  async getCachedItems(userId: string): Promise<AggregatedItem[] | null> {
    // Check memory cache first
    const now = Date.now();
    if (this.cache && now - this.cacheTimestamp < CACHE_TTL) {
      console.log('✅ Returning items from memory cache');
      return this.cache;
    }

    try {
      // Check AsyncStorage cache
      const cachedData = await AsyncStorage.getItem(
        `${ITEMS_CACHE_KEY}_${userId}`,
      );
      if (cachedData) {
        const parsed: CachedData = JSON.parse(cachedData);
        if (now - parsed.timestamp < CACHE_TTL) {
          // Convert string dates back to Date objects
          const items = parsed.items.map(item => ({
            ...item,
            lastPurchaseDate: new Date(item.lastPurchaseDate),
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            prices: item.prices.map(p => ({
              ...p,
              date: new Date(p.date),
            })),
          }));

          // Update memory cache
          this.cache = items;
          this.cacheTimestamp = now;

          console.log('✅ Returning items from AsyncStorage cache');
          return items;
        }
      }
    } catch (error) {
      console.error('Error reading items cache:', error);
    }

    return null;
  }

  /**
   * Save items to cache
   */
  async setCachedItems(
    userId: string,
    items: AggregatedItem[],
  ): Promise<void> {
    try {
      const now = Date.now();

      // Update memory cache
      this.cache = items;
      this.cacheTimestamp = now;

      // Update AsyncStorage cache
      const cacheData: CachedData = {
        items,
        timestamp: now,
      };

      await AsyncStorage.setItem(
        `${ITEMS_CACHE_KEY}_${userId}`,
        JSON.stringify(cacheData),
      );

      console.log(`✅ Cached ${items.length} items`);
    } catch (error) {
      console.error('Error caching items:', error);
    }
  }

  /**
   * Clear cache
   */
  async clearCache(userId: string): Promise<void> {
    this.cache = null;
    this.cacheTimestamp = 0;
    try {
      await AsyncStorage.removeItem(`${ITEMS_CACHE_KEY}_${userId}`);
      console.log('✅ Items cache cleared');
    } catch (error) {
      console.error('Error clearing items cache:', error);
    }
  }

  /**
   * Get a single item by ID
   */
  async getItem(userId: string, itemId: string): Promise<AggregatedItem | null> {
    try {
      const doc = await this.getItemsCollection(userId).doc(itemId).get();

      if (!doc.exists) {
        return null;
      }

      return this.documentToItem(doc);
    } catch (error) {
      console.error(`Error fetching item ${itemId}:`, error);
      return null;
    }
  }

  /**
   * Trigger manual rebuild of items aggregation
   * Useful for backfilling or fixing data inconsistencies
   */
  async rebuildAggregation(userId: string): Promise<{
    success: boolean;
    itemsCount: number;
    receiptsProcessed: number;
  }> {
    try {
      console.log('Starting items aggregation rebuild...');

      const rebuildFunction = functions().httpsCallable<
        void,
        {success: boolean; itemsCount: number; receiptsProcessed: number}
      >('rebuildItemsAggregation');
      const result = await rebuildFunction();

      // Clear cache after rebuild
      await this.clearCache(userId);

      console.log('✅ Items aggregation rebuilt successfully');
      return result.data as {success: boolean; itemsCount: number; receiptsProcessed: number};
    } catch (error) {
      console.error('Error rebuilding items aggregation:', error);
      throw error;
    }
  }

  /**
   * Convert Firestore document to AggregatedItem
   */
  private documentToItem(
    doc: FirebaseFirestoreTypes.DocumentSnapshot,
  ): AggregatedItem {
    const data = doc.data()!;

    return {
      id: doc.id,
      name: data.name || '',
      nameNormalized: data.nameNormalized || '',
      prices: (data.prices || []).map((p: any) => ({
        storeName: p.storeName,
        price: p.price,
        currency: p.currency,
        date: safeToDate(p.date),
        receiptId: p.receiptId,
      })),
      minPrice: data.minPrice || 0,
      maxPrice: data.maxPrice || 0,
      avgPrice: data.avgPrice || 0,
      storeCount: data.storeCount || 0,
      currency: data.currency || 'USD',
      totalPurchases: data.totalPurchases || 0,
      lastPurchaseDate: safeToDate(data.lastPurchaseDate),
      createdAt: safeToDate(data.createdAt),
      updatedAt: safeToDate(data.updatedAt),
    };
  }

  /**
   * Subscribe to real-time updates for items
   */
  subscribeToItems(
    userId: string,
    callback: (items: AggregatedItem[]) => void,
    options: {
      limit?: number;
      orderBy?: 'lastPurchaseDate' | 'totalPurchases' | 'name';
    } = {},
  ): () => void {
    const {limit = 20, orderBy = 'lastPurchaseDate'} = options;

    const unsubscribe = this.getItemsCollection(userId)
      .orderBy(orderBy, 'desc')
      .limit(limit)
      .onSnapshot(
        snapshot => {
          const items = snapshot.docs.map(doc => this.documentToItem(doc));
          callback(items);

          // Update cache
          this.setCachedItems(userId, items);
        },
        error => {
          console.error('Error in items subscription:', error);
        },
      );

    return unsubscribe;
  }
}

export const itemsService = new ItemsService();
