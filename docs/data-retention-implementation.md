# Data Retention Implementation Summary

## Changes Made

### 1. Receipt Deletion Enhancement
**File**: `functions/src/items/itemAggregation.ts`

Added `cleanupDeletedReceiptItems()` function that:
- Removes prices from aggregated items when a receipt is deleted
- Recalculates min/max/avg prices and statistics
- Deletes items that have no remaining prices
- Maintains data integrity for user's personal item history

**Trigger**: Automatic when `aggregateItemsOnReceipt` detects receipt deletion

### 2. Monthly Data Cleanup
**File**: `functions/src/cleanup/dataRetention.ts`

Created scheduled Cloud Function that runs monthly:
- **Schedule**: 1st of every month at 2:00 AM UTC
- **Retention Period**: 3 months
- **Function**: `cleanupOldUserData`

**Process**:
1. Find receipts older than 3 months for all users
2. Delete old receipts in batches (500 per batch)
3. Update aggregated items (remove prices from deleted receipts)
4. Update shop statistics
5. Log comprehensive summary

### 3. Manual Cleanup Function
**File**: `functions/src/cleanup/dataRetention.ts`

Created callable function for testing:
- **Function**: `manualCleanupUserData`
- **Auth**: User can only clean their own data
- **Parameters**: `{ monthsAgo: 3 }` (configurable)

### 4. Function Exports
**File**: `functions/src/index.ts`

Added exports:
```typescript
export {
  cleanupDeletedReceiptItems,
} from './items/itemAggregation';

export {
  cleanupOldUserData,
  manualCleanupUserData,
} from './cleanup/dataRetention';
```

## Data Flow

### Manual Receipt Deletion
```
User deletes receipt
    ↓
receiptStorage.deleteReceipt()
    ↓
Firestore triggers aggregateItemsOnReceipt (onWrite)
    ↓
Detects deletion (change.after.exists = false)
    ↓
Calls cleanupDeletedReceiptItems()
    ↓
- Removes prices from aggregated items
- Recalculates statistics
- Updates shop stats
    ↓
✅ User's items updated, community data preserved
```

### Monthly Automatic Cleanup
```
1st of month, 2 AM UTC
    ↓
cleanupOldUserData() triggered
    ↓
For each user:
  - Find receipts older than 3 months
  - Delete receipts in batches
  - Update aggregated items
  - Update shop statistics
    ↓
Log summary: receipts deleted, items updated
    ↓
✅ Database cleaned, optimized
```

## What Gets Deleted vs Preserved

### Deleted (After 3 Months)
- ✅ Receipt documents
- ✅ Prices from aggregated items (recalculated without old receipts)
- ✅ Shop stats updated to reflect deletion

### Preserved Forever
- ✅ **Community price data** (anonymized, no user ID)
- ✅ User profile and preferences
- ✅ Current receipts (< 3 months old)
- ✅ Aggregated items (updated stats)

## Testing

### Test Manual Cleanup
```typescript
// From authenticated app client
import functions from '@react-native-firebase/functions';

const manualCleanup = functions().httpsCallable('manualCleanupUserData');

try {
  const result = await manualCleanup({ monthsAgo: 3 });
  console.log('Cleanup result:', result.data);
  // {
  //   success: true,
  //   receiptsDeleted: 12,
  //   itemsUpdated: 35,
  //   cutoffDate: "2024-09-21T..."
  // }
} catch (error) {
  console.error('Cleanup failed:', error);
}
```

### Monitor Scheduled Cleanup
1. Go to Firebase Console
2. Navigate to Functions → Logs
3. Filter by function: `cleanupOldUserData`
4. Check logs on the 1st of each month after 2 AM UTC

### Verify Data Deletion
```typescript
// Check receipts count before/after
const receiptsRef = firestore()
  .collection('artifacts/goshopper/users/{userId}/receipts');

const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

const oldReceipts = await receiptsRef
  .where('date', '<', threeMonthsAgo)
  .get();

console.log('Old receipts found:', oldReceipts.size);
// Should be 0 after cleanup runs
```

## Deployment

### Deploy Functions
```bash
cd functions
npm run build
firebase deploy --only functions:cleanupOldUserData,functions:manualCleanupUserData
```

### Deploy with All Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

## Monitoring & Alerts

### Set Up Monitoring
1. Firebase Console → Functions → `cleanupOldUserData`
2. Click "Logs" tab
3. Set up alerting:
   - Execution failures
   - Long execution times (> 10 min)
   - High deletion counts

### Expected Performance
- **Users processed**: ~1,000-5,000 per run
- **Execution time**: 2-5 minutes
- **Cost**: ~$0.01-0.05 per run (depending on data volume)

## Cost Impact

### Storage Savings
- Reduces Firestore storage costs
- Fewer documents = lower read/write costs
- Optimized queries = faster app performance

### Function Costs
- **Scheduled cleanup**: Runs once per month
- **Manual deletions**: Triggered by user actions (low frequency)
- **Estimated monthly cost**: < $1

## Privacy & Compliance

### Data Minimization
- Complies with GDPR principle of data minimization
- Users don't accumulate unnecessary historical data
- Reduces risk of data breach exposure

### User Rights
- Users can manually delete receipts anytime
- Automatic cleanup ensures old data doesn't persist
- Community data remains anonymous

## Future Enhancements

1. **User Configuration**: Allow users to set custom retention period
2. **Export Before Delete**: Option to download data before cleanup
3. **Soft Deletes**: Archive data before permanent deletion
4. **User Notifications**: Email users before monthly cleanup
5. **Admin Dashboard**: View cleanup statistics and trends

## Troubleshooting

### Function Not Triggering
1. Check Cloud Scheduler is enabled in Firebase
2. Verify function is deployed: `firebase functions:list`
3. Check function logs for errors

### Incomplete Cleanup
1. Check batch size (500 operations max)
2. Verify user has old receipts: query `date < cutoffDate`
3. Check for Firestore permission errors

### Performance Issues
1. Add indexes on `date` field if needed
2. Reduce batch size if hitting timeouts
3. Process users in smaller batches

## Contact & Support

For questions or issues:
- Check function logs: Firebase Console → Functions → Logs
- Review error messages in Cloud Functions
- Test with `manualCleanupUserData` first
