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

- **Server Status table**
  - `seqno`: number — single authoritative global sequence number.
  - `lastWrite`: string (UTC ISO) — timestamp of last write committed.

### Code tables

- **Status code table**
  - `code`: string (e.g., “applied”, “interview”, “post-interview”, “rejected”).
  - `label`: string — human-readable name.
  - `isActive`: boolean — available for selection.
  - `order`: number — UI sort order.
  - Notes:
    - `applied`: default state.
    - `interview`: at least one interview scheduled.
    - `post-interview`: all interviews concluded; awaiting decision.
    - `rejected`: company explicitly rejected.
    - Future statuses can be added without schema changes.

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

- **Status transitions**
  - `applied -> rejected`: set rejectionDate = current UTC ISO date.
  - `rejected -> any other`: clear rejectionDate.
  - `applied -> interview/post-interview`: no side effects.

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

- **Delete behavior**
  - Client: cascades hard delete when parent Application is deleted.
  - Server: cascades soft delete when parent Application is deleted.

---

## IndexedDB schema

### Database name
- `applicantsAssistant`

### Object stores and indices

- **status**
  - key: `"status"` (singleton)
  - fields: seqno, lastUpdate, dirty, lastSyncAttempt

- **statusCodes**
  - key: `code` (string)
  - fields: code, label, isActive, order
  - indices:
    - `byOrder` -> order

- **applications**
  - key: `id` (long int; negative provisional allowed)
  - fields: as defined above
  - indices:
    - `byCompanyName` -> companyName
    - `byCompanyUrl` -> companyUrl
    - `byStatus` -> status
    - `byApplicationDate` -> applicationDate

- **interviews**
  - key: `id` (long int; negative provisional allowed)
  - fields: as defined above
  - indices:
    - `byApplicationId` -> applicationId
    - `byInterviewDate` -> interviewDate

---

## UI and navigation

- **Header:** Fixed; displays “Applicant’s Assistant”.
- **Footer:** Fixed.
- **Content area:** Scrollable.

- **Home page**
  - Shows all non-rejected applications.
  - Sort: applicationDate descending.
  - Abbreviated fields: companyName, roleTitle, applicationDate, status.
  - Clicking an application opens details.

- **Application details page**
  - Full application fields, editable.
  - Interviews table: read-only; columns date, time, interviewer name, position.
  - Clicking an interview opens Interview details page.

- **Interview details page**
  - Full interview fields, editable.

- **Menu: Data**
  - Import: Overwrite local DB from JSON file (minimal validation).
  - Export: Export all local data to JSON (includes base64 PDFs and plaintext credentials).
  - Sync: Trigger sync with backend.

---

## Validation

- **Timing:** on blur — runs when leaving a field.
- **Mechanism:** each field supports a validation function; current placeholder always passes unless noted.

- **Active validation rules**
  - Status valid: must exist in statusCodes.
  - Email format: local-part string before “@”; domain contains at least one period; no consecutive periods in the domain part after “@”.
  - IDs: must be numeric (negative provisional or positive server-assigned).
  - Dates/times: must be UTC ISO strings.
  - Interview FK: no explicit referential integrity check beyond workflow and type; assumes valid link.

---

## Import and export

- **Export**
  - Single JSON file containing: status, statusCodes, applications, interviews.
  - PDFs embedded as base64 strings.
  - Credentials included by default.
  - No schema version field (explicitly deferred).

- **Import**
  - Reads JSON and applies minimal validations:
    - Required fields present per entity.
    - Status values exist in statusCodes.
    - IDs are numeric, and interviews’ applicationId reference an application present in the payload.
    - Base64 for PDFs decodes.
  - If minimal validations pass: overwrite local DB.
  - If any fail: reject import and show error.

---

## Sync design

### Status semantics

- **Client Status**
  - `seqno` — last synchronized global sequence from server.
  - `lastUpdate` — UTC ISO of last successful sync.
  - `dirty` — indicates local changes to push.
  - `lastSyncAttempt` — UTC ISO of last sync attempt.

- **Server Status**
  - `seqno` — single authoritative global sequence.
  - `lastWrite` — UTC ISO of last committed write.

### Provisional ID reassignment

- Client creates Application/Interview with negative `id`.
- On push, server assigns positive long `id` and returns mappings `{ provisionalId -> realId }` and authoritative fields.
- Client updates all references (e.g., interviews.applicationId) atomically.

### Deletes

- Client: hard delete; cascades interviews.
- Server: soft delete; cascades interviews.
- Delete deltas: server emits tombstones; client hard-deletes on receipt.

### Sync phases

- **Phase 1: Is sync necessary?**
  - If `Status.dirty` is true: sync required.
  - Else, client sends `Status.seqno` to server:
    - Equal: no server-side changes.
    - Client < Server: pull updates.
    - Client > Server: anomaly; perform full client refresh (purge local DB, download all data).

- **Phase 2: Call the sync**
  - Pull added: client sends `lastUpdate` (UTC ISO); server returns records with `addedDate` > `lastUpdate`.
  - Pull deleted: server returns IDs deleted on or after `lastUpdate`.
  - Pull updated: server returns records with `lastUpdatedDate` > `lastUpdate`.
  - Push local changes: client sends inserts/updates/deletes (including provisional IDs). Server applies changes, assigns IDs, returns authoritative records and