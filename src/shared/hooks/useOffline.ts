/**
 * useOffline Hook
 * 
 * React hook for accessing offline status and sync information.
 */

import {useEffect, useState, useCallback} from 'react';
import {offlineService, SyncStatus, OfflineAction} from '../services/offlineService';

interface UseOfflineResult {
  // Status
  isOnline: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  pendingActions: number;
  lastSyncTime: Date | null;
  
  // Actions
  queueAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => Promise<string>;
  syncNow: () => Promise<void>;
  clearQueue: () => Promise<void>;
}

export function useOffline(): UseOfflineResult {
  const [status, setStatus] = useState<SyncStatus>(offlineService.getSyncStatus());

  useEffect(() => {
    const unsubscribe = offlineService.addListener(setStatus);
    return unsubscribe;
  }, []);

  const queueAction = useCallback(
    (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
      return offlineService.queueAction(action);
    },
    []
  );

  const syncNow = useCallback(async () => {
    await offlineService.processPendingQueue();
  }, []);

  const clearQueue = useCallback(async () => {
    await offlineService.clearPendingQueue();
  }, []);

  return {
    isOnline: status.isOnline,
    isOffline: !status.isOnline,
    isSyncing: status.isSyncing,
    pendingActions: status.pendingActions,
    lastSyncTime: status.lastSyncTime,
    queueAction,
    syncNow,
    clearQueue,
  };
}

/**
 * Simple hook that just returns online/offline status
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(offlineService.getIsOnline());

  useEffect(() => {
    const unsubscribe = offlineService.addListener((status) => {
      setIsOnline(status.isOnline);
    });
    return unsubscribe;
  }, []);

  return isOnline;
}
