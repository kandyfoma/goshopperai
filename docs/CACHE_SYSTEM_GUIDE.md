# Cache System - Usage Guide

## Overview

The improved caching system provides a two-tier architecture with memory and persistent storage, automatic TTL management, LRU eviction, and performance monitoring.

## Key Features

- **Two-Tier Caching**: Memory cache (fast) + AsyncStorage (persistent)
- **TTL Support**: Automatic expiration of cached data
- **LRU Eviction**: Intelligent memory management
- **Priority Levels**: Control which data gets evicted first
- **Analytics**: Monitor cache performance and hit rates
- **Namespaces**: Organize cache by data type
- **Automatic Cleanup**: Periodic removal of expired entries

## Quick Start

### Basic Usage

```typescript
import {cacheManager, CacheTTL, CachePriority} from '@/shared/services';

// Set data in cache
await cacheManager.set('user-profile', userData, {
  namespace: 'user-prefs',
  ttl: CacheTTL.DAY,
  priority: CachePriority.HIGH,
});

// Get data from cache
const userData = await cacheManager.get('user-profile', 'user-prefs');

// Remove from cache
await cacheManager.remove('user-profile', 'user-prefs');

// Check if exists
const hasData = await cacheManager.has('user-profile', 'user-prefs');
```

### Cache Namespaces

Organize your cache by data type:

- `user-prefs` - User preferences and settings
- `receipts` - Receipt data
- `shopping-list` - Shopping list items
- `settings` - App settings
- `security` - Security-related data
- `widgets` - Widget data
- `offline-queue` - Offline operations
- `temp` - Temporary data (default)

### TTL Presets

```typescript
CacheTTL.MINUTE  // 1 minute
CacheTTL.HOUR    // 1 hour
CacheTTL.DAY     // 24 hours
CacheTTL.WEEK    // 7 days
CacheTTL.MONTH   // 30 days
CacheTTL.INFINITE // Never expires
```

### Priority Levels

```typescript
CachePriority.CRITICAL // Never auto-evict
CachePriority.HIGH     // Evict last
CachePriority.NORMAL   // Default
CachePriority.LOW      // Evict first
```

## Advanced Usage

### Memory-Only Cache

For sensitive data that shouldn't be persisted:

```typescript
await cacheManager.set('session-token', token, {
  namespace: 'security',
  ttl: CacheTTL.HOUR,
  memoryOnly: true, // Don't save to disk
});
```

### Clear Namespace

Remove all cache in a specific namespace:

```typescript
// Clear all receipts
await cacheManager.clearNamespace('receipts');

// Clear all cache
await cacheManager.clearAll();
```

### Preload Critical Data

Preload data into memory on app start:

```typescript
await cacheManager.preload([
  { key: 'user-profile', namespace: 'user-prefs' },
  { key: 'recent-receipts', namespace: 'receipts' },
  { key: 'settings', namespace: 'settings' },
]);
```

## Monitoring & Analytics

### Get Cache Statistics

```typescript
import {cacheManager, cacheAnalytics} from '@/shared/services';

// Get raw stats
const stats = cacheManager.getStats();
console.log('Memory hits:', stats.memoryHits);
console.log('Disk hits:', stats.diskHits);
console.log('Memory size:', stats.memorySize);

// Get hit rates
const hitRate = cacheManager.getHitRate();
console.log('Overall hit rate:', hitRate.overall + '%');
console.log('Memory hit rate:', hitRate.memory + '%');

// Get health report
const report = cacheAnalytics.checkHealth();
console.log('Performance:', report.performance);
console.log('Recommendations:', report.recommendations);

// Log performance to console
cacheAnalytics.logPerformance();

// Get summary string
const summary = cacheAnalytics.getSummary();
console.log(summary); // "Cache: 85% hit rate • 42 entries • 2.3MB"
```

### Monitor Cache Health

```typescript
// Start monitoring (runs every 30 minutes)
cacheAnalytics.startMonitoring(30);

// Listen for health updates
const unsubscribe = cacheAnalytics.addListener((report) => {
  if (report.performance === 'poor') {
    console.warn('Cache performance is poor!', report.recommendations);
  }
});

// Stop monitoring
cacheAnalytics.stopMonitoring();
unsubscribe();
```

## Migration from Old Services

### Before (offlineService.ts)

