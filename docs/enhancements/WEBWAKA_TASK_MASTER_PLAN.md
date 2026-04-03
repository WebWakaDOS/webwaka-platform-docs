# WEBWAKA TASK MASTER PLAN

## Overview

This document serves as the master execution plan for the WebWaka platform enhancements. It breaks down the architectural proposals into actionable, trackable tasks formatted specifically for the WebWaka OS v4 parallel implementation factory. 

These tasks are designed to be appended to the global `queue.json` in the `webwaka-platform-status` repository, allowing autonomous worker nodes (Replit agents) to claim and execute them sequentially.

## Task Card Format

Each task adheres to the required factory format:

```json
{
  "id": "TASK-ID",
  "title": "Task Title",
  "repo": "target-repository",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["PREV-TASK-ID"],
  "description": "Detailed description of the work to be performed.",
  "acceptance_criteria": [
    "Criterion 1",
    "Criterion 2"
  ]
}
```

## Phase 1: Foundation and Contracts

### Task: CORE-9
```json
{
  "id": "CORE-9",
  "title": "Define Canonical Event Schemas for UI and AI",
  "repo": "webwaka-core",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": [],
  "description": "Expand the WebWakaEvent<T> schema in src/core/events/index.ts to include new event types: ui.deployment.requested, ui.deployment.success, ui.deployment.failed, ai.capability.enabled, and ai.usage.recorded. Ensure strict TypeScript typing for all payloads.",
  "acceptance_criteria": [
    "New event types are exported from the index.",
    "TypeScript strict mode passes.",
    "Unit tests verify the schema shapes."
  ]
}
```

### Task: CORE-10
```json
{
  "id": "CORE-10",
  "title": "Define Tenant Branding Schema",
  "repo": "webwaka-core",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["CORE-9"],
  "description": "Create src/core/ui/branding.ts defining the TenantBrandingSchema interface. This schema must accommodate the existing fields used in webwaka-commerce (StorefrontBranding) and webwaka-super-admin-v2 (theme).",
  "acceptance_criteria": [
    "TenantBrandingSchema interface is exported.",
    "Schema includes colors, typography, assets, and layout configurations.",
    "Unit tests verify the schema shape."
  ]
}
```

### Task: CORE-11
```json
{
  "id": "CORE-11",
  "title": "Publish @webwaka/core v1.6.0",
  "repo": "webwaka-core",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["CORE-10"],
  "description": "Bump the version in package.json to 1.6.0 and trigger the publish.yml GitHub Action to release the new contracts to the private npm registry.",
  "acceptance_criteria": [
    "Version is bumped to 1.6.0.",
    "GitHub Action completes successfully.",
    "Package is available in the private registry."
  ]
}
```

## Phase 2: Event Schema Migration

### Task: CIV-4
```json
{
  "id": "CIV-4",
  "title": "Migrate Civic Event Bus to Canonical Schema",
  "repo": "webwaka-civic",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["CORE-11"],
  "description": "Update src/core/event-bus.ts to use the WebWakaEvent<T> schema from @webwaka/core v1.6.0. Update all event publishers in the Civic modules to conform to the new schema.",
  "acceptance_criteria": [
    "CivicEvent type is replaced by WebWakaEvent<T>.",
    "All event publishers are updated.",
    "Integration tests verify events are correctly formatted before being written to the D1 outbox."
  ]
}
```

### Task: PRO-4
```json
{
  "id": "PRO-4",
  "title": "Migrate Professional Event Bus to Canonical Schema",
  "repo": "webwaka-professional",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["CORE-11"],
  "description": "Update src/core/event-bus/index.ts to use the WebWakaEvent<T> schema from @webwaka/core v1.6.0. Update all event publishers in the Professional modules to conform to the new schema.",
  "acceptance_criteria": [
    "PlatformEvent type is replaced by WebWakaEvent<T>.",
    "All event publishers are updated.",
    "Integration tests verify events are correctly formatted before being written to the D1 outbox."
  ]
}
```

