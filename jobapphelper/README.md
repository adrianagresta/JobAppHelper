# Applicant’s Assistant Functional Design Document

---

## Overview

Applicant’s Assistant is a React web app for tracking job applications and interviews.  
The initial release is single-user with client-side IndexedDB storage.  
A later release adds background sync to a multi-user backend (C# with Entity Framework, plus an alternative Node.js backend).  
The app displays active applications on the home page and supports details pages, import/export, and sync.

---

## Core scope and principles

- **Client-only first:** IndexedDB for storage; hard deletes locally; provisional negative IDs.
- **Future multi-user backend:** Server-assigned long integer IDs, soft deletes on server, auth required.
- **Statuses from a code table:** Must be valid; extensible for future states.
- **Time handling:** All date/time/datetime stored as UTC ISO strings; client converts for display.
- **Attachments:** Job ad PDF stored as base64-encoded blob in IndexedDB.
- **Credentials:** Optional, plaintext initially, included in export by default.
- **Home page:** Shows non-rejected applications, sorted by applicationDate descending.
- **Interviews:** Read-only in Application view; edits via Interview details page.

---

## Data model

### Status tables

- **Client Status table**
  - `seqno`: number — last fully synchronized global sequence received from server.
  - `lastUpdate`: string (UTC ISO) — timestamp of last successful sync.
  - `dirty`: boolean — true if local changes exist to push.
  - `lastSyncAttempt`: string (UTC ISO, optional) — timestamp of last attempted sync.
  - `reason`: string — last error reason from failed sync; cleared on success.

- **Server Status table**
  - `seqno`: number — single authoritative global sequence number.
  - `lastWrite`: string (UTC ISO) — timestamp of last write committed.

### Code tables

- **Status code table**
  - `code`: string (e.g., “applied”, “interview”, “post-interview”, “rejected”).
  - `label`: string — human-readable name.
  - `isActive`: boolean — available for selection.
  - `order`: number — UI sort order.

### Application entity

- **Required fields**
  - `id`: number (long int; negative provisional on client, positive server-assigned).
  - `companyName`: string.
  - `companyUrl`: string.
  - `careersSiteUrl`: string.
  - `jobAdPdfBase64`: string (base64).
  - `roleTitle`: string.
  - `applicationDate`: string (UTC ISO date).
  - `status`: string (must be present in status code table).

- **Optional fields**
  - `contactEmail`: string.
  - `baseCompensation`: string.
  - `careerSiteUsername`: string.
  - `careerSitePassword`: string.
  - `coverLetterText`: string.
  - `gitRepoUrl`: string.
  - `rejectionDate`: string (UTC ISO date).
  - `reapplyEligibleDate`: string (UTC ISO date).
  - `notes`: string.

- **Delete behavior**
  - Client: hard delete; cascade to interviews.
  - Server: soft delete; cascade to interviews.

### Interview entity

- **Fields**
  - `id`: number (long int; negative provisional on client, positive server-assigned).
  - `applicationId`: number (FK to Application.id).
  - `meetingUrl`: string (optional).
  - `meetingAddress`: string (optional).
  - `interviewerName`: string (required).
  - `interviewerPosition`: string (optional).
  - `interviewDate`: string (UTC ISO date, required).
  - `interviewTime`: string (UTC ISO time, required).
  - `interviewerEmail`: string (optional).
  - `interviewerPhone`: string (optional).
  - `interviewNotes`: string (optional).

---

## IndexedDB schema

### Database name
- `applicantsAssistant`

### Object stores and indices

- **status**
  - key: `"status"` (singleton)
  - fields: seqno, lastUpdate, dirty, lastSyncAttempt, reason

- **statusCodes**
  - key: `code` (string)
  - fields: code, label, isActive, order
  - indices: `byOrder`

- **applications**
  - key: `id` (long int; negative provisional allowed)
  - indices: `byCompanyName`, `byCompanyUrl`, `byStatus`, `byApplicationDate`

- **interviews**
  - key: `id` (long int; negative provisional allowed)
  - indices: `byApplicationId`, `byInterviewDate`

- **syncQueue**
  - key: auto-increment
  - fields:
    - `operationType`: string (CREATE, UPDATE, DELETE)
    - `entityType`: string (application/interview)
    - `entityId`: number (negative provisional or positive server-assigned)
    - `timestamp`: string (UTC ISO)
    - `lastAttempt`: string (UTC ISO)

---

## UI and navigation

- **Header:** Fixed; displays “Applicant’s Assistant”.
- **Menu bar:** Context-dependent buttons.
- **Content area:** Scrollable, resizable.
- **Footer:**  
  - Center: “© [current year] Applicant’s Assistant”  
  - Right: status indicator  
    - Green `+` when online (last network op succeeded)  
    - Red `-` when offline (last op and retries failed)  
    - Blue `>>>` when sync in progress  

### Pages

- **Home page**
  - Menu bar: “New Application”, “Sync”, “Import”, “Export”
  - Abbreviated list: companyName, roleTitle, applicationDate, status
  - Left-column button opens Application details

- **Application details page**
  - Menu bar: “Save”, “Cancel”, “Add Interview”, “Delete” (if not provisional)
  - Shows all application fields + interview table (date, time, interviewer name)
  - Save: returns to Home immediately; sync runs in background
  - Cancel: confirmation dialog; abandon edits, no drafts retained
  - Add Interview: navigates to Interview details
  - Delete: queues delete, hard deletes locally, syncs with server

- **Interview details page**
  - Menu bar: “Done”, “Cancel”, “Delete” (if not provisional)
  - Buttons interact only with IndexedDB; sync occurs when parent Application is saved

---

## Validation

- **Timing:** on blur
- **Rules:**
  - Status must exist in statusCodes
  - Email format: local-part before “@”; domain contains at least one period; no consecutive periods
  - IDs must be numeric
  - Dates/times must be UTC ISO

---

## Import and export

- **Export:** JSON with status, statusCodes, applications, interviews; PDFs base64; credentials included.
- **Import:**  
  - If validation passes: backup local DB, apply import.  
  - If import fails: restore backup, discard backup after restore.  
  - Minimal validations: required fields, valid status codes, numeric IDs, valid references, base64 PDFs.

---

## Sync design

- **Client Status:** seqno, lastUpdate, dirty, lastSyncAttempt, reason
- **Server Status:** seqno, lastWrite
- **Provisional IDs:** replaced with server-assigned IDs on success
- **Deletes:** client hard deletes; server soft deletes; tombstones sent in deltas
- **Phases:**
  - Phase 1: check if sync needed
  - Phase 2: push/pull changes
  - Phase 3: finalize, update Status, clear queue entries
- **Anomaly:** client seqno > server seqno -> full client refresh
- **Ordering/idempotency:** server guarantees ordered, idempotent deltas

---

## Retry policy

- Attempt 1: T+0  
- Attempt 2: T+15s  
- Attempt 3: T+30s  
- Attempt 4: T+2m  
- Attempt 5: T+5m  
- After 5 failures: offline until manual sync

---

## Security and privacy

- Credentials stored plaintext in IndexedDB; included in exports.
- Authentication required in multi-user backend; client purges DB on user change.

---

## Error handling

- Status.reason stores last error; cleared on success.
- SyncQueue entries retried until success; remain until manual sync if retries exhausted.

---

## Backlog

- Schema versioning
- Encryption at rest
- Conflict resolution UI
- Calendar/reminders
- Client event log
- Show sync details (likely a “?” icon next to footer indicator)
- Import/export of SyncQueue (considered for offline portability)

---

## Outstanding Tasks

- **Conflict resolution:** Not yet defined. Must decide how to handle concurrent edits in multi-user scenarios.  
- **Partial sync success:** Not yet defined. Must decide whether to retry failed half immediately or defer to next sync cycle.

---

## Appendix: Example record

```json
{
  "application": {
    "id": -1001,
    "companyName": "Acme Corp",
    "roleTitle": "Senior Developer",
    "applicationDate": "2025-12-10T00:00:00Z",
    "status": "applied"
  },
  "interview": {
    "id": -2001,
    "applicationId": -1001,
    "interviewerName": "Jane Smith",
    "interviewDate": "2025-12-15T00:00:00Z",
    "interviewTime": "2025-12-15T15:00:00Z"
  }
}
