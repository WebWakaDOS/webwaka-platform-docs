# `webwaka-ai-platform` Deployment Guide

**Version:** v4.x  
**Last Updated:** 2026-04-06  
**Owner:** AI Platform Team  
**Status:** Production Ready  
**ADR Reference:** ADR-003 — Vendor-Neutral AI Routing

---

## Overview

`webwaka-ai-platform` is the centralized, vendor-neutral AI capability registry for the entire WebWaka OS v4 ecosystem. It provides a single routing layer over multiple AI providers (OpenRouter, Cloudflare AI) so that no vertical repo calls a provider SDK directly.

**Core responsibilities:**
- Route AI completion requests to the optimal provider via OpenRouter
- Enforce per-tenant AI entitlements and usage quotas
- Manage Bring Your Own Key (BYOK) tenant configurations
- Emit usage billing events to `webwaka-central-mgmt`
- Provide the `@webwaka/core` AI primitives consumed by all other repos

> **Anti-Drift Rule:** No other WebWaka repository may import OpenAI, Anthropic, or any other provider SDK directly. All AI requests must route through this platform.

---

## Architecture

```
Requesting Vertical (e.g., webwaka-commerce)
  ↓ calls @webwaka/core AI primitive
  ↓ HTTP POST /v4/ai/completions  (authenticated with tenant JWT)
webwaka-ai-platform Worker (Cloudflare)
  ↓ Validate JWT + check tenant AI entitlement (KV lookup)
  ↓ Resolve BYOK key OR use platform OpenRouter key
  ↓ Route request to OpenRouter OR Cloudflare AI (based on model)
  ↓ Stream / return response to caller
  ↓ Emit usage.billed event → webwaka-central-mgmt (event bus)
```

### Provider Routing Logic

| Model Prefix | Provider | Notes |
|---|---|---|
| `openai/*`, `anthropic/*`, `meta-llama/*` | OpenRouter | Default multi-model routing |
| `@cf/*` | Cloudflare AI | Cloudflare Workers AI models |
| `byok:*` | Tenant's own key | BYOK mode; tenant provides credentials |

---

## Prerequisites

Before deploying, ensure the following are in place:

- [ ] Cloudflare account with Workers, KV, and D1 access
- [ ] OpenRouter account and platform API key (`OPENROUTER_API_KEY`)
- [ ] `webwaka-core` deployed and reachable (JWT validation dependency)
- [ ] `webwaka-central-mgmt` event bus endpoint configured (`CENTRAL_MGMT_EVENTS_URL`)
- [ ] Node.js 20+ and Wrangler CLI v3+ installed locally
- [ ] Access to the `webwaka-ai-platform` repository

---

## Environment Variables

Set these in Cloudflare's Workers secrets manager (never in plaintext `.env` in production):

```bash
# Required
OPENROUTER_API_KEY=sk-or-...          # Platform-level OpenRouter key
WEBWAKA_CORE_JWT_SECRET=...           # Shared secret for JWT validation (from webwaka-core)
CENTRAL_MGMT_EVENTS_URL=https://...  # webwaka-central-mgmt event ingest endpoint
CENTRAL_MGMT_API_KEY=...             # Auth key for the event bus

# Optional — BYOK
BYOK_ENCRYPTION_KEY=...              # AES-256 key for encrypting stored BYOK secrets

# Environment flags
ENVIRONMENT=production               # "production" | "staging" | "development"
AI_REQUEST_TIMEOUT_MS=30000          # Default: 30000
MAX_TOKENS_HARD_LIMIT=8192           # Safety ceiling across all tenants
```

### KV Namespace Bindings (`wrangler.toml`)

```toml
[[kv_namespaces]]
binding = "AI_TENANT_CONFIG"
id = "<KV_NAMESPACE_ID>"             # Stores per-tenant entitlements and BYOK refs

[[kv_namespaces]]
binding = "AI_USAGE_CACHE"
id = "<KV_NAMESPACE_ID>"             # Short-lived usage counters (TTL: 60s)
```

---

## Local Development Setup

```bash
git clone https://github.com/webwaka-os/webwaka-ai-platform.git
cd webwaka-ai-platform
npm install

# Copy env template
cp .dev.vars.example .dev.vars
# Fill in OPENROUTER_API_KEY and other required vars

# Start local Wrangler dev server
npx wrangler dev --local
```

The local server will be available at `http://localhost:8787`.

> **Note:** BYOK encryption and the central-mgmt event bus are disabled in local development by default. Set `ENVIRONMENT=staging` in `.dev.vars` to enable full integration testing.

---

## Configuration: Tenant AI Entitlements

Tenant entitlements are stored in the `AI_TENANT_CONFIG` KV namespace under the key `ai:entitlement:{tenantId}`.

### Entitlement Schema

```json
{
  "tenantId": "tenant_abc123",
  "plan": "pro",
  "allowedModels": [
    "openai/gpt-4o-mini",
    "anthropic/claude-haiku",
    "@cf/meta/llama-3.1-8b-instruct"
  ],
  "monthlyTokenBudget": 5000000,
  "tokensUsedThisCycle": 123456,
  "byok": {
    "enabled": false,
    "encryptedKey": null,
    "provider": null
  },
  "rateLimitRpm": 60,
  "updatedAt": "2026-04-01T00:00:00Z"
}
```

### Setting an Entitlement (via Super Admin API)

Entitlements are managed by `webwaka-super-admin-v2`. Do not edit KV directly in production. Use the Super Admin API:

