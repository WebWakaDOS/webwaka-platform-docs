# WebWaka AI Platform (`webwaka-ai-platform`) Implementation Plan

**Prepared by:** Manus AI
**Date:** April 2026
**Target Repository:** `webwaka-ai-platform`

## 1. Executive Summary

`webwaka-ai-platform` is the centralized AI routing and governance service for the WebWaka ecosystem. It abstracts LLM provider complexity (OpenRouter, Cloudflare AI), enforces tenant entitlements, manages Bring-Your-Own-Key (BYOK) configurations, and emits usage events for centralized billing. This plan details the next phase of enhancements to support advanced routing, caching, and compliance.

## 2. Current State vs. Target State

**Current State:**
- Basic routing to OpenRouter with Cloudflare AI fallback.
- Entitlement checks via D1.
- Usage event emission (`ai.usage.recorded`).
- BYOK support via `TENANT_SECRETS_KV`.

**Target State:**
- Semantic caching to reduce API costs and latency.
- PII redaction middleware for NDPR compliance.
- Dynamic model routing based on task complexity and cost constraints.
- Streaming response support for long-running generations.

## 3. Enhancement Backlog (Top 20)

1. **Semantic Caching:** Cache identical or highly similar prompts using Cloudflare Vectorize.
2. **PII Redaction Middleware:** Automatically redact phone numbers, BVNs, and names before sending to external LLMs.
3. **Dynamic Model Routing:** Route simple tasks to Llama-3 (local) and complex tasks to GPT-4o based on prompt length/keywords.
4. **Streaming Responses:** Support Server-Sent Events (SSE) for real-time UI updates.
5. **Prompt Injection Defense:** Pre-filter prompts to detect and block jailbreak attempts.
6. **Tenant-Specific Fine-Tuning:** Support routing to tenant-specific LoRA adapters on Cloudflare AI.
7. **Usage Hard Caps:** Reject requests instantly if a tenant exceeds their monthly hard cap (before billing sync).
8. **Cost Allocation Tags:** Allow vertical suites to tag requests (e.g., `module:pos`) for granular billing.
9. **Fallback Retry Jitter:** Implement exponential backoff with jitter for OpenRouter 429 errors.
10. **Custom System Prompts:** Allow tenants to define their own default system prompts via KV.
11. **Audio Transcription Routing:** Add support for routing audio files to Whisper models.
12. **Image Generation Routing:** Add support for routing to Stable Diffusion / Midjourney.
13. **Embeddings API:** Expose a dedicated endpoint for generating text embeddings.
14. **Toxicity Filtering:** Post-filter LLM responses to ensure brand safety.
15. **Latency Telemetry:** Log detailed latency metrics (TTFT, total time) per provider.
16. **BYOK Key Validation:** Automatically validate tenant-provided API keys before saving them.
17. **Batch Processing API:** Support asynchronous batch processing for bulk data extraction.
18. **Context Window Management:** Automatically truncate or summarize prompts that exceed model limits.
19. **Multi-Modal Support:** Support image inputs for vision models (e.g., receipt OCR).
20. **Audit Log Export:** Provide an API for tenants to export their AI interaction history.

## 4. Execution Phases

### Phase 1: Compliance & Security
- Implement PII Redaction Middleware.
- Implement Prompt Injection Defense.

### Phase 2: Performance & Cost Optimization
- Implement Semantic Caching using Cloudflare Vectorize.
- Implement Dynamic Model Routing.

### Phase 3: Advanced Capabilities
- Add Streaming Responses (SSE).
- Add Multi-Modal (Vision) Support.

## 5. Replit Execution Prompts

**Prompt 1: PII Redaction Middleware**
```text
You are the Replit execution agent for `webwaka-ai-platform`.
Task: Implement PII Redaction Middleware.
1. Create `src/middleware/redaction.ts`.
2. Implement regex-based redaction for Nigerian phone numbers, BVNs, and email addresses.
3. Apply the middleware to the `POST /v1/completions` route in `src/routes/completions.ts`.
4. Add unit tests in `src/middleware/redaction.test.ts`.
```

**Prompt 2: Semantic Caching**
```text
You are the Replit execution agent for `webwaka-ai-platform`.
Task: Implement Semantic Caching.
1. Update `wrangler.toml` to include a Cloudflare Vectorize binding (`VECTORIZE_INDEX`).
2. Create `src/services/cache.ts`.
3. Implement logic to generate an embedding for the prompt and query Vectorize for similar past prompts (threshold > 0.95).
4. If a match is found, return the cached response; otherwise, proceed to the LLM and cache the result.
```