### Task: LOG-4
```json
{
  "id": "LOG-4",
  "title": "Migrate Logistics Event Queue to Canonical Schema",
  "repo": "webwaka-logistics",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["CORE-11"],
  "description": "Update the KV-based event queue publisher in src/worker.ts to enforce the WebWakaEvent<T> schema from @webwaka/core v1.6.0.",
  "acceptance_criteria": [
    "Event queue publisher enforces WebWakaEvent<T>.",
    "Integration tests verify events are correctly formatted before being written to KV."
  ]
}
```

## Phase 3: AI Platform Implementation

### Task: AIP-1
```json
{
  "id": "AIP-1",
  "title": "Provision webwaka-ai-platform Repository",
  "repo": "webwaka-ai-platform",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["CORE-11"],
  "description": "Initialize the repository with the standard Hono/Cloudflare Workers scaffold. Configure wrangler.toml with D1 (webwaka-ai-db) and KV (AI_ENTITLEMENTS_KV, TENANT_SECRETS_KV).",
  "acceptance_criteria": [
    "Repository is initialized.",
    "wrangler.toml is configured with D1 and KV bindings.",
    "CI/CD workflows are set up."
  ]
}
```

### Task: AIP-2
```json
{
  "id": "AIP-2",
  "title": "Implement AI Core API",
  "repo": "webwaka-ai-platform",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["AIP-1"],
  "description": "Migrate the AIEngine logic from @webwaka/core into the new repository. Implement the POST /completions endpoint with OpenRouter and CF Workers AI fallback. Implement the BYOK routing logic.",
  "acceptance_criteria": [
    "POST /completions endpoint is implemented.",
    "OpenRouter and CF Workers AI fallback logic is functional.",
    "BYOK routing logic is functional.",
    "Unit tests (mocking OpenRouter) and Integration tests (verifying CF fallback) pass."
  ]
}
```

### Task: FIN-6
```json
{
  "id": "FIN-6",
  "title": "Refactor Fintech AI Consumers",
  "repo": "webwaka-fintech",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["AIP-2"],
  "description": "Delete the local src/core/ai.ts file. Update all AI calls to use the new webwaka-ai-platform API endpoint via inter-service HTTP requests (secured by INTER_SERVICE_SECRET).",
  "acceptance_criteria": [
    "Local src/core/ai.ts is deleted.",
    "All AI calls use the webwaka-ai-platform API.",
    "E2E tests verify AI features still function correctly."
  ]
}
```

### Task: INS-4
```json
{
  "id": "INS-4",
  "title": "Refactor Institutional AI Consumers",
  "repo": "webwaka-institutional",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["AIP-2"],
  "description": "Delete the local src/core/ai.ts file. Update all AI calls to use the new webwaka-ai-platform API endpoint via inter-service HTTP requests (secured by INTER_SERVICE_SECRET).",
  "acceptance_criteria": [
    "Local src/core/ai.ts is deleted.",
    "All AI calls use the webwaka-ai-platform API.",
    "E2E tests verify AI features still function correctly."
  ]
}
```

### Task: SRV-4
```json
{
  "id": "SRV-4",
  "title": "Refactor Services AI Consumers",
  "repo": "webwaka-services",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["AIP-2"],
  "description": "Delete the local src/core/ai.ts file. Update all AI calls to use the new webwaka-ai-platform API endpoint via inter-service HTTP requests (secured by INTER_SERVICE_SECRET).",
  "acceptance_criteria": [
    "Local src/core/ai.ts is deleted.",
    "All AI calls use the webwaka-ai-platform API.",
    "E2E tests verify AI features still function correctly."
  ]
}
```

