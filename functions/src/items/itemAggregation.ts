/**
 * Item Aggregation Service
 * Aggregates item data from receipts for efficient querying
 * Triggered whenever a receipt is created or updated
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {config} from '../config';

const db = admin.firestore();

interface ItemPrice {
  storeName: string;
  price: number;
  currency: 'USD' | 'CDF';
  date: admin.firestore.Timestamp;
  receiptId: string;
}

interface AggregatedItem {
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
  lastPurchaseDate: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

/**
 * Normalize item name for consistent matching
 */
function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Get canonical form of a product name using synonyms
 */
function getCanonicalName(name: string): string {
  const normalized = normalizeItemName(name);

  // Common product synonyms for better grouping
  const synonyms: Record<string, string[]> = {
    'lait': ['milk', 'milch', 'leche'],
    'fromage': ['cheese', 'käse', 'queso'],
    'yaourt': ['yogurt', 'yoghurt', 'yogourt', 'yog', 'yo'],
    'creme': ['cream', 'crema'],
    'beurre': ['butter', 'mantequilla'],
    'oeuf': ['egg', 'eggs', 'huevo'],
    'pain': ['bread', 'baguette', 'pan'],
    'viande': ['meat', 'carne'],
    'poulet': ['chicken', 'pollo'],
    'boeuf': ['beef', 'carne de res'],
    'porc': ['pork', 'cerdo'],
    'poisson': ['fish', 'pescado'],
    'pomme': ['apple', 'apples', 'manzana'],
    'banane': ['banana', 'bananas', 'platano'],
    'orange': ['orange', 'oranges'],
    'tomate': ['tomato', 'tomatoes', 'jitomate'],
    'carotte': ['carrot', 'carrots', 'zanahoria'],
    'eau': ['water', 'agua'],
    'cafe': ['coffee', 'cafe'],
    'the': ['tea', 'te'],
    'biere': ['beer', 'cerveza'],
    'jus': ['juice', 'jugo'],
    'savon': ['soap', 'sav', 'savonnette'],
    'shampooing': ['shampoo', 'shamp', 'champoing'],
    'dentifrice': ['toothpaste', 'dent', 'pate dentifrice'],
  };

  // Check if normalized name matches any synonym
  for (const [canonical, variations] of Object.entries(synonyms)) {
    if (variations.some(v => normalized.includes(v) || v.includes(normalized))) {
      return canonical;
    }
  }

  return normalized;
}

/**
 * Aggregate items when a receipt is created or updated
 * Firestore trigger: artifacts/{config.app.id}/users/{userId}/receipts/{receiptId}
 */
