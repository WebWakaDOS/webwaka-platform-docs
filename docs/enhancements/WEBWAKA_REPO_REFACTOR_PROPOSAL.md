# WEBWAKA REPO REFACTOR PROPOSAL

## Overview

This proposal outlines the necessary repository refactoring and structural changes required to implement Enhancement A (UI Builder Platform) and Enhancement B (AI Platform) within the WebWaka multi-repo ecosystem. It defines repository boundaries, code migration strategies, and the exact ownership model between Manus (cross-repo orchestration) and Replit agents (repo-local implementation).

## New Repositories Required

Based on the architectural review and the strict adherence to the "Multi-Repo Platform Architecture" and "Build Once Use Infinitely" invariants, **two new repositories are required**.

### 1. `webwaka-ui-builder`

*   **Rationale:** The UI composition system is a bounded platform capability, not a feature of a specific vertical (like Commerce or Transport). Embedding it within an existing vertical would violate the "Build Once Use Infinitely" principle and create a monolithic dependency. A dedicated repository ensures the builder engine, template registry, and deployment orchestration logic remain isolated and reusable across all 12 vertical suites.
*   **Primary Responsibilities:**
    *   Template registry and taxonomy management.
    *   Website and dashboard composition engine.
    *   Deployment orchestration (Cloudflare Pages integration).
    *   Builder admin interface.
    *   Template-category logic (vertical-specific mapping).

### 2. `webwaka-ai-platform`

*   **Rationale:** AI capabilities are currently fragmented across multiple vertical repositories (`webwaka-fintech`, `webwaka-institutional`, `webwaka-services`, `webwaka-production`), leading to redundant code and inconsistent governance. A dedicated AI platform repository centralizes provider abstraction, entitlement management, and usage tracking, aligning with the "Vendor Neutral AI" invariant and enabling super-admin control.
*   **Primary Responsibilities:**
    *   AI capability registry (e.g., "Invoice Parsing," "Support Chatbot").
    *   Provider abstraction layer (OpenRouter, Cloudflare Workers AI).
    *   BYOK (Bring-Your-Own-Key) flows and secure credential storage.
    *   Feature toggles and AI policy enforcement.
    *   AI usage hooks for centralized billing.

## Repository Responsibility Matrix

The following matrix defines the target state for code ownership across the affected repositories:

| Area | Best Home | Rationale |
| :--- | :--- | :--- |
| Shared tenant-aware contracts, event schemas, reusable SDKs, UI primitives, entitlement helpers | `webwaka-core` | Supports build-once reuse and cross-repo consistency. Prevents duplication of foundational logic. |
| Template registry, website/dashboard composition engine, deployment orchestration, builder admin, template-category logic | `webwaka-ui-builder` | This is a new bounded platform capability, not just a feature inside one vertical. |
| AI capability registry, provider abstraction, BYOK flows, feature toggles, AI policy layer, AI usage hooks | `webwaka-ai-platform` | Keeps AI modular, vendor-neutral, and centrally governable. |
| Vertical-specific website connectors and marketplace connectors | Existing vertical repos + minimal shared contracts | Keeps domain logic close to the domain systems (e.g., Commerce POS, Transport ticketing). |
| Cross-repo event wiring and rollout sequencing | Manus-owned coordination layer/process | Replit agents do not handle cross-repo operations. Manus orchestrates the multi-repo deployment. |

## Code Migration and Refactoring Strategy

### What Code Should Move

1.  **Fragmented AI Implementations:** The redundant `getAICompletion()` functions currently residing in `webwaka-fintech/src/core/ai.ts`, `webwaka-institutional/src/core/ai.ts`, `webwaka-services/src/core/ai.ts`, and `webwaka-production/src/core/ai.ts` must be deprecated and removed.
2.  **Hardcoded Branding Logic:** The `StorefrontBranding` interface and related logic currently embedded within `webwaka-commerce/src/core/tenant/index.ts` must be extracted.

