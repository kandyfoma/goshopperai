/**
 * Items Aggregation Migration Script
 * Run this once to backfill item aggregation for existing receipts
 * 
 * Usage from app:
 * 1. Import: import { migrateItemsAggregation } from '@/shared/services/firebase/itemsService';
 * 2. Call: await migrateItemsAggregation();
 * 3. This will call the Cloud Function to rebuild aggregation
 */

import {itemsService} from './itemsService';
import {authService} from './auth';

export async function migrateItemsAggregation(): Promise<{
  success: boolean;
  itemsCount: number;
  receiptsProcessed: number;
}> {
  try {
    console.log('🚀 Starting items aggregation migration...');
    
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to migrate items');
    }

    console.log('📊 Rebuilding item aggregation from all receipts...');
    const result = await itemsService.rebuildAggregation(user.uid);

    console.log('✅ Migration complete!');
    console.log(`   - ${result.itemsCount} items aggregated`);
    console.log(`   - ${result.receiptsProcessed} receipts processed`);
    
    return result;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Check if migration is needed
 * Returns true if user has receipts but no aggregated items
 */
export async function needsItemsMigration(): Promise<boolean> {
  try {
    const user = authService.getCurrentUser();
    if (!user) {
      return false;
    }

    // This would need to check if items collection is empty
    // but receipts collection has data
    // For now, return false - admin can trigger manually
    return false;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}
