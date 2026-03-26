# WebWaka OS v4 — Phased Remediation Plan

**Date:** March 26, 2026  
**Author:** Manus (Lead Architect)  
**Scope:** Cross-Repository Remediation Plan based on `PLATFORM_REVIEW_AND_ENHANCEMENTS.md` (March 25, 2026)

---

## 1. Executive Summary

This document outlines the exact, phased execution plan to remediate all gaps identified in the March 25 platform audit [1]. The plan is strictly sequenced into three priorities: Priority 1 (Blockers), Priority 2 (Post-P1 Enhancements), and Priority 3 (Final Verification). 

Every task enforces the 7 core invariants of the WebWaka OS v4 architecture (Build Once Use Infinitely, Mobile First, PWA First, Offline First, Nigeria First, Africa First, Vendor Neutral AI) [2]. All implementations require a strict `code → test → PR → merge main → verify` lifecycle. No phase or task may be skipped or batched.

### Issues by Priority and Scope

| Priority | Scope | Issue Description | Estimated Days |
|----------|-------|-------------------|----------------|
| **1 (Blockers)** | Cross-Repo | `@webwaka/core` publication & canonical auth/RBAC adoption | 2 |
| **1 (Blockers)** | Cross-Repo | Event schema fragmentation (Civic, Professional, Logistics) | 3 |
| **1 (Blockers)** | Cross-Repo | Super Admin event consumption & global billing ledger | 4 |
| **1 (Blockers)** | Single-Repo | Super Admin V2: Production D1 UUID automation | 1 |
| **1 (Blockers)** | Single-Repo | Super Admin V2: Admin JWT migration to HttpOnly cookie | 1 |
| **1 (Blockers)** | Single-Repo | Super Admin V2: Tenant status enum reconciliation | 1 |
| **1 (Blockers)** | Single-Repo | Commerce: Production `wrangler.toml` checks | 1 |
| **2 (Post-P1)** | Cross-Repo | Automated tenant provisioning via Workers binding | 4 |
| **2 (Post-P1)** | Cross-Repo | Real telemetry health checks across suites | 3 |
| **2 (Post-P1)** | Cross-Repo | Nigeria-first compliance audit & fixes for alpha suites | 5 |
| **2 (Post-P1)** | Single-Repo | Super Admin V2: Workbox SW refactor (`StaleWhileRevalidate`) | 2 |
| **2 (Post-P1)** | Single-Repo | Super Admin V2: TanStack Virtual on data lists | 2 |
| **2 (Post-P1)** | Single-Repo | Core: Locale-aware number formatting (`formatKoboToNaira`) | 1 |
| **3 (Verification)** | Cross-Repo | Full cross-repo orchestration & E2E verification | 3 |

---

## 2. Priority 1: Issues That Must Be Implemented FIRST (Blockers)

These issues represent critical security, architectural, or deployment blockers. They must be resolved before any further feature work or integration proceeds.

| Issue | Tasks | Owner | Deliverables | Branch Merge Check |
|-------|-------|-------|--------------|--------------------|
| **`@webwaka/core` Publication** (Cross-Repo) | 1. Configure GitHub Packages registry in `webwaka-core`.<br>2. Publish `v1.0.0` of `@webwaka/core`.<br>3. Update `webwaka-commerce` and `webwaka-super-admin-v2` to use npm package instead of local path.<br>4. Test builds across repos. | Manus | Published npm package; updated `package.json` in Commerce and SA v2. | Verify `main` merge in Core, Commerce, SA v2 via GitHub API. |
| **Event Schema Fragmentation** (Cross-Repo) | 1. Audit `EVENT_BUS_SCHEMA.md` [3].<br>2. Refactor `webwaka-civic` to use `WebWakaEvent<T>`.<br>3. Refactor `webwaka-professional` to use `WebWakaEvent<T>`.<br>4. Refactor `webwaka-logistics` to use `WebWakaEvent<T>`. | Manus | Canonical schema adopted in all 3 alpha suites. | Verify `main` merge in Civic, Professional, Logistics via GitHub API. |
| **Global Billing Ledger** (Cross-Repo) | 1. Create Cloudflare Queues consumer in `webwaka-super-admin-v2`.<br>2. Subscribe consumer to Commerce `EVENTS` KV.<br>3. Map `payment.completed` to `BILLING_DB.ledger_entries`.<br>4. Write integration tests. | Manus | Automated revenue tracking in Super Admin from Commerce events. | Verify `main` merge in SA v2 via GitHub API. |
| **Production D1 UUIDs** (Single-Repo) | 1. Write `scripts/provision-prod-d1.sh` in SA v2.<br>2. Add CI/CD pre-deploy check in `.github/workflows/deploy-workers.yml` to fail on `TODO_REPLACE_WITH_PROD_*`.<br>3. Test script locally. | Replit (SA v2) | Automated D1 provisioning script; strict CI/CD gate. | Verify `main` merge in SA v2 via GitHub API. |
| **Admin JWT to HttpOnly** (Single-Repo) | 1. Remove `localStorage.setItem` in SA v2 `AuthContext.tsx`.<br>2. Update SA v2 auth API to set `HttpOnly`, `SameSite=Strict` cookie.<br>3. Update frontend fetch client to include credentials.<br>4. Run Vitest/Playwright suites. | Replit (SA v2) | XSS-hardened admin session. | Verify `main` merge in SA v2 via GitHub API. |
| **Tenant Status Enum Fix** (Single-Repo) | 1. Update SA v2 D1 migration to match TypeScript (`ACTIVE \| SUSPENDED \| TRIAL \| CHURNED`).<br>2. Update `schema.ts` if necessary.<br>3. Add Vitest test asserting enum parity.<br>4. Run D1 local migrations. | Replit (SA v2) | Synchronized DB and TS schemas. | Verify `main` merge in SA v2 via GitHub API. |
| **Commerce Prod Checks** (Single-Repo) | 1. Add CI/CD pre-deploy check in Commerce `.github/workflows/deploy.yml` to fail on `TODO_REPLACE_WITH_PROD_*`.<br>2. Verify `ENV_SETUP.md` [4] bindings are strictly enforced in CI. | Replit (Commerce) | Strict CI/CD gate for Commerce. | Verify `main` merge in Commerce via GitHub API. |

