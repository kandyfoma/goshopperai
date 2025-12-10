/**
 * Price Service Cloud Functions
 * Handles price data aggregation and comparison
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { config, collections } from '../config';
import { PricePoint, PriceComparison, ReceiptItem } from '../types';

const db = admin.firestore();

/**
 * Normalize product name for matching
 */
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Save price data from parsed receipt
 * Called internally after receipt parsing
 */
export const savePriceData = functions
  .region(config.app.region)
  .firestore.document(`artifacts/${config.app.id}/users/{userId}/receipts/{receiptId}`)
  .onCreate(async (snapshot, context) => {
    const receipt = snapshot.data();
    const { userId, receiptId } = context.params;
    
    if (!receipt || !receipt.items || receipt.items.length === 0) {
      return null;
    }
    
    try {
      const batch = db.batch();
      const pricesCollection = db.collection(collections.prices);
      const now = admin.firestore.FieldValue.serverTimestamp();
      
      for (const item of receipt.items as ReceiptItem[]) {
        const pricePointRef = pricesCollection.doc();
        
        const pricePoint: Partial<PricePoint> = {
          productName: item.name,
          productNameNormalized: item.nameNormalized || normalizeProductName(item.name),
          storeName: receipt.storeName,
          storeNameNormalized: receipt.storeNameNormalized,
          price: item.unitPrice,
          currency: receipt.currency,
          unit: item.unit,
          quantity: item.quantity,
          pricePerUnit: item.unitPrice,
          recordedAt: now as unknown as Date,
          receiptId,
          userId,
        };
        
        batch.set(pricePointRef, pricePoint);
      }
      
      await batch.commit();
      console.log(`Saved ${receipt.items.length} price points for receipt ${receiptId}`);
      
      return null;
      
    } catch (error) {
      console.error('Save price data error:', error);
      return null;
    }
  });

/**
 * Get price comparison for receipt items
 */
export const getPriceComparison = functions
  .region(config.app.region)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    
    const { receiptId, items } = data;
    
    if (!receiptId && (!items || !Array.isArray(items))) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Receipt ID or items array required'
      );
    }
    
    try {
      const userId = context.auth.uid;
      let receiptItems: ReceiptItem[];
      let currentStoreName: string;
      
      if (receiptId) {
        // Load receipt from Firestore
        const receiptDoc = await db
          .collection(collections.receipts(userId))
          .doc(receiptId)
          .get();
        
        if (!receiptDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Receipt not found');
        }
        
        const receipt = receiptDoc.data()!;
        receiptItems = receipt.items;
        currentStoreName = receipt.storeNameNormalized;
      } else {
        receiptItems = items;
        currentStoreName = data.storeName || '';
      }
      
      const comparisons: PriceComparison[] = [];
      
      // Get comparisons for each item
      for (const item of receiptItems) {
        const normalizedName = item.nameNormalized || normalizeProductName(item.name);
        
        // Query price history for this product
        const priceQuery = await db
          .collection(collections.prices)
          .where('productNameNormalized', '==', normalizedName)
          .orderBy('recordedAt', 'desc')
          .limit(50)
          .get();
        
        if (priceQuery.empty) {
          // No comparison data available
          comparisons.push({
            productName: item.name,
            currentPrice: item.unitPrice,
            currentStore: currentStoreName,
            bestPrice: item.unitPrice,
            bestStore: currentStoreName,
            averagePrice: item.unitPrice,
            potentialSavings: 0,
            savingsPercentage: 0,
            priceCount: 1,
          });
          continue;
        }
        
        const prices = priceQuery.docs.map(doc => doc.data() as PricePoint);
        
        // Calculate statistics
        const priceValues = prices.map(p => p.price);
        const minPrice = Math.min(...priceValues);
        const avgPrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;
        
        // Find best price and store
        const bestPriceRecord = prices.find(p => p.price === minPrice)!;
        
        // Calculate savings
        const potentialSavings = Math.max(0, item.unitPrice - minPrice) * item.quantity;
        const savingsPercentage = item.unitPrice > 0 
          ? ((item.unitPrice - minPrice) / item.unitPrice) * 100 
          : 0;
        
        comparisons.push({
          productName: item.name,
          currentPrice: item.unitPrice,
          currentStore: currentStoreName,
          bestPrice: minPrice,
          bestStore: bestPriceRecord.storeName,
          averagePrice: Math.round(avgPrice * 100) / 100,
          potentialSavings: Math.round(potentialSavings * 100) / 100,
          savingsPercentage: Math.round(savingsPercentage * 10) / 10,
          priceCount: prices.length,
        });
      }
      
      // Calculate total potential savings
      const totalSavings = comparisons.reduce((sum, c) => sum + c.potentialSavings, 0);
      
      return {
        success: true,
        comparisons,
        totalPotentialSavings: Math.round(totalSavings * 100) / 100,
        itemsCompared: comparisons.length,
      };
      
    } catch (error) {
      console.error('Get price comparison error:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError('internal', 'Failed to get price comparison');
    }
  });

/**
 * Get price history for a specific product
 */
export const getPriceHistory = functions
  .region(config.app.region)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    
    const { productName, days = 30 } = data;
    
    if (!productName) {
      throw new functions.https.HttpsError('invalid-argument', 'Product name required');
    }
    
    try {
      const normalizedName = normalizeProductName(productName);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const priceQuery = await db
        .collection(collections.prices)
        .where('productNameNormalized', '==', normalizedName)
        .where('recordedAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .orderBy('recordedAt', 'desc')
        .limit(100)
        .get();
      
      const priceHistory = priceQuery.docs.map(doc => {
        const data = doc.data();
        return {
          price: data.price,
          store: data.storeName,
          date: data.recordedAt?.toDate?.() || new Date(),
          currency: data.currency,
        };
      });
      
      // Group by store
      const byStore: Record<string, { prices: number[]; latest: number }> = {};
      
      for (const record of priceHistory) {
        if (!byStore[record.store]) {
          byStore[record.store] = { prices: [], latest: record.price };
        }
        byStore[record.store].prices.push(record.price);
      }
      
      // Calculate store averages
      const storeAverages = Object.entries(byStore).map(([store, data]) => ({
        store,
        averagePrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
        latestPrice: data.latest,
        priceCount: data.prices.length,
      }));
      
      return {
        success: true,
        productName,
        history: priceHistory,
        byStore: storeAverages,
        totalRecords: priceHistory.length,
      };
      
    } catch (error) {
      console.error('Get price history error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get price history');
    }
  });
