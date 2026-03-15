# PRO-1 Implementation Plan — Legal Practice Module
**Epic:** PRO-1 — Legal Practice (Case Tracking, Time Billing, NBA Compliance)
**Repository:** WebWakaDOS/webwaka-professional
**Blueprint Reference:** Part 10.8 — Professional Services Suite
**Agent:** worker-alpha
**Date:** 2026-03-15

---

## Scope (from Blueprint Part 10.8)

> **Legal Practice:** Client management, case tracking, time billing, document management (NBA compliance).

The Nigerian Bar Association (NBA) is the regulatory body for legal practitioners in Nigeria. NBA compliance requires:
- Lawyer bar number (call-to-bar number) registration and verification
- Annual practising certificate (APC) tracking
- Court appearance logging
- Client confidentiality (NDPR-compliant data handling)
- Fee agreements and billing in NGN (kobo integers)

---

## 7 Core Invariants Enforcement Plan

| Invariant | Implementation Strategy |
|-----------|------------------------|
| **Build Once Use Infinitely** | Shared constants in `shared/const.ts`; utility functions in `server/legal.utils.ts` reused across router, tests, and frontend |
| **Mobile First** | All pages mobile-first Tailwind; large touch targets; single-column on small screens |
| **PWA First** | `manifest.json` with standalone display; `sw.js` with cache-first + background sync |
| **Offline First** | Dexie IndexedDB for cases and time entries; mutation queue; sync engine |
| **Nigeria First** | NGN/kobo, WAT timezone, NBA bar number validation, NDPR compliance |
| **Africa First** | i18n: en, yo, ig, ha; multi-currency support in billing model |
| **Vendor Neutral AI** | Platform `invokeLLM` helper only; no hardcoded vendor SDK |

---

## Database Schema Plan

All tables follow platform MySQL conventions: `int` auto-increment PKs, `tenantId` on every row, `deletedAt` soft deletes, monetary values as integers in kobo.

### Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `legal_clients` | Law firm clients | `tenantId`, `name`, `email`, `phone`, `address`, `ndprConsentAt`, `deletedAt` |
| `legal_cases` | Cases/matters | `tenantId`, `clientId`, `caseNumber`, `title`, `type`, `status`, `courtName`, `filingDate`, `closedAt`, `deletedAt` |
| `legal_time_entries` | Billable time logs | `tenantId`, `caseId`, `lawyerId`, `description`, `durationMinutes`, `rateKobo`, `amountKobo`, `billedAt`, `deletedAt` |
| `legal_invoices` | Client invoices | `tenantId`, `clientId`, `caseId`, `invoiceNumber`, `totalKobo`, `paidKobo`, `status`, `dueDate`, `deletedAt` |
| `legal_documents` | Case documents | `tenantId`, `caseId`, `title`, `fileUrl`, `fileKey`, `mimeType`, `uploadedBy`, `deletedAt` |
| `legal_nba_profiles` | NBA compliance | `tenantId`, `userId`, `barNumber`, `callYear`, `apcYear`, `apcExpiresAt`, `isVerified` |

### Case Status State Machine
`OPEN` → `IN_PROGRESS` → `ADJOURNED` → `CLOSED` | `SETTLED` | `STRUCK_OUT`

### Case Types (Nigeria-specific)
`CIVIL`, `CRIMINAL`, `COMMERCIAL`, `FAMILY`, `LAND`, `CONSTITUTIONAL`, `LABOUR`, `ARBITRATION`, `ADVISORY`

---

## tRPC Procedures Plan

### `clients` router
- `clients.list` — paginated, tenant-scoped, search by name/email
- `clients.get` — full client with cases summary
- `clients.create` — with NDPR consent timestamp
- `clients.update` — soft-update
- `clients.delete` — soft delete

### `cases` router
- `cases.list` — paginated, filter by status/type/client
- `cases.get` — full case with time entries, documents, invoices
- `cases.create` — publish `case.opened` event
- `cases.updateStatus` — state machine validation
- `cases.delete` — soft delete

