# WebWaka Bug Remediation Log

**Date:** April 3, 2026  
**Auditor:** Manus AI  

This document logs the 7 bugs identified during the post-execution QA audit of Enhancements A and B, along with their exact remediation steps and GitHub commit hashes.

## BUG-2: Legacy `ai.ts` in Vertical Repositories
- **Severity:** High
- **Description:** The legacy `src/core/ai.ts` file was left in place when `ai-platform-client.ts` was added to the vertical repositories. This created ambiguity about which module to use.
- **Remediation:** Deleted `src/core/ai.ts` from `webwaka-fintech`, `webwaka-institutional`, `webwaka-services`, and `webwaka-production`.
- **Commits:** `c11a699` (fintech), `4c01e16` (institutional), `3c91480` (services), `397c49f` (production)

## BUG-4: Missing D1 Migrations
- **Severity:** High
- **Description:** `webwaka-ai-platform` and `webwaka-ui-builder` had no `migrations/` directory, making it impossible to apply the D1 schema at deploy time.
- **Remediation:** Added `migrations/0001_initial_schema.sql` to both repositories with proper indexes and seed capability rows.
- **Commits:** `beddbf4` (ai-platform), `7c49fc8` (ui-builder)

## BUG-5: Missing Unit Tests
- **Severity:** High
- **Description:** Both new repositories had zero test files. CI type-check would pass, but there were no unit tests.
- **Remediation:** Added `src/worker.test.ts` and `vitest.config.ts` to both repositories. Tests cover entitlements, event emission, BYOK resolution, template registry integrity, branding validation, and deployment ID generation.
- **Commits:** `6e031a7` (ai-platform), `caf4a95` (ui-builder)

## BUG-6: Missing Event Emission in `ai-billing/core.ts`
- **Severity:** High
- **Description:** `CEN-1` `ai-billing/core.ts` wrote to `ledger_entries` but never emitted a `billing.debit.recorded` event to the event bus.
- **Remediation:** Added `emitBillingEvent()` helper that writes to the `EVENTS` KV outbox (24h TTL) and optionally forwards via HTTP to `EVENT_BUS_URL`.
- **Commit:** `95148d1` (central-mgmt)

## BUG-7: Missing `@webwaka/core` Dependency
- **Severity:** High
- **Description:** `@webwaka/core` was not listed as a dependency in `package.json` for either new repository, despite the code importing `TenantBrandingSchema` and canonical event types from it.
- **Remediation:** Added `@webwaka/core@^1.6.0` and `vitest` to `package.json` in both repositories.
- **Commits:** `717be68` (ai-platform), `3f56d9c` (ui-builder)

## BUG-8: Untyped `requiredBrandingFields`
- **Severity:** Medium
- **Description:** UIB-3 templates used plain string arrays for `requiredBrandingFields` without any type connection to `TenantBrandingSchema`.
- **Remediation:** Imported `TenantBrandingSchema` type from `@webwaka/core`, added `BrandingFieldPath` type, and added `validateBrandingFields()` utility function.
- **Commit:** `9eb3ca6` (ui-builder)

## BUG-9: Simulated CF Pages API Call
- **Severity:** High
- **Description:** UIB-2 `deployment.ts` had a `TODO (Replit)` comment and simulated the CF Pages API call instead of making a real one.
- **Remediation:** Implemented real Cloudflare Pages API integration (GET project, POST create, POST deployments, POST domains) with graceful fallback when credentials are not set.
- **Commit:** `4b31c71` (ui-builder)
