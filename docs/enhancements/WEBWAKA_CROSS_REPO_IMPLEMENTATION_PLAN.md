# WEBWAKA CROSS-REPO IMPLEMENTATION PLAN

## Overview

This document outlines the step-by-step execution plan for implementing Enhancement A (UI Builder Platform) and Enhancement B (AI Platform) across the WebWaka multi-repo ecosystem. The plan strictly adheres to the "No Drift" protocol and the 5-Layer QA protocol, ensuring that cross-repo dependencies are managed safely and that no vertical suite is broken during the transition.

The execution is divided into four distinct phases, sequenced to minimize risk and establish shared contracts before building the new platform capabilities.

## Phase 1: Foundation and Contracts (Target: `@webwaka/core`)

Before any new repositories are created, the shared contracts and event schemas must be established in the core library to ensure all downstream consumers speak the same language.

### Step 1.1: Define Canonical Event Schemas
*   **Repository:** `webwaka-core`
*   **Action:** Expand `src/core/events/index.ts` to include the new canonical event types required for the UI Builder and AI Platform (e.g., `ui.deployment.requested`, `ai.usage.recorded`).
*   **QA:** Ensure TypeScript strict mode passes and unit tests verify the schema shapes.

### Step 1.2: Define Tenant Branding Schema
*   **Repository:** `webwaka-core`
*   **Action:** Create `src/core/ui/branding.ts` defining the `TenantBrandingSchema` interface.
*   **QA:** Verify the schema accommodates the existing fields used in `webwaka-commerce` and `webwaka-super-admin-v2`.

### Step 1.3: Publish `@webwaka/core` v1.6.0
*   **Repository:** `webwaka-core`
*   **Action:** Bump the version in `package.json` and trigger the `publish.yml` GitHub Action to release the new contracts to the private npm registry.

## Phase 2: Event Schema Migration (Target: Vertical Repositories)

The architectural review identified fragmented event schemas across Civic, Professional, and Logistics. These must be standardized before the new platforms rely on the Event Bus.

### Step 2.1: Migrate `webwaka-civic`
*   **Repository:** `webwaka-civic`
*   **Action:** Update `src/core/event-bus.ts` to use the `WebWakaEvent<T>` schema from `@webwaka/core` v1.6.0. Update all event publishers in the Civic modules.
*   **QA:** Run Integration Tests to verify events are correctly formatted before being written to the D1 outbox.

### Step 2.2: Migrate `webwaka-professional`
*   **Repository:** `webwaka-professional`
*   **Action:** Update `src/core/event-bus/index.ts` to use the canonical schema.
*   **QA:** Run Integration Tests.

### Step 2.3: Migrate `webwaka-logistics`
*   **Repository:** `webwaka-logistics`
*   **Action:** Update the KV-based event queue publisher in `src/worker.ts` to enforce the canonical schema.
*   **QA:** Run Integration Tests.

## Phase 3: AI Platform Implementation (Target: `webwaka-ai-platform` & Verticals)

With the foundation set, the AI Platform can be built and the fragmented vertical implementations deprecated.

### Step 3.1: Provision `webwaka-ai-platform`
*   **Repository:** `webwaka-ai-platform` (New)
*   **Action:** Initialize the repository with the standard Hono/Cloudflare Workers scaffold. Configure `wrangler.toml` with D1 (`webwaka-ai-db`) and KV (`AI_ENTITLEMENTS_KV`, `TENANT_SECRETS_KV`).

### Step 3.2: Implement AI Core API
*   **Repository:** `webwaka-ai-platform`
*   **Action:** Migrate the `AIEngine` logic from `@webwaka/core` into the new repository. Implement the `POST /completions` endpoint with OpenRouter and CF Workers AI fallback. Implement the BYOK routing logic.
*   **QA:** Run Unit Tests (mocking OpenRouter) and Integration Tests (verifying CF fallback).

### Step 3.3: Refactor Vertical AI Consumers
*   **Repositories:** `webwaka-fintech`, `webwaka-institutional`, `webwaka-services`, `webwaka-production`
*   **Action:** Delete the local `src/core/ai.ts` files. Update all AI calls to use the new `webwaka-ai-platform` API endpoint via inter-service HTTP requests (secured by `INTER_SERVICE_SECRET`).
*   **QA:** Run E2E Tests for each vertical to ensure AI features (e.g., invoice parsing) still function correctly.

### Step 3.4: Implement Usage Billing Hook
*   **Repository:** `webwaka-central-mgmt`
*   **Action:** Update the ledger consumer to listen for `ai.usage.recorded` events and debit the corresponding tenant's quota/balance.
*   **QA:** Run Integration Tests verifying the double-entry ledger updates correctly upon receiving the event.

## Phase 4: UI Builder Implementation (Target: `webwaka-ui-builder` & `webwaka-commerce`)

The UI Builder is implemented last, using the Commerce vertical as the initial proof-of-concept for the 3-in-1 linkage.

### Step 4.1: Provision `webwaka-ui-builder`
*   **Repository:** `webwaka-ui-builder` (New)
*   **Action:** Initialize the repository. Configure `wrangler.toml` with D1 (`webwaka-ui-db`) and KV (`UI_CONFIG_KV`).

### Step 4.2: Implement Deployment Orchestrator
*   **Repository:** `webwaka-ui-builder`
*   **Action:** Implement the Cloudflare Worker that listens for `ui.deployment.requested` events and interacts with the Cloudflare Pages API to provision and deploy tenant sites.
*   **QA:** Run Integration Tests mocking the Cloudflare Pages API.

### Step 4.3: Build Initial Commerce Templates
*   **Repository:** `webwaka-ui-builder`
*   **Action:** Create the "Retail Storefront" template schema and component library. Ensure components use the `TenantBrandingSchema` from `@webwaka/core`.

### Step 4.4: Refactor Commerce Branding
*   **Repository:** `webwaka-commerce`
*   **Action:** Deprecate the local `StorefrontBranding` interface. Update the Commerce API to read branding configuration from the central `UI_CONFIG_KV` (populated by the UI Builder) instead of its local D1 database.
*   **QA:** Run E2E Tests verifying the Commerce POS and existing storefronts still render correctly using the centralized branding data.

### Step 4.5: Integrate Builder Admin
*   **Repository:** `webwaka-super-admin-v2`
*   **Action:** Add the UI Builder control plane to the Super Admin dashboard, allowing Tenant Admins to select the "Retail Storefront" template and trigger a deployment.
*   **QA:** Run Acceptance Tests verifying a tenant can successfully deploy a branded storefront that connects to their Commerce POS backend.

## Rollback Strategy

If any phase introduces critical regressions detected during the 5-Layer QA protocol:

1.  **Phase 1/2 Failure:** Revert the `@webwaka/core` version bump in the affected vertical repositories. The old event schemas will continue to function.
2.  **Phase 3 Failure:** If the `webwaka-ai-platform` API fails in production, vertical repositories will be temporarily reverted to use their local `src/core/ai.ts` implementations until the platform issue is resolved.
3.  **Phase 4 Failure:** If the UI Builder deployment orchestrator fails, tenants will continue to use the legacy, hardcoded storefronts provided by `webwaka-commerce` until the orchestrator is fixed. The central `UI_CONFIG_KV` will act as a passive data store during the rollback.