### What Code Should Be Extracted into `@webwaka/core`

1.  **Unified Branding Schema:** A canonical `TenantBrandingSchema` must be defined in `@webwaka/core` to replace the fragmented implementations in Commerce and Super Admin V2.
2.  **AI Entitlement Helpers:** Middleware and utility functions for verifying tenant and user-level AI entitlements must be added to `@webwaka/core/auth` or a new `@webwaka/core/entitlements` module.
3.  **Template Engine Contracts:** Shared interfaces defining the structure of UI templates, components, and deployment payloads must be established in `@webwaka/core/ui` (or similar) to ensure consistency between the `webwaka-ui-builder` and the vertical consumers.
4.  **Canonical Event Schemas:** The `WebWakaEvent<T>` schema in `@webwaka/core/events` must be expanded to include new event types for UI deployment (`ui.deployment.started`, `ui.deployment.completed`) and AI usage (`ai.usage.recorded`).

### What Existing Code Should Remain Where

1.  **Vertical Domain Logic:** Core business logic within existing verticals (e.g., POS transactions in Commerce, seat inventory in Transport, parcel tracking in Logistics) remains untouched. These verticals will consume the new UI and AI capabilities via the shared contracts and event bus.
2.  **Central Management Ledger:** The immutable double-entry ledger in `webwaka-central-mgmt` remains the source of truth for billing. It will be updated to consume the new `ai.usage.recorded` events.

## Contracts, Events, and APIs to be Created

1.  **UI Builder API (`webwaka-ui-builder`):**
    *   `GET /templates`: Retrieve available templates by category/vertical.
    *   `POST /deployments`: Initiate a new website/dashboard deployment for a tenant.
    *   `GET /deployments/:id`: Check deployment status.
2.  **AI Platform API (`webwaka-ai-platform`):**
    *   `GET /capabilities`: List available AI features.
    *   `POST /completions`: Execute an AI request (validating entitlements and routing to the appropriate provider).
    *   `PUT /tenant/:id/keys`: Manage BYOK credentials.
3.  **New Event Contracts (`@webwaka/core/events`):**
    *   `ui.template.published`
    *   `ui.deployment.requested`
    *   `ui.deployment.success`
    *   `ui.deployment.failed`
    *   `ai.capability.enabled`
    *   `ai.usage.recorded` (consumed by `webwaka-central-mgmt` for billing)

## Backward Compatibility and Migration Strategy

1.  **Event Schema Migration:** Before implementing the new enhancements, a mandatory refactoring phase must standardize all existing repositories (Civic, Professional, Logistics) to use the canonical `WebWakaEvent<T>` schema defined in `@webwaka/core/events`. This ensures the event bus can reliably route the new UI and AI events.
2.  **AI Deprecation:** The existing `AIEngine` in `@webwaka/core` (v1.5.0) will be maintained for backward compatibility during the transition. Vertical repositories will be incrementally updated to route requests through the new `webwaka-ai-platform` API. Once all verticals are migrated, the legacy `AIEngine` in core will be marked as deprecated and eventually removed.
3.  **Branding Migration:** Existing tenant branding configurations in KV (e.g., `StorefrontBranding` in Commerce) will be mapped to the new canonical `TenantBrandingSchema` via a one-time data migration script executed by the Super Admin V2 worker.

## Ownership Model

*   **Manus (Cross-Repo Orchestration):** Responsible for defining the shared contracts in `@webwaka/core`, orchestrating the event schema migration across all repositories, provisioning the new `webwaka-ui-builder` and `webwaka-ai-platform` repositories, and managing the overall deployment sequence.
*   **Replit Agents (Repo-Local Implementation):** Responsible for implementing the specific API routes, database schemas, and UI components within the individual repositories (`webwaka-ui-builder`, `webwaka-ai-platform`, and the affected vertical suites), strictly adhering to the prompts generated by Manus.
