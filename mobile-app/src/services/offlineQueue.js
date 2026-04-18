// offlineQueue.js
// Simple offline action queue — stored in AsyncStorage
// Syncs when network is restored

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

const QUEUE_KEY = 'offline_action_queue';

/**
 * Add action to queue when offline
 */
export const enqueue = async (action) => {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = raw ? JSON.parse(raw) : [];
  queue.push({
    ...action,
    id: Date.now().toString(),
    queuedAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  console.log('[OfflineQueue] Enqueued:', action.type);
};

/**
 * Flush queue — called on app resume or network restore
 */
export const flushQueue = async () => {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return { synced: 0, failed: 0 };

  const queue = JSON.parse(raw);
  if (!queue.length) return { synced: 0, failed: 0 };

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining = [];

  for (const action of queue) {
    try {
      await api.request({
        method: action.method,
        url: action.url,
        data: action.data,
        params: action.params,
      });
      synced++;
      console.log('[OfflineQueue] Synced:', action.type);
    } catch (err) {
      failed++;
      // Keep actions that failed due to server error for retry
      if (err.response?.status >= 500 || !err.response) {
        remaining.push(action);
      }
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { synced, failed };
};

/**
 * Get queue length for UI indicator
 */
export const getQueueLength = async () => {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw).length : 0;
};

/**
 * Clear all queued actions
 */
export const clearQueue = async () => {
  await AsyncStorage.removeItem(QUEUE_KEY);
};
