IndexedDB helpers for JobAppHelper

Files:
- `stores.js` - constants for DB name, version, and store names
- `db.js` - openDB() and transaction helper
- `api.js` - CRUD helpers for stores and store-specific wrappers
- `syncQueue.js` - helpers for enqueuing sync operations

Usage:
import { ApplicationsStore, openDB } from '../indexeddb';
await openDB();
await ApplicationsStore.put({ id: -1, companyName: 'Acme', roleTitle: 'Dev', applicationDate: new Date().toISOString(), status: 'applied' });
