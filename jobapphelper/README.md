# Applicant’s Assistant Functional Design Document

---

## Overview

Applicant’s Assistant is a React web app for tracking job applications and interviews.  
The initial release is single-user with client-side IndexedDB storage.  
The system is **multi-tenant but single-user per tenant**.  
A later release adds background sync to a multi-user backend (C# with Entity Framework, plus an alternative Node.js backend).  
The app displays active applications on the home page and supports details pages, import/export, and sync.

---

## Core scope and principles

- IndexedDB for storage; hard deletes locally; provisional negative IDs.
- Server-assigned long integer IDs, soft deletes on server, auth required.
- Statuses from a code table; extensible for future states.
- All date/time/datetime stored as UTC ISO strings; client converts for display.
- Job ad PDF stored as base64-encoded blob in IndexedDB.
- Credentials optional, plaintext initially, included in export by default.
- Home page shows non-rejected applications, sorted by applicationDate descending.
- Interviews read-only in Application view; edits via Interview details page.

---

## Data model

### Status tables

- **Client Status table**
  - `seqno`, `lastUpdate`, `dirty`, `lastSyncAttempt`, `reason` (last error reason, cleared on success).

- **Server Status table**
  - `seqno`, `lastWrite`.

### Code tables

- **Status code table**
  - `code`, `label`, `isActive`, `order`.

### Application entity

- Required: `id`, `companyName`, `companyUrl`, `careersSiteUrl`, `jobAdPdfBase64`, `roleTitle`, `applicationDate`, `status`.
- Optional: `contactEmail`, `baseCompensation`, `careerSiteUsername`, `careerSitePassword`, `coverLetterText`, `gitRepoUrl`, `rejectionDate`, `reapplyEligibleDate`, `notes`.
- Delete: client hard delete; server soft delete.

### Interview entity

- Fields: `id`, `applicationId`, `meetingUrl`, `meetingAddress`, `interviewerName`, `interviewerPosition`, `interviewDate`, `interviewTime`, `interviewerEmail`, `interviewerPhone`, `interviewNotes`.

---

## IndexedDB schema

- **status**: singleton.
- **statusCodes**: keyed by `code`.
- **applications**: keyed by `id`.
- **interviews**: keyed by `id`.
- **syncQueue**: auto-increment key; fields: `operationType`, `entityType`, `entityId`, `timestamp`, `lastAttempt`.

---

## UI and navigation

- **Header:** Fixed; displays “Applicant’s Assistant”.
- **Menu bar:** Context-dependent buttons.
- **Content area:** Scrollable, resizable.
- **Footer:**  
  - Center: “© [current year] Applicant’s Assistant”  
  - Right: status indicator (green `+`, red `-`, blue `>>>`).

### Pages

- **Home page:** Buttons: New Application, Sync, Import, Export. Shows abbreviated list. Left-column button opens Application details.
- **Application details page:** Buttons: Save, Cancel, Add Interview, Delete (if not provisional). Shows full fields + interview table.
- **Interview details page:** Buttons: Done, Cancel, Delete (if not provisional). Buttons interact only with IndexedDB; sync occurs when parent Application is saved.

---

## Validation

**Summary:** Validation occurs on blur, ensuring data integrity before saving.

**Steps:**
1. Status must exist in statusCodes.
2. Email must match regex `^[^@\s]+@[^@\s]+\.[^@\s]+$`.
3. IDs must be numeric.
4. Dates/times must be UTC ISO with milliseconds.
5. Interview FK must reference valid Application.

---

## Import and export

**Summary:** Import/export handles JSON data with backup/restore safety.

**Steps:**
1. **Export:** JSON with status, statusCodes, applications, interviews; PDFs base64; credentials included; no provisional IDs.
2. **Import:**  
   - Validate required fields, referential integrity, formats.  
   - If valid: backup DB, apply import.  
   - If invalid: restore backup, discard backup.  
   - Provisional IDs disallowed.

---

## Sync design

**Summary:** Sync is a four-phase process: assess, pull, push, finalize.

**Steps:**
1. **Assess:** Compare client/server `seqno`. Attempt once; if fails, bail with error.
2. **Pull:** Fetch added/updated/tombstones since `lastUpdate`. Retry on error.
3. **Push:** Send consolidated queue; server returns authoritative records + ID map. Retry on error.
4. **Finalize:** Apply changes atomically; update Status; clear queue entries; set green indicator.

**Additional rules:**
- Provisional IDs replaced with server IDs (parent first, then children).
- Deletes: client hard deletes; server soft deletes; skip if already deleted.
- Offline halts scheduler.
- Indicator: blue during sync attempts, green only after finalize, red after retries exhausted.

---

## Sync clarifications

1. **Server API surface:** Endpoints `/sync/assess`, `/sync/pull`, `/sync/push`, `/auth/login`, `/auth/refresh`. Bearer JWT auth. JSON payloads.  
2. **Seqno definition:** Per-tenant global seqno. Server increments on any write; client updates after finalize.  
3. **Authoritative record & ID map:** Records include all fields + `lastWrite` + `isDeleted`. ID map: `{ provisionalId, serverId, entityType }`.  
4. **Provisional IDs:** Negative integers only. Client ensures uniqueness; server rejects negatives.  
5. **Provisional ID handling:** Preserve until server returns mapping. Remap atomically in finalize.  
6. **Parent->child ordering:** Not required; server resolves relationships using ID map.  
7. **Deletes:** Client->server: operationType=delete. Server->client: tombstone with `isDeleted=true`.  
9. **Timestamps:** Per-record `lastWrite` only; no per-field timestamps.  
10. **Partial push:** All-or-nothing batch; retry entire push if any fail.  
11. **Atomicity guarantees:** Transactional batch; either full success or no side-effects.  
12. **Soft-deletes referencing hard-deletes:** Client ignores but records event; idempotent.  
15. **Authentication refresh:** On 401, refresh token once; retry phase. If refresh fails, offline state.  
16. **Concurrent sync sessions:** Supported; server serializes via seqno/lastWrite. Clients converge via pull-then-push.  
17. **Sync frequency & batching:** Manual + background every 5 minutes. Batch up to 100 ops or 1 MB payload.  
18. **Pagination in pull:** Token-based pagination with `nextPageToken`.

---

## Retry policy

**Summary:** Exponential backoff governs retries.

**Steps:**
1. Attempt 1: T+0  
2. Attempt 2: T+15s  
3. Attempt 3: T+30s  
4. Attempt 4: T+2m  
5. Attempt 5: T+5m  
6. After 5 failures: offline until manual sync.

---

## Error handling

**Summary:** All server errors retried; error categorization deferred.

**Steps:**
1. Retry on any server error using backoff schedule.
2. If retries exhausted, set offline state.
3. Record last error in `Status.reason`.
4. Clear `Status.reason` on success.
5. Backlog: define fatal vs retryable split.

---

## Security and privacy

- Credentials stored plaintext in IndexedDB; included in exports.
- Authentication required in multi-user backend; client purges DB on user change.
- Encryption backlog.

---

## Backlog

- Schema versioning
- Encryption at rest
- Conflict resolution UI (field-level merge)
- Calendar/reminders
- Client event log
- Show sync details (“?” icon next to footer indicator)
- Import/export of SyncQueue
- IndexedDB write failure handling
- Attachment size limits and chunking
- Schema migration/versioning
- Tests and observability
- Discerning between server errors (fatal vs retryable split)

---

## Outstanding Tasks

- **Conflict resolution:** Not yet defined; backlog for field-level merge.  
- **Partial sync success:** Clarified; pull then push; bail if pull fails; offline if push retries exhausted.  
- **IndexedDB write failure handling:** backlog.  
- **Attachment size/chunking:** backlog.  
- **Schema migration/versioning:** backlog.  
- **Error categorization:** backlog.

---

## Appendix: Example record

```json
{
  "application": {
    "id": -1001,
    "companyName": "Acme Corp",
    "roleTitle": "Senior Developer",
    "applicationDate": "2025-12-10T00:00:00.000Z",
    "status": "applied"
  },
  "interview": {
    "id": -2001,
    "applicationId": -1001,
    "interviewerName": "Jane Smith",
    "interviewDate": "2025-12-15T00:00:00.000Z",
    "interviewTime": "2025-12-15T15:00:00.000Z"
  }
}
```