```bash
POST https://admin-api.webwaka.io/v4/tenants/{tenantId}/ai-entitlement
Authorization: Bearer <super-admin-jwt>
Content-Type: application/json

{
  "plan": "pro",
  "allowedModels": ["openai/gpt-4o-mini"],
  "monthlyTokenBudget": 5000000,
  "rateLimitRpm": 60
}
```

---

## BYOK (Bring Your Own Key) Configuration

Enterprise tenants may provide their own OpenAI or Anthropic API keys. BYOK keys are encrypted at rest using AES-256 and stored in the `AI_TENANT_CONFIG` KV namespace.

### Enabling BYOK for a Tenant

```bash
POST https://ai-api.webwaka.io/v4/ai/byok
Authorization: Bearer <tenant-jwt>
Content-Type: application/json

{
  "provider": "openai",
  "apiKey": "sk-..."
}
```

The platform will:
1. Validate the key against the provider (a test request is made)
2. Encrypt the key with `BYOK_ENCRYPTION_KEY`
3. Store the encrypted value in KV
4. Set `byok.enabled: true` in the tenant entitlement record

### BYOK Request Routing

When `byok.enabled` is `true`, the platform decrypts the tenant key at request time and uses it for all AI calls from that tenant. The platform key is never used for BYOK tenants.

> **Security note:** BYOK keys are decrypted only within the Worker execution context and are never logged or returned in API responses.

---

## Deployment Steps

### 1. Staging Deployment

```bash
# Deploy to staging
npx wrangler deploy --env staging

# Verify health
curl https://staging-ai-api.webwaka.io/v4/ai/health
# Expected: { "status": "ok", "provider": "openrouter", "environment": "staging" }
```

### 2. Run Integration Tests

```bash
npm run test:integration
```

All integration tests must pass before promoting to production.

### 3. Production Deployment

```bash
# Deploy to production
npx wrangler deploy --env production

# Verify health
curl https://ai-api.webwaka.io/v4/ai/health
```

### 4. Smoke Test

After deployment, run the smoke test suite which validates:
- JWT validation is working
- OpenRouter routing returns a valid response
- Cloudflare AI routing returns a valid response
- Usage events are being emitted to central-mgmt
- Rate limiting is active

```bash
npm run test:smoke -- --env production
```

---

## Monitoring

### Key Metrics to Watch

| Metric | Alert Threshold | Dashboard |
|---|---|---|
| Request error rate | > 1% over 5 min | Cloudflare Analytics |
| P95 latency | > 5000ms | Cloudflare Analytics |
| OpenRouter API errors | > 0.5% | OpenRouter Dashboard |
| Token budget breaches (tenant) | Any | Super Admin Dashboard |
| BYOK decryption failures | Any | Worker Logs |

### Logs

All requests are logged to Cloudflare Workers Logs. Filter by:

```
# Error logs
level:error

# BYOK activity
message:"byok"

# Usage billing events
message:"usage.billed"
```

### Alerting

Configure Cloudflare Notifications for:
- Worker error rate spike
- CPU time limit exceeded
- Subrequest failures (OpenRouter unreachable)

---

## API Reference

### `POST /v4/ai/completions`

Route a completion request through the platform.

**Request:**
```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [
    { "role": "user", "content": "Summarise this invoice in Yoruba." }
  ],
  "max_tokens": 512,
  "stream": false
}
```

**Response:**
```json
{
  "id": "cmpl_abc123",
  "model": "openai/gpt-4o-mini",
  "provider": "openrouter",
  "choices": [
    {
      "message": { "role": "assistant", "content": "..." },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 42,
    "completion_tokens": 128,
    "total_tokens": 170
  }
}
```

**Error Codes:**

| Code | Meaning |
|---|---|
| `AI_001` | Tenant not entitled to requested model |
| `AI_002` | Monthly token budget exceeded |
| `AI_003` | Rate limit exceeded (RPM) |
| `AI_004` | Provider upstream error |
| `AI_005` | BYOK key invalid or expired |

### `GET /v4/ai/health`

Returns platform health status. No authentication required.

### `GET /v4/ai/models`

Returns the list of models available to the authenticated tenant.

### `POST /v4/ai/byok`

Configure BYOK for the authenticated tenant. See BYOK section above.

---

## Troubleshooting

### "AI_001: Model not allowed for tenant"

The tenant's entitlement does not include the requested model. Update the entitlement via the Super Admin API or instruct the tenant to use an allowed model.

### "AI_003: Rate limit exceeded"

The tenant has exceeded their RPM limit. This resets after 60 seconds. If persistent, increase the `rateLimitRpm` in the entitlement configuration or upgrade the tenant's plan.

### "AI_004: Provider upstream error"

OpenRouter or Cloudflare AI returned an error. Check the respective provider status pages:
- OpenRouter: https://openrouter.ai/status
- Cloudflare: https://www.cloudflarestatus.com

If OpenRouter is down, the platform has no automatic failover (by design — vendor neutrality requires explicit configuration). Raise an incident and communicate to affected tenants.

### "AI_005: BYOK key invalid"

The tenant's stored BYOK key has been revoked or expired at the provider level. Ask the tenant to re-register their key via `POST /v4/ai/byok`.

### Worker CPU Limit Exceeded

This should not occur under normal load. If it does:
1. Check for an unusually large payload (max token response)
2. Verify streaming is enabled for long-generation requests
3. Check if multiple concurrent requests are hitting the same Worker isolate

---

## Related Documentation

- [ADR-003: Vendor-Neutral AI Routing](../adrs/ADR-003-vendor-neutral-ai.md)
- [SDK Docs — AI Integration](../sdk-docs.md)
- [Error Codes Reference](../error-codes.md)
- [Security & Compliance](../security-compliance.md)
