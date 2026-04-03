# WebWaka Cross-Repo Integration Matrix

**Date:** April 3, 2026  
**Auditor:** Manus AI  

This matrix maps the integration points between the 15 WebWakaDOS repositories following the Enhancement A and B execution.

## 1. Event Bus Integration

| Emitter | Event Type | Consumer | Payload |
| :--- | :--- | :--- | :--- |
| `webwaka-ai-platform` | `ai.usage.recorded` | `webwaka-central-mgmt` | `capabilityId`, `model`, `totalTokens`, `usedByok`, `estimatedCostUsd` |
| `webwaka-central-mgmt` | `billing.debit.recorded` | `webwaka-core` | `source`, `eventId`, `capabilityId`, `model`, `totalTokens`, `amountKobo`, `currency`, `estimatedCostUsd` |
| `webwaka-ui-builder` | `ui.deployment.started` | `webwaka-core` | `deploymentId` |
| `webwaka-ui-builder` | `ui.deployment.success` | `webwaka-core` | `deploymentId`, `deploymentUrl`, `pagesProjectName`, `cfDeploymentId`, `cfPagesUrl` |
| `webwaka-ui-builder` | `ui.deployment.failed` | `webwaka-core` | `deploymentId`, `error` |

## 2. Branding Schema Integration

| Repository | Role | Implementation |
| :--- | :--- | :--- |
| `@webwaka/core` | Definition | `TenantBrandingSchema` interface and `DEFAULT_BRANDING` constant. |
| `webwaka-ui-builder` | Enforcer | `validateBrandingFields()` utility and `requiredBrandingFields` in templates. |
| `webwaka-commerce` | Consumer | `getEffectiveBranding()` reads from `UI_CONFIG_KV` and falls back to D1. |
| `webwaka-super-admin-v2` | UI | Builder Admin page triggers deployments with branding validation. |

## 3. AI Platform Integration

| Repository | Role | Implementation |
| :--- | :--- | :--- |
| `webwaka-ai-platform` | Provider | Centralised completions API, BYOK resolution, entitlements, and usage billing. |
| `webwaka-fintech` | Consumer | `ai-platform-client.ts` delegates to `webwaka-ai-platform`. |
| `webwaka-institutional` | Consumer | `ai-platform-client.ts` delegates to `webwaka-ai-platform`. |
| `webwaka-services` | Consumer | `ai-platform-client.ts` delegates to `webwaka-ai-platform`. |
| `webwaka-production` | Consumer | `ai-platform-client.ts` delegates to `webwaka-ai-platform`. |
| `webwaka-central-mgmt` | Billing | `processAIUsageEvent()` records usage and debits quota. |

## 4. Deployment Orchestration

| Repository | Role | Implementation |
| :--- | :--- | :--- |
| `webwaka-ui-builder` | Orchestrator | `deployment.ts` triggers Cloudflare Pages API and updates D1. |
| `webwaka-super-admin-v2` | UI | Builder Admin page triggers deployments via `webwaka-ui-builder`. |
| `webwaka-core` | Event Types | `UI_DEPLOYMENT_REQUESTED`, `UI_DEPLOYMENT_SUCCESS`, `UI_DEPLOYMENT_FAILED`. |
