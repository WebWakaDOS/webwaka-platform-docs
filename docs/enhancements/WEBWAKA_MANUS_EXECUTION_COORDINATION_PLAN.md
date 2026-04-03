# WEBWAKA MANUS EXECUTION COORDINATION PLAN

## Overview

This document defines the exact operational protocol for Manus (the autonomous agent) to orchestrate the multi-repo implementation of the WebWaka UI Builder and AI Platform enhancements. 

While Replit agents (worker nodes) handle the repo-local coding tasks, Manus acts as the **Factory Floor Manager**, responsible for cross-repo coordination, dependency resolution, QA gating, and deployment sequencing.

## The "No Drift" Protocol for Manus

As the orchestrator, Manus must strictly enforce the "No Drift" protocol across all worker nodes:

1.  **Blueprint Authority:** Manus must verify that every PR submitted by a worker node cites the correct Blueprint section (e.g., `[Part 10.4]`) in its commit messages.
2.  **Invariant Enforcement:** Before approving any cross-repo integration, Manus must run static analysis to ensure no direct inter-DB access has been introduced (enforcing the "Event-Driven" invariant).
3.  **Queue Management:** Manus is the sole entity authorized to update the global `queue.json` in `webwaka-platform-status` to unblock dependent tasks.

## Execution Sequencing and Gating

The implementation is divided into four phases (defined in `WEBWAKA_CROSS_REPO_IMPLEMENTATION_PLAN.md`). Manus must enforce strict gating between these phases.

### Phase 1 Gate: Core Contracts Published

*   **Condition:** Tasks CORE-9, CORE-10, and CORE-11 must be marked `DONE` in `queue.json`.
*   **Manus Action:** 
    1. Verify that `@webwaka/core` v1.6.0 is successfully published to the private npm registry.
    2. Verify that the `WebWakaEvent<T>` and `TenantBrandingSchema` interfaces are correctly exported.
    3. **Unblock:** Update `queue.json` to change the status of CIV-4, PRO-4, LOG-4, AIP-1, and UIB-1 from `BLOCKED` to `PENDING`.

### Phase 2 Gate: Event Schema Migration Complete

*   **Condition:** Tasks CIV-4, PRO-4, and LOG-4 must be marked `DONE`.
*   **Manus Action:**
    1. Run a cross-repo grep (`grep -r "WebWakaEvent" .`) across the Civic, Professional, and Logistics repositories to confirm the new schema is in use.
    2. Verify that integration tests in all three repositories are passing.
    3. **Unblock:** Proceed to monitor Phase 3 and Phase 4 execution.

### Phase 3 Gate: AI Platform API Live

*   **Condition:** Tasks AIP-1 and AIP-2 must be marked `DONE`.
*   **Manus Action:**
    1. Verify the `webwaka-ai-platform` worker is successfully deployed to the staging environment (`https://webwaka-ai-platform-staging.webwaka.workers.dev`).
    2. Execute a test `POST /completions` request against the staging API to verify OpenRouter routing and CF Workers AI fallback.
    3. **Unblock:** Update `queue.json` to change the status of FIN-6, INS-4, SRV-4, PRD-4, and CEN-1 from `BLOCKED` to `PENDING`.

### Phase 4 Gate: UI Builder Orchestrator Live

*   **Condition:** Tasks UIB-1, UIB-2, and UIB-3 must be marked `DONE`.
*   **Manus Action:**
    1. Verify the `webwaka-ui-builder` worker is successfully deployed to the staging environment.
    2. Verify the `Retail Storefront` template schema is available in the D1 database.
    3. **Unblock:** Update `queue.json` to change the status of COM-5 and SUP-1 from `BLOCKED` to `PENDING`.

## 5-Layer QA Protocol Orchestration

Manus is responsible for verifying that worker nodes have successfully executed the 5-Layer QA protocol before marking an epic as `DONE`.

1.  **Static Analysis:** Manus triggers `npm run lint` and `npm run typecheck` via GitHub Actions for the target repository. If it fails, Manus rejects the PR and instructs the worker node to fix the errors.
2.  **Unit Tests:** Manus verifies that `npm run test --coverage` reports >90% coverage.
3.  **Integration Tests:** Manus verifies that tests involving the D1 outbox or KV namespaces pass successfully in the Miniflare environment.
4.  **E2E Tests:** Manus triggers the Playwright test suite (e.g., `npm run test:e2e` in `webwaka-commerce`) to ensure cross-module workflows are intact.
5.  **Acceptance Tests:** Manus reviews the generated `[EPIC-ID]-QA-REPORT.md` submitted by the worker node to ensure Nigeria-specific use cases (e.g., NGN currency formatting, Termii SMS fallback) were explicitly tested.

## Error Handling and Rollback Orchestration

If a critical failure occurs during deployment or E2E testing, Manus must execute the rollback strategy defined in the Cross-Repo Implementation Plan.

1.  **Detect Failure:** Monitor GitHub Actions deployment workflows and staging API health endpoints.
2.  **Halt Queue:** Immediately update `queue.json` to set all `PENDING` tasks related to the failed phase to `BLOCKED`.
3.  **Execute Rollback:**
    *   If Phase 3 (AI) fails: Instruct worker nodes to revert the PRs in `webwaka-fintech`, `webwaka-institutional`, etc., restoring the local `src/core/ai.ts` implementations.
    *   If Phase 4 (UI) fails: Instruct worker nodes to revert the PRs in `webwaka-commerce` and `webwaka-super-admin-v2`, restoring the hardcoded `StorefrontBranding` logic.
4.  **Generate Incident Report:** Create a `ROLLBACK-REPORT-[DATE].md` detailing the failure cause and the steps taken to restore the platform to a stable state.

## Daily Factory Synchronization

At the start of each execution day, Manus must perform the following synchronization tasks:

1.  Pull the latest `queue.json` from `webwaka-platform-status`.
2.  Pull the latest `FACTORY-STATE-REPORT.md` from `webwaka-platform-docs`.
3.  Verify the health of all staging environments for the 12 vertical suites.
4.  Identify any stalled worker nodes (tasks marked `IN_PROGRESS` for >24 hours) and reassign them to `PENDING`.
