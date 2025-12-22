// Duplicate Detection Service
// Pre-processes receipt images to detect potential duplicates before full AI processing

import functions from '@react-native-firebase/functions';
import firestore from '@react-native-firebase/firestore';
import {Receipt} from '@/shared/types';
import {APP_ID} from '@/shared/services/firebase/config';

interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: number; // 0-1, higher means more likely duplicate
  existingReceiptId?: string;
  reason?: string;
  extractedData?: {
    storeName?: string;
    date?: string;
    total?: number;
    currency?: string;
  };
}

interface QuickExtractResponse {
  success: boolean;
  data?: {
    storeName?: string;
    date?: string;
    total?: number;
    currency?: string;
    confidence: number;
  };
  error?: string;
}

class DuplicateDetectionService {
  /**
   * Quick extraction of basic receipt info for duplicate checking
   * Uses lightweight OCR/AI to extract key fields without full parsing
   */
  private async quickExtractReceiptData(
    imageBase64: string,
  ): Promise<QuickExtractResponse> {
    try {
      const quickExtractFunction = functions().httpsCallable(
        'quickExtractReceipt',
      );

      const result = await quickExtractFunction({
        imageBase64,
        extractFields: ['storeName', 'date', 'total', 'currency'],
      });

      return result.data as QuickExtractResponse;
    } catch (error: any) {
      // Quick extract failures are expected when Vision API is not configured
      // Just return gracefully without logging as error
      console.log(
        'Quick extract skipped:',
        error.message || 'Service unavailable',
      );
      return {
        success: false,
        error: error.message || 'Failed to extract receipt data',
      };
    }
  }

  /**
   * Calculate similarity score between two receipts
   * Returns a score only if ALL key fields match closely
   */
  private calculateSimilarity(
    extracted: QuickExtractResponse['data'],
    existing: Receipt,
  ): number {
    if (!extracted) {
      return 0;
    }

    // All three fields must be present for a meaningful comparison
    const hasStore = extracted.storeName && existing.storeName;
    const hasDate = extracted.date && existing.date;
    const hasTotal = extracted.total !== undefined && existing.total !== undefined;

    // If any key field is missing, similarity is low
    if (!hasStore || !hasDate || !hasTotal) {
      return 0;
    }

    // Store name similarity - must be very close
    const storeSimilarity = this.stringSimilarity(
      extracted.storeName!.toLowerCase(),
      existing.storeName!.toLowerCase(),
    );
    
    // If store doesn't match well, not a duplicate
    if (storeSimilarity < 0.6) {
      return 0;
    }

    // Date similarity - must be same day for a duplicate
    const extractedDate = new Date(extracted.date!);
    const existingDate = new Date(existing.date!);

    if (isNaN(extractedDate.getTime()) || isNaN(existingDate.getTime())) {
      return 0;
    }

    // Check if same day
    const sameDay = 
      extractedDate.getFullYear() === existingDate.getFullYear() &&
      extractedDate.getMonth() === existingDate.getMonth() &&
      extractedDate.getDate() === existingDate.getDate();
    
    // If not same day, definitely not a duplicate
    if (!sameDay) {
      return 0;
    }

    // Total amount similarity - must be within 5% or $1
    const amountDiff = Math.abs(extracted.total! - existing.total!);
    const percentDiff = amountDiff / Math.max(extracted.total!, existing.total!, 1);
    
    // If total differs by more than 5% AND more than $1, not a duplicate
    if (amountDiff > 1 && percentDiff > 0.05) {
      return 0;
    }

    // All checks passed - this is likely a duplicate
    // Calculate final score based on how close the matches are
    const totalSimilarity = 1 - Math.min(percentDiff, 1);
    
    // Weighted score: store (40%) + date (35%) + total (25%)
    const finalScore = (storeSimilarity * 0.4) + (1.0 * 0.35) + (totalSimilarity * 0.25);
    
    return finalScore;
  }

