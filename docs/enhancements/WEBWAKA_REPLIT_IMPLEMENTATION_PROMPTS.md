# WEBWAKA REPLIT IMPLEMENTATION PROMPTS

## Overview

This document provides the exact, copy-pasteable prompts required to initialize Replit agents for the implementation of the new WebWaka platform capabilities. These prompts are designed to be used in conjunction with the `WEBWAKA-MANUS-BOOTSTRAP.md` sequence, providing the domain-specific context needed for the agents to execute the tasks defined in the `WEBWAKA_TASK_MASTER_PLAN.md`.

## Prompt 1: UI Builder Platform Initialization

**Target Repository:** `webwaka-ui-builder` (New)
**Target Tasks:** UIB-1, UIB-2, UIB-3

**Instructions for Operator:**
1. Create a new Replit project (Node.js/TypeScript).
2. Paste the `WEBWAKA-MANUS-BOOTSTRAP.md` prompt to initialize the worker node.
3. Once the worker acknowledges, paste the following prompt to begin the UI Builder implementation.

```markdown
**ACTIVATE DOMAIN SPECIALIST: UI BUILDER PLATFORM**

You are now executing tasks UIB-1, UIB-2, and UIB-3 for the `webwaka-ui-builder` repository. Your objective is to build the core orchestration engine for the WebWaka UI Builder Platform.

### Context & Architecture:
- **Goal:** Create a tenant-aware UI composition system that deploys branded websites and dashboards to Cloudflare Pages.
- **Invariants:** Must strictly adhere to "Build Once Use Infinitely" and "Cloudflare-First Deployment".
- **Contracts:** You must consume the `TenantBrandingSchema` and `WebWakaEvent<T>` from `@webwaka/core` v1.6.0.

### Execution Steps:

1. **Scaffold (UIB-1):**
   - Initialize a Hono-based Cloudflare Worker project.
   - Configure `wrangler.toml` with a D1 database binding (`DB` -> `webwaka-ui-db`) and a KV namespace binding (`UI_CONFIG_KV`).
   - Set up the standard WebWaka ESLint and TypeScript configurations.

2. **Orchestrator (UIB-2):**
   - Implement an event consumer that listens for `ui.deployment.requested` events on the Platform Event Bus.
   - When an event is received, write a function that interacts with the Cloudflare Pages API (using a configured `CLOUDFLARE_API_TOKEN`) to provision a new project or trigger a deployment for the specified `tenant_id`.
   - Emit `ui.deployment.success` or `ui.deployment.failed` events based on the API response.

3. **Templates (UIB-3):**
   - Create a `templates/commerce-retail` directory.
   - Define a JSON schema representing the layout of a basic retail storefront.
   - Create a shared React component library (`packages/ui-primitives`) containing a Hero Section and a Product Grid. These components MUST accept branding tokens (colors, fonts) defined by the `TenantBrandingSchema`.

**Execute Step 1 now. Do not proceed to Step 2 until Step 1 is fully complete and passes static analysis.**
```

## Prompt 2: AI Platform Initialization

**Target Repository:** `webwaka-ai-platform` (New)
**Target Tasks:** AIP-1, AIP-2

**Instructions for Operator:**
1. Create a new Replit project (Node.js/TypeScript).
2. Paste the `WEBWAKA-MANUS-BOOTSTRAP.md` prompt to initialize the worker node.
3. Once the worker acknowledges, paste the following prompt to begin the AI Platform implementation.

```markdown
**ACTIVATE DOMAIN SPECIALIST: AI PLATFORM**

You are now executing tasks AIP-1 and AIP-2 for the `webwaka-ai-platform` repository. Your objective is to build the centralized, vendor-neutral AI abstraction layer for the WebWaka ecosystem.

### Context & Architecture:
- **Goal:** Centralize AI provider routing, enforce tenant entitlements, and track usage for billing.
- **Invariants:** Must strictly adhere to "Vendor Neutral AI" (CORE-5). All requests must route through OpenRouter with a Cloudflare Workers AI fallback.
- **Contracts:** You must emit `ai.usage.recorded` events using the `WebWakaEvent<T>` schema from `@webwaka/core` v1.6.0.

### Execution Steps:

1. **Scaffold (AIP-1):**
   - Initialize a Hono-based Cloudflare Worker project.
   - Configure `wrangler.toml` with a D1 database binding (`DB` -> `webwaka-ai-db`) and two KV namespace bindings (`AI_ENTITLEMENTS_KV`, `TENANT_SECRETS_KV`).
   - Set up the standard WebWaka ESLint and TypeScript configurations.

2. **Core API (AIP-2):**
   - Implement a `POST /completions` endpoint.
   - **BYOK Logic:** Before calling any provider, check `TENANT_SECRETS_KV` for a tenant-specific API key using the `tenant_id` from the JWT auth middleware.
   - **Routing Logic:** Implement the primary call to OpenRouter (`https://openrouter.ai/api/v1/chat/completions`). Wrap this in a `try/catch`. If it fails or times out, fallback to the Cloudflare Workers AI binding (`env.AI.run('@cf/meta/llama-3-8b-instruct', ...)`).
   - **Usage Tracking:** After a successful completion, calculate the total tokens used and emit an `ai.usage.recorded` event to the Platform Event Bus.

**Execute Step 1 now. Do not proceed to Step 2 until Step 1 is fully complete and passes static analysis.**
```

## Prompt 3: Core Contracts Update

**Target Repository:** `webwaka-core`
**Target Tasks:** CORE-9, CORE-10, CORE-11

**Instructions for Operator:**
1. Open the existing `webwaka-core` repository in Replit.
2. Paste the `WEBWAKA-MANUS-BOOTSTRAP.md` prompt to initialize the worker node.
3. Once the worker acknowledges, paste the following prompt.

```markdown
**ACTIVATE DOMAIN SPECIALIST: CORE PRIMITIVES**

You are now executing tasks CORE-9, CORE-10, and CORE-11 for the `webwaka-core` repository. Your objective is to establish the shared contracts required for the new UI and AI platforms.

### Context & Architecture:
- **Goal:** Define canonical schemas to prevent fragmentation across the ecosystem.
- **Invariants:** Must strictly adhere to "Build Once Use Infinitely".

### Execution Steps:

1. **Event Schemas (CORE-9):**
   - Open `src/core/events/index.ts`.
   - Add the following event types to the existing definitions: `ui.deployment.requested`, `ui.deployment.success`, `ui.deployment.failed`, `ai.capability.enabled`, and `ai.usage.recorded`.
   - Define strict TypeScript interfaces for the payloads of each of these new event types.

2. **Branding Schema (CORE-10):**
   - Create a new file: `src/core/ui/branding.ts`.
   - Define and export a `TenantBrandingSchema` interface. It must include: `tenantId` (string), `colors` (primary, secondary, accent, background, text), `typography` (headingFont, bodyFont), `assets` (logoUrl, faviconUrl, heroImageUrl optional), and `layout` (navigationStyle, footerStyle).

3. **Publish (CORE-11):**
   - Update `package.json` version to `1.6.0`.
   - Ensure all unit tests pass and `npm run build` succeeds.
   - Commit the changes with the message: `feat(core): add UI and AI platform contracts [Part 10.4]`

**Execute Step 1 now. Do not proceed to Step 2 until Step 1 is fully complete.**
```
