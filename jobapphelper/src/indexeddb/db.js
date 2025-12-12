import { DB_NAME, DB_VERSION, STORES } from './stores';

/**
 * Open the IndexedDB database, creating object stores on upgrade.
 * Returns a Promise that resolves with the IDBDatabase.
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (evt) => {
      const db = evt.target.result;
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.STATUS)) {
        const s = db.createObjectStore(STORES.STATUS, { keyPath: 'id' });
        // singleton: use fixed id
      }
      if (!db.objectStoreNames.contains(STORES.STATUS_CODES)) {
        const sc = db.createObjectStore(STORES.STATUS_CODES, { keyPath: 'code' });
        sc.createIndex('isActive', 'isActive', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.APPLICATIONS)) {
        const apps = db.createObjectStore(STORES.APPLICATIONS, { keyPath: 'id' });
        apps.createIndex('applicationDate', 'applicationDate', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.INTERVIEWS)) {
        const iv = db.createObjectStore(STORES.INTERVIEWS, { keyPath: 'id' });
        iv.createIndex('applicationId', 'applicationId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const q = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        q.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    req.onsuccess = (evt) => resolve(evt.target.result);
    req.onerror = (evt) => reject(evt.target.error || new Error('IndexedDB open error'));
  });
}

/**
 * Utility to run a transaction and return a Promise.
 * @param {IDBDatabase} db
 * @param {string[]} storeNames
 * @param {'readonly'|'readwrite'} mode
 * @param {(tx: IDBTransaction) => void} work
 * @returns {Promise<any>}
 */
export function withTransaction(db, storeNames, mode, work) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeNames, mode);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Transaction error'));
      work(tx);
    } catch (err) {
      reject(err);
    }
  });
}
