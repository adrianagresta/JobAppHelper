import { SyncQueueStore } from './api';

/**
 * Add an operation to the sync queue.
 * op should be { operationType, entityType, entityId, timestamp, lastAttempt }
 */
export async function enqueue(op) {
  const item = Object.assign({ timestamp: Date.now(), lastAttempt: null }, op);
  return SyncQueueStore.enqueue(item);
}

export async function dequeueAll() {
  return SyncQueueStore.getAll();
}

export async function removeFromQueue(id) {
  return SyncQueueStore.delete(id);
}
