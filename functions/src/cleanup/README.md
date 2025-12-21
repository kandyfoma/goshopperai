# Data Retention and Cleanup

## Overview

GoShopper implements a **3-month data retention policy** for user receipts, items, and statistics. This ensures optimal database performance and compliance with data minimization principles.

## Automatic Cleanup

### Schedule
- **Frequency**: Monthly
- **Day**: 1st of every month
- **Time**: 2:00 AM UTC
- **Cron Expression**: `0 2 1 * *`

### What Gets Deleted
All data older than 3 months for each user:
- ✅ Receipts (from `users/{userId}/receipts`)
- ✅ Aggregated items with prices from deleted receipts (from `users/{userId}/items`)
- ✅ Shop statistics updated to reflect deleted receipts
- ❌ **Community price data is preserved** (anonymized, no user ID)

### Process Flow
1. **Identify Old Data**: Query receipts with `date < (today - 3 months)`
2. **Delete Receipts**: Remove receipt documents in batches
3. **Update Aggregated Items**:
   - Remove prices from deleted receipts
   - Recalculate min/max/avg prices
   - Delete items with no remaining prices
4. **Update Shop Stats**: Decrement receipt counts and total spent
5. **Log Results**: Summary of deletions and updates

## Manual Deletion

When a user manually deletes a receipt:

### Client-Side (App)
```typescript
// src/shared/services/firebase/receiptStorage.ts
await receiptStorageService.deleteReceipt(userId, receiptId);
```

### Backend Processing
1. **Receipt Deletion**: Document removed from Firestore
2. **Item Cleanup**: Cloud Function `cleanupDeletedReceiptItems` triggered
   - Removes prices from aggregated items
   - Recalculates statistics
   - Deletes items with no prices left
3. **Shop Update**: Receipt count and total spent decremented
4. **Community Data**: Remains intact (already anonymized)

## Manual Testing

You can manually trigger cleanup for your account:

```typescript
// Call from authenticated app
const cleanupUserData = functions.httpsCallable('manualCleanupUserData');
const result = await cleanupUserData({ monthsAgo: 3 });

console.log(result.data);
// {
//   success: true,
//   receiptsDeleted: 45,
//   itemsUpdated: 120,
//   cutoffDate: "2024-09-21T00:00:00.000Z"
// }
```

## Database Structure

### Affected Collections
```
artifacts/{APP_ID}/users/{userId}/
  ├── receipts/           # Deleted after 3 months
  ├── items/              # Updated (prices removed)
  ├── shops/              # Stats updated
  └── profile/            # Not affected

artifacts/{APP_ID}/public/
  └── prices/data/        # NOT AFFECTED (community data)
```

## Privacy Considerations

### What's Preserved
- **Community Price Data**: Anonymized prices remain in public database
- **User Profile**: Account information retained
- **Current Data**: Only data older than 3 months is deleted

### Why 3 Months?
- **Performance**: Keeps database lean and queries fast
- **Privacy**: Users don't accumulate unnecessary historical data
- **Utility**: 3 months provides sufficient data for trends and comparisons
- **Storage Costs**: Reduces Firebase storage and bandwidth costs

## Monitoring

### Cloud Function Logs
Check Firebase Console → Functions → Logs:
```
🧹 Starting monthly cleanup...
📅 Cutoff date: 2024-09-21T00:00:00.000Z
👥 Processing 1,245 users...
✅ User abc123: 12 receipts deleted, 35 items updated
🎉 Monthly cleanup completed!
📊 Summary:
  - Users processed: 1,245
  - Receipts deleted: 15,340
  - Items updated: 42,890
```

### Alerts
Set up Cloud Monitoring alerts for:
- Function execution failures
- Unusually high deletion counts
- Long execution times (> 10 minutes)

## Cost Optimization

### Batch Operations
- Uses Firestore batches (500 operations max)
- Minimizes read/write costs

### Query Optimization
- Indexed queries on `date` field
- Processes users sequentially to avoid memory issues

## Future Improvements

- [ ] Configurable retention period per user
- [ ] Option to export data before deletion
- [ ] Soft deletes with archive period
- [ ] Audit trail of deletions
- [ ] User notification before cleanup

## Related Functions

- `aggregateItemsOnReceipt` - Updates items when receipt created/updated
- `cleanupDeletedReceiptItems` - Cleans items when receipt deleted manually
- `cleanupOldUserData` - Scheduled monthly cleanup
- `manualCleanupUserData` - Manual cleanup for testing