```typescript
// Old way
await AsyncStorage.setItem(STORAGE_KEYS.CACHED_RECEIPTS, JSON.stringify(data));
const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_RECEIPTS);
```

### After (with CacheManager)

```typescript
// New way
await cacheManager.set('receipts', receipts, {
  namespace: 'receipts',
  ttl: CacheTTL.MONTH,
  priority: CachePriority.HIGH,
});
const receipts = await cacheManager.get('receipts', 'receipts');
```

## Benefits

### Performance Improvements

- **Memory Cache**: ~100x faster than AsyncStorage for frequently accessed data
- **Smart Preloading**: Critical data loaded into memory on app start
- **LRU Eviction**: Keeps hot data in memory, cold data on disk

### Storage Optimization

- **Automatic Cleanup**: Expired entries removed periodically
- **TTL Management**: Data expires automatically, no manual cleanup needed
- **Priority-Based Eviction**: Critical data protected from eviction

### Developer Experience

- **Type Safety**: Full TypeScript support
- **Better Errors**: Comprehensive error handling
- **Analytics**: Visibility into cache performance
- **Debugging**: Easy to monitor and troubleshoot

## Configuration

Customize cache behavior:

```typescript
import {cacheManager} from '@/shared/services/caching';

// Configure cache (in CacheManager.ts)
const config = {
  maxMemoryCacheSize: 100,           // Max 100 items in memory
  maxMemoryCacheBytes: 10 * 1024 * 1024, // Max 10MB in memory
  defaultTTL: 60 * 60 * 1000,        // 1 hour default TTL
  enableCompression: false,          // Future: compress large objects
  enableAnalytics: true,             // Track performance
};
```

## Best Practices

1. **Use appropriate TTLs**: Don't cache forever unless necessary
2. **Set priorities**: Protect critical data with HIGH or CRITICAL priority
3. **Use namespaces**: Organize cache logically
4. **Monitor performance**: Check analytics in development
5. **Memory-only for sensitive data**: Don't persist tokens/passwords
6. **Preload critical data**: Improve perceived performance
7. **Clear on logout**: Remove user-specific data

## Example: Receipt Caching

```typescript
import {cacheManager, CacheTTL, CachePriority} from '@/shared/services';

class ReceiptService {
  // Cache a receipt
  async cacheReceipt(receiptId: string, receipt: Receipt): Promise<void> {
    await cacheManager.set(receiptId, receipt, {
      namespace: 'receipts',
      ttl: CacheTTL.MONTH,
      priority: CachePriority.NORMAL,
    });
  }

  // Get cached receipt (with fallback to Firestore)
  async getReceipt(receiptId: string): Promise<Receipt | null> {
    // Try cache first
    let receipt = await cacheManager.get<Receipt>(receiptId, 'receipts');
    
    if (!receipt) {
      // Cache miss - fetch from Firestore
      receipt = await this.fetchFromFirestore(receiptId);
      
      if (receipt) {
        // Cache for next time
        await this.cacheReceipt(receiptId, receipt);
      }
    }
    
    return receipt;
  }

  // Clear all receipt cache
  async clearAllReceipts(): Promise<void> {
    await cacheManager.clearNamespace('receipts');
  }
}
```

## Troubleshooting

### Low Hit Rate

```typescript
// Check hit rate
const hitRate = cacheManager.getHitRate();
if (hitRate.overall < 50) {
  // Increase TTL or preload more data
  console.log('Consider increasing cache TTL or preloading critical data');
}
```

### High Memory Usage

```typescript
// Check memory size
const stats = cacheManager.getStats();
const memoryMB = stats.memorySize / (1024 * 1024);
if (memoryMB > 8) {
  // Reduce TTL or lower priority of large objects
  console.log('Memory cache is large, consider reducing TTL');
}
```

### Frequent Evictions

```typescript
// Check eviction rate
const stats = cacheManager.getStats();
const totalRequests = stats.memoryHits + stats.memoryMisses;
const evictionRate = (stats.evictions / totalRequests) * 100;
if (evictionRate > 10) {
  // Increase maxMemoryCacheSize
  console.log('High eviction rate, consider increasing memory cache size');
}
```

## Summary

The new cache system provides:
- ✅ 100x faster memory cache
- ✅ Automatic TTL management
- ✅ Smart LRU eviction
- ✅ Priority-based protection
- ✅ Performance monitoring
- ✅ Better developer experience
- ✅ Type safety
- ✅ Easy migration