export const aggregateItemsOnReceipt = functions
  .region('europe-west1')
  .firestore.document(
    `artifacts/${config.app.id}/users/{userId}/receipts/{receiptId}`,
  )
  .onWrite(async (change, context) => {
    const {userId, receiptId} = context.params;

    try {
      // Handle deletion
      if (!change.after.exists) {
        console.log(`Receipt ${receiptId} deleted - items aggregation skipped`);
        return null;
      }

      const receiptData = change.after.data();
      if (!receiptData || !receiptData.items || receiptData.items.length === 0) {
        console.log(`Receipt ${receiptId} has no items - skipping aggregation`);
        return null;
      }

      const items = receiptData.items as any[];
      const storeName = receiptData.storeName || 'Inconnu';
      const currency = receiptData.currency || 'USD';
      const receiptDate =
        receiptData.scannedAt ||
        receiptData.date ||
        admin.firestore.Timestamp.now();

      // Process each item in the receipt
      const batch = db.batch();
      const itemsCollectionPath = `artifacts/${config.app.id}/users/${userId}/items`;

      for (const item of items) {
        if (!item.name || !item.unitPrice || item.unitPrice <= 0) {
          continue;
        }

        const itemNameNormalized = getCanonicalName(item.name);
        const itemRef = db.collection(itemsCollectionPath).doc(itemNameNormalized);
        const itemDoc = await itemRef.get();

        const newPrice: ItemPrice = {
          storeName,
          price: item.unitPrice,
          currency,
          date: receiptDate,
          receiptId,
        };

        if (itemDoc.exists) {
          // Update existing item
          const existingData = itemDoc.data() as AggregatedItem;

          // Check if this receipt already has a price entry (update scenario)
          const existingPriceIndex = existingData.prices.findIndex(
            p => p.receiptId === receiptId,
          );

          let updatedPrices: ItemPrice[];
          if (existingPriceIndex >= 0) {
            // Update existing price from this receipt
            updatedPrices = [...existingData.prices];
            updatedPrices[existingPriceIndex] = newPrice;
          } else {
            // Add new price (limit to last 50 prices for performance)
            updatedPrices = [newPrice, ...existingData.prices].slice(0, 50);
          }

          // Recalculate statistics
          const prices = updatedPrices.map(p => p.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
          const storeCount = new Set(updatedPrices.map(p => p.storeName)).size;

          // Determine primary currency (most common)
          const currencyCounts = updatedPrices.reduce((acc, p) => {
            acc[p.currency] = (acc[p.currency] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const primaryCurrency = Object.entries(currencyCounts).sort(
            ([, a], [, b]) => b - a,
          )[0][0] as 'USD' | 'CDF';

          batch.update(itemRef, {
            name: item.name, // Update display name (keep latest)
            prices: updatedPrices,
            minPrice,
            maxPrice,
            avgPrice,
            storeCount,
            currency: primaryCurrency,
            totalPurchases: updatedPrices.length,
            lastPurchaseDate: receiptDate,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          // Create new item
          const newItem: Omit<AggregatedItem, 'createdAt' | 'updatedAt'> = {
            id: itemNameNormalized,
            name: item.name,
            nameNormalized: itemNameNormalized,
            prices: [newPrice],
            minPrice: item.unitPrice,
            maxPrice: item.unitPrice,
            avgPrice: item.unitPrice,
            storeCount: 1,
            currency,
            totalPurchases: 1,
            lastPurchaseDate: receiptDate,
          };

          batch.set(itemRef, {
            ...newItem,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      // Commit all item updates
      await batch.commit();
      console.log(
        `✅ Aggregated ${items.length} items for receipt ${receiptId}`,
      );

      return null;
    } catch (error) {
      console.error(`Error aggregating items for receipt ${receiptId}:`, error);
      // Don't throw - allow receipt to be saved even if aggregation fails
      return null;
    }
  });

/**
 * Callable function to manually trigger item aggregation for a user
 * Useful for backfilling existing data or fixing inconsistencies
 */
export const rebuildItemsAggregation = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated',
      );
    }

    const userId = context.auth.uid;

    try {
      console.log(`Starting items aggregation rebuild for user ${userId}`);

      // Clear existing items
      const itemsCollectionPath = `artifacts/${config.app.id}/users/${userId}/items`;
      const existingItems = await db.collection(itemsCollectionPath).get();
      const deleteBatch = db.batch();
      existingItems.docs.forEach(doc => deleteBatch.delete(doc.ref));
      await deleteBatch.commit();
      console.log(`Cleared ${existingItems.size} existing items`);

      // Get all receipts
      const receiptsSnapshot = await db
        .collection(`artifacts/${config.app.id}/users/${userId}/receipts`)
        .orderBy('scannedAt', 'desc')
        .get();

      console.log(`Processing ${receiptsSnapshot.size} receipts`);

      // Aggregate all items
      const itemsMap = new Map<string, AggregatedItem>();

      for (const receiptDoc of receiptsSnapshot.docs) {
        const receiptData = receiptDoc.data();
        if (!receiptData.items || receiptData.items.length === 0) {
          continue;
        }

        const storeName = receiptData.storeName || 'Inconnu';
        const currency = receiptData.currency || 'USD';
        const receiptDate =
          receiptData.scannedAt ||
          receiptData.date ||
          admin.firestore.Timestamp.now();

        for (const item of receiptData.items) {
          if (!item.name || !item.unitPrice || item.unitPrice <= 0) {
            continue;
          }

          const itemNameNormalized = getCanonicalName(item.name);
          const newPrice: ItemPrice = {
            storeName,
            price: item.unitPrice,
            currency,
            date: receiptDate,
            receiptId: receiptDoc.id,
          };

          if (itemsMap.has(itemNameNormalized)) {
            const existingItem = itemsMap.get(itemNameNormalized)!;
            existingItem.prices.push(newPrice);
          } else {
            itemsMap.set(itemNameNormalized, {
              id: itemNameNormalized,
              name: item.name,
              nameNormalized: itemNameNormalized,
              prices: [newPrice],
              minPrice: item.unitPrice,
              maxPrice: item.unitPrice,
              avgPrice: item.unitPrice,
              storeCount: 1,
              currency,
              totalPurchases: 1,
              lastPurchaseDate: receiptDate,
              createdAt: admin.firestore.Timestamp.now(),
              updatedAt: admin.firestore.Timestamp.now(),
            });
          }
        }
      }

      // Recalculate statistics for each item
      for (const [, item] of itemsMap) {
        const prices = item.prices.map(p => p.price);
        item.minPrice = Math.min(...prices);
        item.maxPrice = Math.max(...prices);
        item.avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        item.storeCount = new Set(item.prices.map(p => p.storeName)).size;
        item.totalPurchases = item.prices.length;

        // Limit to last 50 prices
        item.prices = item.prices
          .sort((a, b) => b.date.toMillis() - a.date.toMillis())
          .slice(0, 50);

        // Determine primary currency
        const currencyCounts = item.prices.reduce((acc, p) => {
          acc[p.currency] = (acc[p.currency] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        item.currency = Object.entries(currencyCounts).sort(
          ([, a], [, b]) => b - a,
        )[0][0] as 'USD' | 'CDF';
      }

      // Write aggregated items in batches (max 500 per batch)
      const itemsArray = Array.from(itemsMap.values());
      const batchSize = 500;

      for (let i = 0; i < itemsArray.length; i += batchSize) {
        const batch = db.batch();
        const batchItems = itemsArray.slice(i, i + batchSize);

        for (const item of batchItems) {
          const itemRef = db.collection(itemsCollectionPath).doc(item.id);
          batch.set(itemRef, item);
        }

        await batch.commit();
        console.log(
          `Wrote batch ${Math.floor(i / batchSize) + 1} (${batchItems.length} items)`,
        );
      }

      console.log(
        `✅ Rebuild complete: ${itemsArray.length} items aggregated from ${receiptsSnapshot.size} receipts`,
      );

      return {
        success: true,
        itemsCount: itemsArray.length,
        receiptsProcessed: receiptsSnapshot.size,
      };
    } catch (error) {
      console.error('Error rebuilding items aggregation:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to rebuild items aggregation',
      );
    }
  });

/**
 * Callable function to get aggregated items for a city
 * Returns items from all users in the same city
 * Updated to force redeploy
 */
export const getCityItems = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated',
      );
    }

    const userId = context.auth.uid;
    const { city } = data;

    if (!city || typeof city !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'City parameter is required and must be a string',
      );
    }

    try {
      console.log(`Getting city items for city: ${city}, user: ${userId}`);

      // Get all users in the city
      const usersSnapshot = await db
        .collection(`artifacts/${config.app.id}/users`)
        .where('defaultCity', '==', city)
        .get();

      const itemsMap = new Map<string, any>();

      // Process each user's items
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const itemsSnapshot = await db
          .collection(`artifacts/${config.app.id}/users/${userId}/items`)
          .get();

        itemsSnapshot.docs.forEach(doc => {
          const itemData = doc.data() as AggregatedItem;
          const itemName = itemData.nameNormalized;

          // Skip items without required data
          if (!itemName || !itemData.prices || !Array.isArray(itemData.prices)) {
            return;
          }

          if (!itemsMap.has(itemName)) {
            itemsMap.set(itemName, {
              id: itemName,
              name: itemData.name,
              prices: [],
              minPrice: itemData.minPrice,
              maxPrice: itemData.maxPrice,
              avgPrice: itemData.avgPrice,
              storeCount: itemData.storeCount,
              currency: itemData.currency,
              userCount: 1,
              lastPurchaseDate: itemData.lastPurchaseDate,
            });
          }

          const cityItem = itemsMap.get(itemName)!;

          // Merge prices from this user (filter out invalid prices)
          const validPrices = itemData.prices.filter(p => p && typeof p.price === 'number');
          cityItem.prices.push(...validPrices.map(p => ({ ...p, userId })));

          // Update statistics
          const allPrices = cityItem.prices.map((p: any) => p.price);
          if (allPrices.length > 0) {
            cityItem.minPrice = Math.min(...allPrices);
            cityItem.maxPrice = Math.max(...allPrices);
            cityItem.avgPrice = allPrices.reduce((sum: number, p: number) => sum + p, 0) / allPrices.length;
          }
          cityItem.storeCount = new Set(cityItem.prices.map((p: any) => p.storeName)).size;
          cityItem.userCount = new Set(cityItem.prices.map((p: any) => p.userId)).size;

          // Update last purchase date (safely)
          if (itemData.lastPurchaseDate && cityItem.lastPurchaseDate) {
            try {
              const newDate = itemData.lastPurchaseDate.toMillis ? itemData.lastPurchaseDate.toMillis() : 0;
              const currentDate = cityItem.lastPurchaseDate.toMillis ? cityItem.lastPurchaseDate.toMillis() : 0;
              if (newDate > currentDate) {
                cityItem.lastPurchaseDate = itemData.lastPurchaseDate;
              }
            } catch {
              // Keep existing date if comparison fails
            }
          }
        });
      }

      // Helper function to safely convert timestamp to Date
      const safeToDate = (value: any): Date => {
        if (!value) return new Date();
        if (value.toDate && typeof value.toDate === 'function') {
          return value.toDate();
        }
        if (value instanceof Date) return value;
        if (typeof value === 'string' || typeof value === 'number') {
          return new Date(value);
        }
        if (value._seconds !== undefined) {
          return new Date(value._seconds * 1000);
        }
        return new Date();
      };

      const cityItems = Array.from(itemsMap.values()).map(item => ({
        ...item,
        lastPurchaseDate: safeToDate(item.lastPurchaseDate),
        prices: item.prices.map((p: any) => ({
          ...p,
          date: safeToDate(p.date),
        })),
      }));

      console.log(`✅ Found ${cityItems.length} items for city ${city}`);

      return {
        success: true,
        items: cityItems,
        city,
      };
    } catch (error) {
      console.error('Error getting city items:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get city items',
      );
    }
  });
