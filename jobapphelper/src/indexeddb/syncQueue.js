import { SyncQueueStore } from './api';

/**
 * Add an operation to the sync queue.
 * op should be { operationType, entityType, entityId, timestamp, lastAttempt }
 */
export async function enqueue(op) {
    const item = Object.assign({ timestamp: Date.now(), lastAttempt: null }, op);

    /*
    TODO: Provisional ID handling and validation
    - update operations
        - Convert these to insert operations and then apply insert operation rules
    - insert operations
        - if an insert already exists, ignore the new insert
        - if a delete already exists, remove the delete and add the insert
    - delete operations
        - remove any existing operation for the provisional id and add the delete
        - If there is no existing insert operation for the provisional id, ignore the delete operation and log an error to console.

    TODO: non-provisional ID handling and validation
    - insert operations
        - ignore this and log an error to console
    - update operations
        - remove any existing operation for the id and add the update
    - delete operations
        - remove any existing operation for the id and add the delete
    */
    
  return SyncQueueStore.enqueue(item);
}

export async function dequeueAll() {
  return SyncQueueStore.getAll();
}

export async function removeFromQueue(id) {
  return SyncQueueStore.delete(id);
}