  /**
   * Simple string similarity using Levenshtein distance approximation
   */
  private stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) {
      return 1;
    }

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1;
    }

    // Simple containment check
    if (longer.toLowerCase().includes(shorter.toLowerCase())) {
      return 0.8; // High similarity if one contains the other
    }

    // Word-based similarity
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);

    const commonWords = words1.filter(word => words2.includes(word)).length;
    const totalWords = Math.max(words1.length, words2.length);

    return totalWords > 0 ? commonWords / totalWords : 0;
  }

  /**
   * Check if a receipt image is likely a duplicate
   * Using strict matching: same store + same day + similar total
   */
  async checkForDuplicate(
    imageBase64: string,
    userId: string,
    similarityThreshold: number = 0.85, // Increased from 0.7 to reduce false positives
  ): Promise<DuplicateCheckResult> {
    try {
      // Step 1: Quick extract basic info from the image
      const extractResult = await this.quickExtractReceiptData(imageBase64);

      if (!extractResult.success || !extractResult.data) {
        return {
          isDuplicate: false,
          confidence: 0,
          reason: 'Could not extract receipt data for comparison',
        };
      }

      // Step 2: Get user's recent receipts (last 30 days to limit scope)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const receiptsSnapshot = await firestore()
        .collection(`artifacts/${APP_ID}/users/${userId}/receipts`)
        .where('date', '>=', thirtyDaysAgo)
        .orderBy('date', 'desc')
        .limit(50) // Check last 50 receipts
        .get();

      if (receiptsSnapshot.empty) {
        return {
          isDuplicate: false,
          confidence: 0,
          extractedData: extractResult.data,
        };
      }

      // Step 3: Compare with existing receipts
      let highestSimilarity = 0;
      let mostSimilarReceipt: Receipt | null = null;

      receiptsSnapshot.docs.forEach(doc => {
        const receipt: Receipt = {id: doc.id, ...doc.data()} as Receipt;
        const similarity = this.calculateSimilarity(
          extractResult.data!,
          receipt,
        );

        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          mostSimilarReceipt = receipt;
        }
      });

      // Step 4: Determine if it's a duplicate
      const isDuplicate =
        highestSimilarity >= similarityThreshold && mostSimilarReceipt !== null;

      let existingReceiptId: string | undefined;
      if (isDuplicate) {
        existingReceiptId = mostSimilarReceipt!.id;
      }

      return {
        isDuplicate,
        confidence: highestSimilarity,
        existingReceiptId,
        reason: isDuplicate
          ? `Similar receipt found (${Math.round(
              highestSimilarity * 100,
            )}% match)`
          : `No similar receipts found (${Math.round(
              highestSimilarity * 100,
            )}% max similarity)`,
        extractedData: extractResult.data,
      } as DuplicateCheckResult;
    } catch (error: any) {
      console.error('Duplicate check error:', error);
      return {
        isDuplicate: false,
        confidence: 0,
        reason: `Error during duplicate check: ${error.message}`,
      };
    }
  }

  /**
   * Get duplicate detection statistics for analytics
   */
  async getDuplicateStats(userId: string): Promise<{
    totalReceipts: number;
    potentialDuplicates: number;
    duplicateRate: number;
  }> {
    try {
      const receiptsSnapshot = await firestore()
        .collection(`artifacts/${APP_ID}/users/${userId}/receipts`)
        .get();

      const totalReceipts = receiptsSnapshot.size;

      // This is a simplified version - in a real implementation,
      // you'd want to run duplicate detection on all receipts
      // and cache the results
      const potentialDuplicates = Math.floor(totalReceipts * 0.05); // Estimate 5% duplicates

      return {
        totalReceipts,
        potentialDuplicates,
        duplicateRate:
          totalReceipts > 0 ? potentialDuplicates / totalReceipts : 0,
      };
    } catch (error) {
      console.error('Error getting duplicate stats:', error);
      return {
        totalReceipts: 0,
        potentialDuplicates: 0,
        duplicateRate: 0,
      };
    }
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();
