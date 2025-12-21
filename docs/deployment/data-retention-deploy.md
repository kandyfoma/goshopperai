# Data Retention Deployment Guide

## Quick Deploy

Deploy only the cleanup functions:

```bash
cd functions
npm run build
firebase deploy --only functions:cleanupOldUserData,functions:manualCleanupUserData,functions:cleanupDeletedReceiptItems
```

## Full Deployment

Deploy all functions (includes cleanup):

```bash
cd functions
npm run build
firebase deploy --only functions
```

## Verify Deployment

Check that functions are deployed:

```bash
firebase functions:list | grep -E "(cleanup|cleanupOldUserData|manualCleanup)"
```

Expected output:
```
cleanupOldUserData(europe-west1)
manualCleanupUserData(europe-west1)
```

## Test Scheduled Function

### View Schedule
```bash
firebase functions:config:get
```

### Test Execution Locally (Emulator)
```bash
# Start emulators
firebase emulators:start --only functions,firestore

# In another terminal, trigger the function
curl -X POST http://localhost:5001/{PROJECT_ID}/europe-west1/manualCleanupUserData \
  -H "Content-Type: application/json" \
  -d '{"data": {"monthsAgo": 3}}'
```

## Test Manual Cleanup (Production)

### From React Native App
```typescript
import functions from '@react-native-firebase/functions';

// Test cleanup for current user
const testCleanup = async () => {
  try {
    const manualCleanup = functions().httpsCallable('manualCleanupUserData');
    const result = await manualCleanup({ monthsAgo: 3 });
    
    console.log('✅ Cleanup successful:', result.data);
    Alert.alert('Cleanup Complete', 
      `Deleted ${result.data.receiptsDeleted} receipts\n` +
      `Updated ${result.data.itemsUpdated} items`
    );
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    Alert.alert('Error', error.message);
  }
};
```

## Monitor Scheduled Execution

### Check Logs (Firebase Console)
1. Go to Firebase Console
2. Click "Functions" in left menu
3. Click "Logs" tab
4. Filter by function name: `cleanupOldUserData`
5. Check logs after 2 AM UTC on the 1st of each month

### Check Logs (CLI)
```bash
# Stream logs for cleanup function
firebase functions:log --only cleanupOldUserData --lines 100

# Filter by date
firebase functions:log --only cleanupOldUserData --since 2024-12-01
```

## Verify Scheduled Trigger

### Check Cloud Scheduler (GCP Console)
1. Go to Google Cloud Console
2. Navigate to Cloud Scheduler
3. Look for: `firebase-schedule-cleanupOldUserData-europe-west1`
4. Verify schedule: `0 2 1 * *`
5. Check "Last run" and "Next run" times

### Manual Trigger (Testing)
```bash
# Trigger the scheduled function manually
gcloud scheduler jobs run firebase-schedule-cleanupOldUserData-europe-west1 \
  --project={PROJECT_ID}
```

## Rollback (If Needed)

### Redeploy Previous Version
```bash
# List function versions
firebase functions:list --versions

# Rollback to previous version
firebase functions:rollback cleanupOldUserData --version 12
```

### Disable Scheduled Cleanup
```bash
# Pause the Cloud Scheduler job
gcloud scheduler jobs pause firebase-schedule-cleanupOldUserData-europe-west1 \
  --project={PROJECT_ID}
```

## Cost Monitoring

### Estimate Costs
- **Scheduled execution**: 1 run/month
- **Firestore reads**: ~1,000-10,000 per run (depending on data)
- **Firestore writes**: ~100-1,000 per run
- **Function execution**: 1-5 minutes @ 512MB
- **Estimated cost**: < $0.50/month

### Monitor Actual Costs
1. Firebase Console → Usage and Billing
2. Filter by "Cloud Functions"
3. Check "cleanupOldUserData" metrics

## Troubleshooting

### Function Not Found
```bash
# Verify deployment
firebase functions:list | grep cleanup

# Redeploy
firebase deploy --only functions:cleanupOldUserData
```

### Schedule Not Running
```bash
# Check Cloud Scheduler status
gcloud scheduler jobs describe \
  firebase-schedule-cleanupOldUserData-europe-west1 \
  --project={PROJECT_ID}

# Resume if paused
gcloud scheduler jobs resume \
  firebase-schedule-cleanupOldUserData-europe-west1 \
  --project={PROJECT_ID}
```

### Execution Timeout
If cleanup takes too long:
1. Increase function timeout in `functions/src/cleanup/dataRetention.ts`:
```typescript
export const cleanupOldUserData = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' }) // 9 minutes
  .pubsub.schedule('0 2 1 * *')
  // ...
```

2. Redeploy:
```bash
cd functions && npm run build && firebase deploy --only functions:cleanupOldUserData
```

## Security Checklist

- [x] Function runs with Firebase Admin privileges
- [x] Manual cleanup requires authentication
- [x] Users can only clean their own data
- [x] Community price data preserved
- [x] Batch operations prevent timeout
- [x] Error handling for partial failures

## Next Steps After Deployment

1. **Wait for first run** (1st of next month at 2 AM UTC)
2. **Check logs** for execution results
3. **Verify data deletion** in Firestore console
4. **Monitor costs** in Firebase billing
5. **Set up alerts** for failures

## Additional Resources

- [Firebase Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)
- [Firestore Batch Operations](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)
