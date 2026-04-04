# ADR-003: Vendor-Neutral AI via CORE-5 Abstraction Layer

**Status:** Accepted  
**Date:** 2025-12-05  
**Deciders:** AI Platform Team  
**Blueprint Reference:** Part 9.5 — CORE-5 AI Abstraction

---

## Context

The AI landscape is evolving rapidly. Hardcoding OpenAI or Anthropic into platform code creates vendor lock-in, exposes us to pricing changes, and makes it impossible to use locally-hosted models where API costs are prohibitive for Nigerian SMEs.

## Decision

All AI features in WebWaka OS v4 will call the **CORE-5 abstraction layer** — a thin, unified interface that routes prompts to the best available model based on cost, latency, and availability.

### CORE-5 Interface

```typescript
interface AIProvider {
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
  embed(text: string): Promise<number[]>;
  classify(text: string, labels: string[]): Promise<ClassificationResult>;
}

interface AICompletionRequest {
  prompt: string;
  context?: Record<string, unknown>;
  language?: 'en' | 'yo' | 'ig' | 'ha' | 'fr' | 'sw' | 'ar';
  maxTokens?: number;
  temperature?: number;
}
```

### Provider Routing Logic

```
CORE-5 Request
  ↓
1. Check OpenRouter availability (health check)
  ├─ Available → Route to OpenRouter (cost-optimised model selection)
  └─ Unavailable
     ↓
2. Check local Llama-3 instance
  ├─ Available → Route to local Llama-3 (no cost)
  └─ Unavailable → Return WW_AI_001 error
```

### Model Selection Matrix (OpenRouter)

| Use Case | Model | Cost/1K tokens |
|----------|-------|---------------|
| Short completions (<256 tokens) | `mistral-7b` | $0.0001 |
| Long-form content | `llama-3-70b` | $0.0009 |
| Code generation | `deepseek-coder` | $0.0002 |
| Nigerian language (yo/ig/ha) | `llama-3-70b` | $0.0009 |

### Prohibited Patterns

```typescript
// ❌ NEVER — violates Invariant 7
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// ✅ CORRECT — always through CORE-5
import { core5 } from '@webwaka/core';
const result = await core5.ai.complete({ prompt: '...' });
```

## Consequences

**Positive:**
- Provider changes require zero application code changes
- Local Llama-3 fallback eliminates AI costs during OpenRouter outages
- Support for Nigerian languages (Yoruba, Igbo, Hausa) abstracted uniformly
- Cost tracking and optimisation centralised in CORE-5

**Negative:**
- CORE-5 adds ~20ms latency overhead per request
- Local Llama-3 requires dedicated GPU inference server (cost: ~$200/month)
- Abstraction layer must be kept up to date as provider APIs evolve

## Alternatives Considered

1. **Direct OpenAI SDK** — Creates vendor lock-in; violates Invariant 7; rejected
2. **LangChain** — Too large a dependency; abstraction sufficient for our use cases; rejected
3. **Provider-specific SDKs per module** — No centralised cost control; rejected