---

## 3. Priority 2: Issues After Priority 1 Completion

These issues focus on cross-suite orchestration, performance scaling, and strict compliance enforcement. They depend on the foundational fixes from Priority 1.

| Issue | Tasks | Owner | Deliverables | Branch Merge Check |
|-------|-------|-------|--------------|--------------------|
| **Automated Tenant Provisioning** (Cross-Repo) | 1. Implement CF Workers Service Binding from SA v2 to Commerce.<br>2. Update SA v2 `POST /tenants` to call Commerce internal API.<br>3. Commerce Worker writes KV config atomically.<br>4. Emit `tenant.provisioned` event. | Manus | Elimination of manual KV injection workflow [5]. | Verify `main` merge in SA v2 and Commerce via GitHub API. |
| **Telemetry Health Checks** (Cross-Repo) | 1. Add `GET /internal/telemetry` to Commerce, Civic, Logistics.<br>2. Protect with `INTERNAL_API_KEY`.<br>3. Update SA v2 `SystemHealth` to poll endpoints.<br>4. Write results to `HEALTH_DB`. | Manus | Real-time latency/error tracking in SA v2. | Verify `main` merge in SA v2, Commerce, Civic, Logistics. |
| **Nigeria-First Alpha Audit** (Cross-Repo) | 1. Audit Civic, Transport, Logistics, Professional for NGN Kobo, 7.5% VAT, 37 states.<br>2. Implement missing Termii OTP / Paystack gates.<br>3. Enforce NDPR boolean gates.<br>4. Run test suites. | Manus | 100% Nigeria-First compliance across all active suites. | Verify `main` merge in all 4 alpha suites via GitHub API. |
| **Workbox SW Refactor** (Single-Repo) | 1. Replace custom SA v2 `sw.js` with Workbox.<br>2. Implement `StaleWhileRevalidate` for API routes.<br>3. Set 60s TTL for metrics, 5m for lists.<br>4. Test offline banner and sync. | Replit (SA v2) | Enterprise-grade PWA caching. | Verify `main` merge in SA v2 via GitHub API. |
| **TanStack Virtual Lists** (Single-Repo) | 1. Install `@tanstack/react-virtual` in SA v2.<br>2. Apply to `TenantManagement` and `PartnerManagement` tables.<br>3. Apply to `AuditLog`.<br>4. Run Playwright E2E tests. | Replit (SA v2) | DOM virtualization for 100+ records. | Verify `main` merge in SA v2 via GitHub API. |
| **Locale-Aware Formatting** (Single-Repo) | 1. Extend `formatKoboToNaira` in `@webwaka/core` to accept locale.<br>2. Implement `yo`, `ig`, `ha` number separators.<br>3. Publish `@webwaka/core` patch.<br>4. Update Commerce UI to use new formatter. | Replit (Core) | Full i18n compliance beyond labels. | Verify `main` merge in Core and Commerce via GitHub API. |

---

## 4. Priority 3: Final Wiring and Verification (After 1+2)

This phase is executed exclusively by the Lead Architect (Manus) to validate the entire ecosystem end-to-end.

| Issue | Tasks | Owner | Deliverables | Branch Merge Check |
|-------|-------|-------|--------------|--------------------|
| **End-to-End Orchestration Test** | 1. Trigger tenant creation in SA v2.<br>2. Verify automated KV provisioning in Commerce.<br>3. Simulate Commerce checkout.<br>4. Verify event bus propagation to SA v2 `BILLING_DB`.<br>5. Generate final verification report. | Manus | `PLATFORM_VERIFICATION_REPORT.md` proving 100% schema alignment and zero TODOs. | N/A (Verification only) |

---

## 5. Risks and Dependencies

1. **Dependency:** Priority 1 `@webwaka/core` publication MUST occur before any other cross-repo work, as all suites depend on its canonical schemas and middleware.
2. **Dependency:** Priority 1 D1 UUID automation MUST occur before Priority 2 automated tenant provisioning, as the SA v2 database must be stable to store tenant records.
3. **Risk:** The GitHub Packages registry requires a PAT with `write:packages` scope. If unavailable, a private npm registry or git-based dependency resolution must be strictly versioned via tags.
4. **Risk:** Modifying the SA v2 admin JWT to `HttpOnly` will break local development if the Vite proxy is not configured correctly to forward cookies. The Replit owner must ensure `vite.config.ts` is updated concurrently.

---

## References

[1] WebWaka OS v4 — Comprehensive Platform Review & Enhancements (March 25, 2026).
[2] WebWaka OS v4: Comprehensive Platform Roadmap (`PLATFORM_ROADMAP.md`).
[3] WebWaka Platform Event Bus Schema (`EVENT_BUS_SCHEMA.md`).
[4] WebWaka Commerce: Environment Setup Guide (`ENV_SETUP.md`).
[5] WebWaka Commerce: Tenant Onboarding Guide (`COMMERCE_TENANT_ONBOARDING_GUIDE.md`).