### `timeEntries` router
- `timeEntries.list` — by case, by lawyer, by date range
- `timeEntries.create` — auto-calculate `amountKobo = durationMinutes/60 * rateKobo`
- `timeEntries.update`
- `timeEntries.delete`

### `invoices` router
- `invoices.list` — by client, by status
- `invoices.get` — full invoice with line items
- `invoices.create` — from time entries, publish `invoice.created` event
- `invoices.markPaid` — publish `invoice.paid` event
- `invoices.delete`

### `documents` router
- `documents.list` — by case
- `documents.upload` — S3 via `storagePut`
- `documents.delete`

### `nba` router
- `nba.getProfile` — get NBA profile for current user
- `nba.upsertProfile` — register/update bar number and APC

---

## Frontend Pages Plan

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Stats: active cases, unbilled hours, outstanding invoices |
| Clients | `/clients` | Paginated client list with search |
| Client Detail | `/clients/:id` | Client info, cases, invoices |
| New Client | `/clients/new` | NDPR-compliant intake form |
| Cases | `/cases` | Paginated case list with filters |
| Case Detail | `/cases/:id` | Timeline, time entries, documents, invoices |
| New Case | `/cases/new` | Case creation form |
| Time Entries | `/time` | Log billable time per case |
| Invoices | `/invoices` | Invoice list with payment status |
| Invoice Detail | `/invoices/:id` | Line items, payment actions |
| NBA Profile | `/nba` | Bar number, APC year, compliance status |

---

## Event Bus Events (CORE-2)

| Event | Trigger | Payload |
|-------|---------|---------|
| `case.opened` | New case created | `{ tenantId, caseId, clientId, type }` |
| `case.status_changed` | Status transition | `{ tenantId, caseId, from, to }` |
| `case.closed` | Case closed/settled | `{ tenantId, caseId, resolution }` |
| `invoice.created` | Invoice generated | `{ tenantId, invoiceId, clientId, totalKobo }` |
| `invoice.paid` | Invoice marked paid | `{ tenantId, invoiceId, paidKobo }` |

---

## Nigeria-First Specifics

- **NBA Bar Number format:** `NBA/STATE/YEAR/SEQUENCE` e.g. `NBA/LAG/2015/001234`
- **APC (Annual Practising Certificate):** Tracks current year validity
- **Court names:** Nigerian courts (Supreme Court, Court of Appeal, Federal High Court, State High Courts, Magistrate Courts, Customary Courts)
- **Currency:** NGN default, stored in kobo
- **Timezone:** WAT (Africa/Lagos, UTC+1)
- **NDPR:** Client consent timestamp required; sensitive data fields flagged

---

## File Structure

```
server/
  legal.utils.ts          — Pure utility functions (bar number validation, kobo, WAT)
  legal.db.ts             — Query helpers for all 6 tables
  eventBus.ts             — CORE-2 event bus (reused from LOG-2 pattern)
  logger.ts               — Platform logger (reused from LOG-2 pattern)
  routers/
    clients.ts            — Client tRPC router
    cases.ts              — Cases tRPC router
    timeEntries.ts        — Time entries tRPC router
    invoices.ts           — Invoices tRPC router
    documents.ts          — Documents tRPC router
    nba.ts                — NBA compliance tRPC router

client/src/
  lib/
    i18n.ts               — en/yo/ig/ha translations
    offlineDb.ts          — Dexie schema (cases, time entries, mutation queue)
    syncEngine.ts         — Mutation queue sync engine
  contexts/
    I18nContext.tsx        — Language context
  pages/
    Home.tsx              — Dashboard
    ClientsList.tsx       — Clients list
    ClientDetail.tsx      — Client detail
    CreateClient.tsx      — New client form
    CasesList.tsx         — Cases list
    CaseDetail.tsx        — Case detail with timeline
    CreateCase.tsx        — New case form
    TimeEntries.tsx       — Time logging
    InvoicesList.tsx      — Invoices list
    InvoiceDetail.tsx     — Invoice detail
    NBAProfile.tsx        — NBA compliance page
  components/
    StatusBadge.tsx       — Case status badge
    OfflineBanner.tsx     — Offline indicator
    LanguageSwitcher.tsx  — Language switcher
```
