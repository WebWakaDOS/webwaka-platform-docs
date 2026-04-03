# WEBWAKA AI PLATFORM ARCHITECTURE

## AI Platform Boundaries

The WebWaka AI Platform (`webwaka-ai-platform`) is a dedicated, bounded repository designed to centralize and govern all artificial intelligence capabilities across the WebWaka ecosystem. It replaces the fragmented, per-repository AI implementations currently found in `webwaka-fintech`, `webwaka-institutional`, `webwaka-services`, and `webwaka-production`. 

By establishing a unified control plane, this platform enforces the "Vendor Neutral AI" invariant, ensuring that all AI requests are routed through a central abstraction layer (OpenRouter with Cloudflare Workers AI fallback) while providing Super Admins with granular control over feature enablement, billing, and security.

## AI Capability Registry

The platform introduces a centralized registry of AI capabilities. Instead of vertical repositories implementing raw LLM prompts, they subscribe to predefined, governed capabilities.

*   **Capability Schema:** Defines the feature ID, description, required inputs, expected outputs, and default model routing.
*   **Examples:**
    *   `ai.commerce.product_description_generator`
    *   `ai.professional.invoice_parser`
    *   `ai.transport.route_optimizer`
    *   `ai.logistics.support_chatbot`
*   **Storage:** Capabilities are defined in code within `webwaka-ai-platform` and synced to Cloudflare KV (`AI_CAPABILITIES_KV`) for low-latency edge resolution.

## Entitlement and Enablement Model

AI features are not universally available; they are governed by a strict entitlement model managed by the Super Admin.

1.  **Super Admin Controls:** The Super Admin (via `webwaka-super-admin-v2`) can globally enable or disable specific AI capabilities across the entire platform or for specific vertical suites.
2.  **Tenant Enablement:** Super Admins can provision specific AI capabilities to individual tenants based on their subscription tier (e.g., "Premium" tenants get access to `ai.professional.invoice_parser`).
3.  **Role/User Exposure:** Tenant Admins can further restrict AI feature access to specific RBAC roles within their organization (e.g., only "Managers" can use the `ai.commerce.product_description_generator`).
4.  **Enforcement:** The `webwaka-ai-platform` API validates these entitlements (stored in `AI_ENTITLEMENTS_KV`) before processing any request.

## BYOK (Bring-Your-Own-Key) Model

To support cost optimization and tenant autonomy, the platform implements a secure BYOK flow:

1.  **Tenant Configuration:** Tenant Admins can securely input their own OpenRouter (or specific provider) API keys via their management dashboard.
2.  **Secure Storage:** Keys are encrypted at rest and stored in Cloudflare KV (`TENANT_SECRETS_KV`), accessible only by the `webwaka-ai-platform` worker.
3.  **Routing Logic:** When an AI request is received, the platform first checks for a valid tenant-provided key. If present, the request is routed using the tenant's key (and billed to the tenant directly by the provider). If absent, the request falls back to the platform's central key (and usage is metered for internal billing).

## Provider Abstraction Model

The platform strictly enforces the "Vendor Neutral AI" invariant by abstracting all underlying LLM providers.

1.  **Primary Routing (OpenRouter):** All requests are routed through OpenRouter by default, allowing dynamic model selection (e.g., `openai/gpt-4o-mini`, `anthropic/claude-3-haiku`) without changing application code.
2.  **Fallback Routing (Cloudflare Workers AI):** If OpenRouter experiences an outage or timeout, the platform automatically falls back to a locally hosted model on Cloudflare Workers AI (e.g., `@cf/meta/llama-3-8b-instruct`), ensuring offline/edge resilience.
3.  **Abstraction Interface:** Vertical applications interact only with the `webwaka-ai-platform` API, never directly with external providers.

## Prompt, Policy, and Governance Model

To ensure consistent quality and prevent prompt injection or drift, prompts are centrally managed:

1.  **Prompt Templates:** System prompts and few-shot examples for each capability are stored within the `webwaka-ai-platform` repository, not scattered across vertical codebases.
2.  **Policy Enforcement:** The platform can inject mandatory policy constraints into system prompts (e.g., "You are a helpful assistant for a Nigerian logistics company. Always use NGN currency.").
3.  **Governance Review:** Changes to prompt templates require standard PR review processes, ensuring AI behavior remains aligned with platform standards.

## Vertical Integration Model

Vertical repositories integrate with the AI Platform via standard HTTP API calls (secured by inter-service authentication) or via the Platform Event Bus for asynchronous tasks.

1.  **Synchronous (API):** A user clicks "Generate Description" in the Commerce POS. The Commerce worker calls the `webwaka-ai-platform` API (`POST /completions`), which validates entitlements, executes the prompt, and returns the result.
2.  **Asynchronous (Event Bus):** A new invoice document is uploaded in the Professional suite. The Professional worker emits a `document.uploaded` event. The `webwaka-ai-platform` consumes the event, processes the document using the `ai.professional.invoice_parser` capability, and emits an `ai.extraction.completed` event with the parsed data.

## Usage Tracking and Billing Hooks

To support the platform's economic model, all AI usage must be metered and billed.

1.  **Token Counting:** The `webwaka-ai-platform` records the prompt and completion tokens used for every request.
2.  **Event Emission:** After a successful completion, the platform emits an `ai.usage.recorded` event to the Platform Event Bus.
3.  **Ledger Integration:** The `webwaka-central-mgmt` repository consumes these events and updates the tenant's internal billing ledger, enabling usage-based invoicing or quota enforcement.

## Security, Privacy, and Compliance Model

1.  **NDPR Compliance:** The platform ensures that no Personally Identifiable Information (PII) is sent to external AI providers without explicit tenant consent (managed via the existing NDPR middleware).
2.  **Data Residency:** By utilizing Cloudflare Workers AI as a fallback, the platform can guarantee that sensitive processing occurs within specific geographic regions if required.
3.  **Tenant Isolation:** All AI requests, prompt templates, and usage records are strictly partitioned by `tenant_id`.

## Suggested Repository and Package Structure

**Repository:** `webwaka-ai-platform`

```text
webwaka-ai-platform/
├── src/
│   ├── api/                 # Hono API routes (/completions, /capabilities)
│   ├── core/
│   │   ├── engine.ts        # OpenRouter + CF Fallback logic (migrated from @webwaka/core)
│   │   ├── entitlements.ts  # Logic for checking tenant/role access
│   │   └── billing.ts       # Logic for emitting usage events
│   ├── capabilities/        # Directory containing specific AI feature definitions
│   │   ├── commerce/
│   │   ├── professional/
│   │   └── logistics/
│   └── prompts/             # Centralized prompt templates
├── migrations/              # D1 schema migrations (Capabilities, Usage Logs)
├── package.json
└── wrangler.toml
```

## MVP vs. Later Phases

### MVP (Phase 1)

*   Establish the `webwaka-ai-platform` repository and D1/KV infrastructure.
*   Migrate the existing `AIEngine` logic from `@webwaka/core` to the new repository.
*   Implement the core `/completions` API endpoint with OpenRouter and CF Fallback.
*   Implement the BYOK flow (secure credential storage and routing).
*   Implement basic usage tracking (emitting `ai.usage.recorded` events).
*   Refactor one vertical (e.g., `webwaka-fintech`) to use the new platform API instead of its local implementation.

### Later Phases (Phase 2+)

*   Implement the full AI Capability Registry and Entitlement Model (Super Admin controls).
*   Migrate all remaining vertical repositories to the new platform API.
*   Develop advanced, asynchronous AI capabilities (e.g., document parsing via the Event Bus).
*   Implement prompt versioning and A/B testing within the platform.
*   Integrate with the central ledger for automated, usage-based billing.