### Task: PRD-4
```json
{
  "id": "PRD-4",
  "title": "Refactor Production AI Consumers",
  "repo": "webwaka-production",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["AIP-2"],
  "description": "Delete the local src/core/ai.ts file. Update all AI calls to use the new webwaka-ai-platform API endpoint via inter-service HTTP requests (secured by INTER_SERVICE_SECRET).",
  "acceptance_criteria": [
    "Local src/core/ai.ts is deleted.",
    "All AI calls use the webwaka-ai-platform API.",
    "E2E tests verify AI features still function correctly."
  ]
}
```

### Task: CEN-1
```json
{
  "id": "CEN-1",
  "title": "Implement AI Usage Billing Hook",
  "repo": "webwaka-central-mgmt",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["AIP-2"],
  "description": "Update the ledger consumer to listen for ai.usage.recorded events and debit the corresponding tenant's quota/balance.",
  "acceptance_criteria": [
    "Ledger consumer listens for ai.usage.recorded events.",
    "Tenant's quota/balance is debited correctly.",
    "Integration tests verify the double-entry ledger updates correctly upon receiving the event."
  ]
}
```

## Phase 4: UI Builder Implementation

### Task: UIB-1
```json
{
  "id": "UIB-1",
  "title": "Provision webwaka-ui-builder Repository",
  "repo": "webwaka-ui-builder",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["CORE-11"],
  "description": "Initialize the repository. Configure wrangler.toml with D1 (webwaka-ui-db) and KV (UI_CONFIG_KV).",
  "acceptance_criteria": [
    "Repository is initialized.",
    "wrangler.toml is configured with D1 and KV bindings.",
    "CI/CD workflows are set up."
  ]
}
```

### Task: UIB-2
```json
{
  "id": "UIB-2",
  "title": "Implement Deployment Orchestrator",
  "repo": "webwaka-ui-builder",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["UIB-1"],
  "description": "Implement the Cloudflare Worker that listens for ui.deployment.requested events and interacts with the Cloudflare Pages API to provision and deploy tenant sites.",
  "acceptance_criteria": [
    "Cloudflare Worker listens for ui.deployment.requested events.",
    "Worker interacts with Cloudflare Pages API to provision and deploy sites.",
    "Integration tests (mocking Cloudflare Pages API) pass."
  ]
}
```

### Task: UIB-3
```json
{
  "id": "UIB-3",
  "title": "Build Initial Commerce Templates",
  "repo": "webwaka-ui-builder",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["UIB-2"],
  "description": "Create the 'Retail Storefront' template schema and component library. Ensure components use the TenantBrandingSchema from @webwaka/core.",
  "acceptance_criteria": [
    "'Retail Storefront' template schema is created.",
    "Component library is created.",
    "Components use TenantBrandingSchema."
  ]
}
```

### Task: COM-5
```json
{
  "id": "COM-5",
  "title": "Refactor Commerce Branding",
  "repo": "webwaka-commerce",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["UIB-3"],
  "description": "Deprecate the local StorefrontBranding interface. Update the Commerce API to read branding configuration from the central UI_CONFIG_KV (populated by the UI Builder) instead of its local D1 database.",
  "acceptance_criteria": [
    "Local StorefrontBranding interface is deprecated.",
    "Commerce API reads branding configuration from UI_CONFIG_KV.",
    "E2E tests verify Commerce POS and existing storefronts render correctly using centralized branding data."
  ]
}
```

### Task: SUP-1
```json
{
  "id": "SUP-1",
  "title": "Integrate Builder Admin",
  "repo": "webwaka-super-admin-v2",
  "status": "PENDING",
  "assigned_to": null,
  "progress_percentage": 0,
  "dependencies": ["UIB-3"],
  "description": "Add the UI Builder control plane to the Super Admin dashboard, allowing Tenant Admins to select the 'Retail Storefront' template and trigger a deployment.",
  "acceptance_criteria": [
    "UI Builder control plane is added to Super Admin dashboard.",
    "Tenant Admins can select templates and trigger deployments.",
    "Acceptance tests verify a tenant can successfully deploy a branded storefront that connects to their Commerce POS backend."
  ]
}
```
