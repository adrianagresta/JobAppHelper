import { openDB, withTransaction } from './db';
import { STORES } from './stores';

/**
 * Get a single record by key from a store.
 */
export async function get(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readonly');
    const os = tx.objectStore(storeName);
    const req = os.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get records from a store by index value.
 * @param {string} storeName - name of the object store
 * @param {string} indexName - name of the index on the store
 * @param {any} value - value to match
 * @returns {Promise<any[]>} array of matching records
 */
export async function getByIndex(storeName, indexName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readonly');
    const os = tx.objectStore(storeName);
    const idx = os.index(indexName);
    const results = [];
    const req = idx.openCursor(IDBKeyRange.only(value));
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (!cursor) return resolve(results);
      results.push(cursor.value);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Put a record into a store.
 */
export async function put(storeName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readwrite');
    const os = tx.objectStore(storeName);
    const req = os.put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a record by key.
 */
export async function del(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readwrite');
    const os = tx.objectStore(storeName);
    const req = os.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all records from a store.
 */
export async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readonly');
    const os = tx.objectStore(storeName);
    const req = os.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Simple iterator over a store with a callback for each record.
 */
export async function iterate(storeName, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readonly');
    const os = tx.objectStore(storeName);
    const req = os.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (!cursor) return resolve();
      callback(cursor.value);
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

// Store-specific helpers
export const StatusStore = {
  get: () => get(STORES.STATUS, 'singleton'),
  put: (v) => put(STORES.STATUS, v),
  /**
   * Allocate the next provisional id by atomically decrementing the
   * `nextProvisionalId` field in the singleton status record and returning
   * the new value.
   * @returns {Promise<number>} next provisional negative id
   */
  async allocateNextProvisionalId() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.STATUS], 'readwrite');
      const os = tx.objectStore(STORES.STATUS);
      const req = os.get('singleton');
      req.onsuccess = (e) => {
        const rec = e.target.result || { id: 'singleton', nextProvisionalId: -1 };
        if (typeof rec.nextProvisionalId !== 'number') rec.nextProvisionalId = -1;
        const next = rec.nextProvisionalId;
        rec.nextProvisionalId = next - 1;
        const putReq = os.put(rec);
        putReq.onsuccess = () => resolve(next);
        putReq.onerror = () => reject(putReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  }
};

export const StatusCodesStore = {
  getAll: () => getAll(STORES.STATUS_CODES),
  put: (code) => put(STORES.STATUS_CODES, code),
};

export const ApplicationsStore = {
  get: (id) => get(STORES.APPLICATIONS, id),
  put: (app) => put(STORES.APPLICATIONS, app),
  delete: (id) => del(STORES.APPLICATIONS, id),
  getAll: () => getAll(STORES.APPLICATIONS),
  iterate: (cb) => iterate(STORES.APPLICATIONS, cb),
};

export const InterviewsStore = {
  get: (id) => get(STORES.INTERVIEWS, id),
  put: (it) => put(STORES.INTERVIEWS, it),
  delete: (id) => del(STORES.INTERVIEWS, id),
  getAll: () => getAll(STORES.INTERVIEWS),
  getByApplication: (applicationId) => getByIndex(STORES.INTERVIEWS, 'applicationId', applicationId),
};

export const SyncQueueStore = {
  enqueue: (op) => put(STORES.SYNC_QUEUE, op),
  getAll: () => getAll(STORES.SYNC_QUEUE),
  delete: (id) => del(STORES.SYNC_QUEUE, id),
};
