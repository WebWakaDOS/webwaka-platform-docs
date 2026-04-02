
# PHASE 1 PROMPTS — Foundation & Control Plane

This file contains all copy-paste implementation and QA prompts for Phase 1.

**Tasks in this phase:** T-FND-01, T-FND-02, T-FND-03, T-FND-04, T-FND-05, T-FND-06, T-FND-07

**Execution target:** Manus (cross-repo orchestration)

---

======================================================================
TASK T-FND-01 — Unify the Event Bus Schema
- Task objective: Eliminate fragmentation across Civic, Professional, and Logistics by enforcing the canonical `WebWakaEvent<T>` schema.
- Why this task exists: Divergent event structures prevent centralized SA billing and cross-repo analytics.
- Dependencies: None.
- Parallel execution notes: Can run in parallel with T-FND-02, T-FND-03, T-FND-04, T-FND-05, T-FND-06, T-FND-07.
- Execution target: Manus (cross-repo orchestration)
- Affected repos: `webwaka-core`, `webwaka-civic`, `webwaka-professional`, `webwaka-logistics`
- Required governance/docs to consult: `EVENT_BUS_SCHEMA.md`
- Acceptance criteria: All repos emit events matching the `event`, `tenantId`, `payload`, and `timestamp` schema.
- Risks / drift warnings: Suites might fail to update their local payload extraction logic, breaking downstream consumers.

PROMPT 1 — IMPLEMENTATION
```markdown
TASK ID: T-FND-01
TARGET: Manus (cross-repo orchestration)

CONTEXT:
WebWaka is an integrated multi-repo ecosystem. Currently, the event bus schema is fragmented: Civic uses `CivicEvent`, Professional uses `PlatformEvent`, and Logistics uses `EventPayload`. This prevents centralized Super Admin billing and analytics.

INVARIANTS:
- Build Once, Use Infinitely: The schema must live in `@webwaka/core/events`.
- Event-Driven Architecture: All cross-module communication must use this unified schema.
- Multi-Repo Platform Architecture: Treat each repo as a modular component of one integrated ecosystem.
- Governance-Driven Execution: No assumptions; consult governance docs for 100% compliance.
- Thoroughness Over Speed: Depth, validation, and architectural integrity are non-negotiable.

INSTRUCTIONS:
1. Deep review: Read `EVENT_BUS_SCHEMA.md` in `webwaka-platform-docs`.
2. Inspect `src/core/events/index.ts` in `webwaka-core`. Plan the changes required.
3. Update the `WebWakaEvent<T>` interface to strictly require: `event` (string), `tenantId` (string), `payload` (T), and `timestamp` (number).
4. Identify all publishers in `webwaka-civic`, `webwaka-professional`, and `webwaka-logistics` that deviate from this schema.
5. Refactor the downstream publishers to use the unified schema, mapping their legacy fields into the `payload` object where appropriate. Do not drift from this instruction.
6. Run the Vitest suites in all affected repos to ensure no typing errors remain.

OUTPUT:
Provide a summary of the files modified across the 4 repositories and confirm that the test suites pass. Format your completion statement as: "TASK T-FND-01 COMPLETE: Event bus schema unified."
```

PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX
```markdown
TASK ID: T-FND-01
TARGET: Manus (cross-repo orchestration)

CONTEXT:
The event bus schema was supposed to be unified across `webwaka-core`, `webwaka-civic`, `webwaka-professional`, and `webwaka-logistics`.

INSTRUCTIONS:
1. Understand intended behavior: All events must match the `WebWakaEvent<T>` schema defined in `EVENT_BUS_SCHEMA.md`.
2. Compare intended vs actual: Audit the codebase by searching for instances of `CivicEvent`, `PlatformEvent`, or `EventPayload` that may have been missed during the implementation phase.
3. Inspect the event consumers (subscribers) to ensure they are correctly parsing the new unified schema. Look for regressions or architecture violations.
4. FIX THE CODE DIRECTLY: If you find any omissions, regressions, bugs, or invariant violations, fix them properly. Do not merely report the issue.
5. Re-test: Re-run the test suites after applying fixes.
6. Conclude only when the task is genuinely complete.

OUTPUT:
Provide a detailed report of any bugs found and fixed. Format your completion statement as: "TASK T-FND-01 QA COMPLETE: Event bus schema verified and hardened."
```

======================================================================
TASK T-FND-02 — Synchronize SA v2 Tenant Status Enums
- Task objective: Resolve the divergence between the SQL migration and TypeScript types for tenant statuses.
- Why this task exists: Latent runtime type errors prevent reliable tenant state management.
- Dependencies: None.
- Parallel execution notes: Can run in parallel with T-FND-01, T-FND-03, T-FND-04, T-FND-05, T-FND-06, T-FND-07.
- Execution target: Replit (`webwaka-super-admin-v2`)
- Affected repos: `webwaka-super-admin-v2`
- Required governance/docs to consult: `ACTUAL_IMPLEMENTATION_AUDIT.md`
- Acceptance criteria: Vitest suite passes with the unified enum.
- Risks / drift warnings: Manual data migration might be required if production databases already contain invalid enum strings.

PROMPT 1 — IMPLEMENTATION
```markdown
TASK ID: T-FND-02
TARGET: Replit (`webwaka-super-admin-v2`)

CONTEXT:
There is a latent runtime type error in `webwaka-super-admin-v2`. The D1 SQL migration defines tenant statuses as `ACTIVE | SUSPENDED | PROVISIONING | ARCHIVED`, while the TypeScript schema defines `ACTIVE | SUSPENDED | TRIAL | CHURNED`.

INVARIANTS:
- Thoroughness Over Speed: Data consistency is non-negotiable.
- Governance-Driven Execution: No assumptions; consult governance docs for 100% compliance.

INSTRUCTIONS:
1. Deep review: Read `ACTUAL_IMPLEMENTATION_AUDIT.md` in `webwaka-super-admin-v2`.
2. Inspect the latest SQL migration file in `migrations/` and `src/schema.ts`. Plan your changes.
3. Decide on the canonical enum: `ACTIVE | SUSPENDED | TRIAL | CHURNED` is preferred based on recent product decisions.
4. Update the SQL migration (or create a new one if necessary) to enforce the chosen enum.
5. Ensure `src/schema.ts` perfectly matches the SQL definition. Do not drift from this requirement.
6. Run the Vitest suite and local D1 migrations to validate the change.

OUTPUT:
Provide the updated SQL and TS snippets. Format your completion statement as: "TASK T-FND-02 COMPLETE: Tenant status enums synchronized."
```

PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX
```markdown
TASK ID: T-FND-02
TARGET: Replit (`webwaka-super-admin-v2`)

CONTEXT:
The tenant status enums in `webwaka-super-admin-v2` were supposed to be synchronized between SQL and TypeScript.

INSTRUCTIONS:
1. Understand intended behavior: Both SQL and TS must use the exact same enum strings (`ACTIVE | SUSPENDED | TRIAL | CHURNED`).
2. Compare intended vs actual: Audit the codebase by checking the migration files, `schema.ts`, and any API handlers that validate tenant status.
3. Verify that existing tests cover status transitions. Look for regressions or bugs.
4. FIX THE CODE DIRECTLY: If you find mismatches, missing validation logic, or invariant violations, fix the code properly. Do not merely report the issue.
5. Re-test: Re-run the local D1 migrations and test suite after applying fixes.
6. Conclude only when the task is genuinely complete.

OUTPUT:
Provide a report of any fixes applied. Format your completion statement as: "TASK T-FND-02 QA COMPLETE: Tenant status enums verified."
```

======================================================================
TASK T-FND-03 — Automate Cross-Repo Tenant Provisioning
- Task objective: Replace manual KV injection with automated Cloudflare Workers Service Bindings between SA v2 and vertical workers.
- Why this task exists: Manual onboarding is error-prone and scales poorly.
- Dependencies: T-FND-02
- Parallel execution notes: Can run in parallel with T-FND-01, T-FND-04, T-FND-05, T-FND-06, T-FND-07.
- Execution target: Manus (cross-repo orchestration)
- Affected repos: `webwaka-super-admin-v2`, `webwaka-commerce`, `webwaka-transport`
- Required governance/docs to consult: `COMMERCE_TENANT_ONBOARDING_GUIDE.md`
- Acceptance criteria: A new tenant can immediately access the Commerce suite without manual runbooks.
- Risks / drift warnings: Service bindings require complex `wrangler.toml` configuration across multiple repositories.

PROMPT 1 — IMPLEMENTATION
```markdown
TASK ID: T-FND-03
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Tenant onboarding currently requires manual KV injection. We need to automate this using Cloudflare Workers Service Bindings between Super Admin V2 and the vertical workers (e.g., Commerce, Transport).

INVARIANTS:
- Multi-Tenant Tenant-as-Code: Provisioning must be atomic and automated. Enforce strict `tenant_id` isolation.
- Cloudflare-First Deployment: Utilize native Service Bindings.
- Multi-Repo Platform Architecture: Treat each repo as a modular component of one integrated ecosystem.
- Thoroughness Over Speed: Depth, validation, and architectural integrity are non-negotiable.

INSTRUCTIONS:
1. Deep review: Read `COMMERCE_TENANT_ONBOARDING_GUIDE.md` to understand the current manual process.
2. Inspect `wrangler.toml` in `webwaka-super-admin-v2` and plan the Service Binding configuration.
3. Configure a Service Binding to the `webwaka-commerce` worker in `wrangler.toml`.
4. Update the `POST /tenants` handler in SA v2 to make an internal fetch call to the Commerce worker's provisioning endpoint.
5. Ensure the Commerce worker securely handles this internal request and writes the necessary KV configuration.
6. Emit a `tenant.provisioned` event upon success. Do not drift from this instruction.
7. Test the cross-worker communication locally using `wrangler dev`.

OUTPUT:
Provide a summary of the `wrangler.toml` changes and the SA v2 handler updates. Format your completion statement as: "TASK T-FND-03 COMPLETE: Cross-repo tenant provisioning automated."
```

PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX
```markdown
TASK ID: T-FND-03
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Cross-repo tenant provisioning was automated via Service Bindings between SA v2 and Commerce.

INSTRUCTIONS:
1. Understand intended behavior: A new tenant created in SA v2 must instantly have a valid KV configuration in Commerce without manual intervention.
2. Compare intended vs actual: Audit the codebase by verifying the Service Binding configuration in `wrangler.toml`. Check the security of the Commerce internal endpoint (it must reject external traffic).
3. Verify that the `tenant.provisioned` event is emitted correctly. Look for omissions or invariant violations.
4. FIX THE CODE DIRECTLY: If the binding is misconfigured, the endpoint is insecure, or bugs are found, fix the code properly. Do not merely report the issue.
5. Re-test: Re-test the flow using local worker instances after applying fixes.
6. Conclude only when the task is genuinely complete.

OUTPUT:
Provide a report of any security or configuration fixes applied. Format your completion statement as: "TASK T-FND-03 QA COMPLETE: Cross-repo provisioning verified and secured."
```

======================================================================
TASK T-FND-04 — Admin JWT Storage Migration
- Task objective: Move the SA v2 admin JWT from `localStorage` to `HttpOnly`, `SameSite=Strict` cookies.
- Why this task exists: Storing JWTs in `localStorage` presents a critical XSS vulnerability.
- Dependencies: None.
- Parallel execution notes: Can run in parallel with T-FND-01, T-FND-02, T-FND-03, T-FND-05, T-FND-06, T-FND-07.
- Execution target: Replit (`webwaka-super-admin-v2`)
- Affected repos: `webwaka-super-admin-v2`
- Required governance/docs to consult: `ACTUAL_IMPLEMENTATION_AUDIT.md`
- Acceptance criteria: Authentication works via cookies; `localStorage` no longer contains the token.
- Risks / drift warnings: Ensure CORS and CSRF settings are correctly configured for cookie-based auth.

PROMPT 1 — IMPLEMENTATION
```markdown
TASK ID: T-FND-04
TARGET: Replit (`webwaka-super-admin-v2`)

CONTEXT:
The Super Admin V2 application currently stores admin JWTs in `localStorage`. This is a critical security vulnerability that must be fixed by migrating to `HttpOnly`, `SameSite=Strict` cookies.

INVARIANTS:
- Thoroughness Over Speed: Security changes must be implemented completely and correctly.
- Cloudflare-First Deployment: Ensure compatibility with Cloudflare Workers environment.

INSTRUCTIONS:
1. Deep review: Read `ACTUAL_IMPLEMENTATION_AUDIT.md` to understand the security gap.
2. Inspect the auth middleware and login handlers in the backend, and the API client in the frontend. Plan the migration.
3. Modify the login API endpoint to set an `HttpOnly`, `SameSite=Strict`, `Secure` cookie containing the JWT.
4. Update the frontend API client to include credentials (cookies) in all requests.
5. Remove all code that reads or writes the JWT to `localStorage`. Do not drift from this requirement.
6. Test the login, authenticated requests, and logout flows locally to ensure they work correctly with cookies.

OUTPUT:
Provide a summary of the auth changes made. Format your completion statement as: "TASK T-FND-04 COMPLETE: Admin JWT storage migrated to cookies."
```

PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX
```markdown
TASK ID: T-FND-04
TARGET: Replit (`webwaka-super-admin-v2`)

CONTEXT:
Admin JWT storage was migrated from `localStorage` to `HttpOnly` cookies in SA v2.

INSTRUCTIONS:
1. Understand intended behavior: The JWT must be stored exclusively in an `HttpOnly`, `SameSite=Strict` cookie. It must never appear in `localStorage`.
2. Compare intended vs actual: Audit the codebase to ensure no lingering references to `localStorage.getItem('token')` or similar exist.
3. Verify that the backend auth middleware correctly reads the token from the cookie header. Check for CORS/CSRF issues.
4. FIX THE CODE DIRECTLY: If you find omissions, regressions, or security vulnerabilities, fix the code properly. Do not merely report the issue.
5. Re-test: Re-run the auth flows after applying fixes.
6. Conclude only when the task is genuinely complete.

OUTPUT:
Provide a report of any fixes applied. Format your completion statement as: "TASK T-FND-04 QA COMPLETE: Admin JWT storage migration verified."
```

======================================================================
TASK T-FND-05 — Termii Voice Fallback Integration
- Task objective: Implement a shared Termii voice OTP fallback in `@webwaka/core/notifications`.
- Why this task exists: High SMS failure rates in Nigeria require a robust fallback mechanism for critical OTPs.
- Dependencies: None.
- Parallel execution notes: Can run in parallel with T-FND-01, T-FND-02, T-FND-03, T-FND-04, T-FND-06, T-FND-07.
- Execution target: Replit (`webwaka-core`)
- Affected repos: `webwaka-core`
- Required governance/docs to consult: `WebWakaDigitalOperatingSystem.md`
- Acceptance criteria: A reusable function exists in core that attempts SMS first, then falls back to Voice OTP if SMS fails or upon user request.
- Risks / drift warnings: Ensure API keys are passed dynamically from the consuming tenant's KV, not hardcoded in core.

PROMPT 1 — IMPLEMENTATION
```markdown
TASK ID: T-FND-05
TARGET: Replit (`webwaka-core`)

CONTEXT:
Due to high SMS delivery failure rates in Nigeria, the platform requires a shared Termii Voice OTP fallback mechanism. This must be built into the core library so all verticals can use it.

INVARIANTS:
- Build Once Use Infinitely: Strictly use and contribute to `@webwaka/core` npm packages.
- Nigeria-First, Africa-Ready: Architecture must handle local telco realities.
- Tenant-as-Code: API keys must be retrieved from KV, not hardcoded.

INSTRUCTIONS:
1. Deep review: Read `WebWakaDigitalOperatingSystem.md` to understand the shared primitives architecture.
2. Inspect `src/core/notifications/` in `webwaka-core`. Plan the integration.
3. Implement a `sendOTP` function that accepts a phone number, OTP code, and tenant configuration (containing the Termii API key).
4. Research the Termii API documentation online if necessary to understand their Voice OTP endpoint.
5. Implement the logic to attempt SMS delivery first, and if it fails (or if explicitly requested via a parameter), trigger the Voice OTP endpoint. Do not drift from this logic.
6. Write Vitest tests to cover the fallback scenarios.

OUTPUT:
Provide the implemented function and test results. Format your completion statement as: "TASK T-FND-05 COMPLETE: Termii voice fallback implemented."
```

PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX
```markdown
TASK ID: T-FND-05
TARGET: Replit (`webwaka-core`)

CONTEXT:
A shared Termii Voice OTP fallback mechanism was implemented in `@webwaka/core/notifications`.

INSTRUCTIONS:
1. Understand intended behavior: The function must attempt SMS, then fall back to Voice OTP, using dynamically provided API keys.
2. Compare intended vs actual: Audit the codebase to ensure no API keys are hardcoded. Verify the fallback logic is robust.
3. Inspect the tests to ensure both success and failure paths for SMS are covered.
4. FIX THE CODE DIRECTLY: If you find hardcoded keys, logic errors, or invariant violations, fix the code properly. Do not merely report the issue.
5. Re-test: Re-run the test suite after applying fixes.
6. Conclude only when the task is genuinely complete.

OUTPUT:
Provide a report of any bugs found and fixed. Format your completion statement as: "TASK T-FND-05 QA COMPLETE: Termii voice fallback verified."
```

======================================================================
TASK T-FND-06 — OpenRouter AI Abstraction with Local Fallback
- Task objective: Build the shared AI abstraction in `@webwaka/core/ai` routing through OpenRouter with a Llama-3 local fallback.
- Why this task exists: To satisfy the Vendor Neutral AI invariant and ensure offline/local resilience.
- Dependencies: None.
- Parallel execution notes: Can run in parallel with T-FND-01, T-FND-02, T-FND-03, T-FND-04, T-FND-05, T-FND-07.
- Execution target: Replit (`webwaka-core`)
- Affected repos: `webwaka-core`
- Required governance/docs to consult: `WebWakaDigitalOperatingSystem.md`
- Acceptance criteria: A unified `generateCompletion` function exists that uses OpenRouter by default and falls back to Cloudflare Workers AI (Llama-3) if OpenRouter is unreachable.
- Risks / drift warnings: Cloudflare Workers AI limits may restrict context windows compared to OpenRouter.

PROMPT 1 — IMPLEMENTATION
```markdown
TASK ID: T-FND-06
TARGET: Replit (`webwaka-core`)

CONTEXT:
The platform requires a vendor-neutral AI abstraction layer. It must route requests through OpenRouter by default, but fall back to a local/edge Llama-3 model (via Cloudflare Workers AI) if the primary API fails.

INVARIANTS:
- Vendor Neutral AI: All AI features must route exclusively through the OpenRouter abstraction in `core`.
- Build Once Use Infinitely: Strictly use and contribute to `@webwaka/core` npm packages.
- Cloudflare-First Deployment: Utilize Cloudflare Workers AI for the fallback.

INSTRUCTIONS:
1. Deep review: Read `WebWakaDigitalOperatingSystem.md` to understand the AI routing principles.
2. Inspect `src/core/ai/` in `webwaka-core`. Plan the abstraction layer.
3. Implement `generateCompletion` that accepts a standardized prompt and configuration.
4. Implement the primary routing logic to call the OpenRouter API.
5. Implement the fallback logic to call Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct` or similar) if OpenRouter times out or returns an error. Do not drift from this requirement.
6. Write Vitest tests to mock both successful OpenRouter calls and fallback scenarios.

OUTPUT:
Provide the implemented function and test results. Format your completion statement as: "TASK T-FND-06 COMPLETE: OpenRouter AI abstraction with local fallback implemented."
```

PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX
```markdown
TASK ID: T-FND-06
TARGET: Replit (`webwaka-core`)

CONTEXT:
An AI abstraction layer with OpenRouter primary routing and Cloudflare Workers AI fallback was implemented.

INSTRUCTIONS:
1. Understand intended behavior: The function must prioritize OpenRouter and gracefully degrade to Workers AI upon failure.
2. Compare intended vs actual: Audit the codebase to ensure the fallback logic is correctly triggered on network errors or 5xx responses from OpenRouter.
3. Verify that the abstraction is vendor-neutral and doesn't leak provider-specific types to consumers.
4. FIX THE CODE DIRECTLY: If you find logic errors, missing fallbacks, or invariant violations, fix the code properly. Do not merely report the issue.
5. Re-test: Re-run the test suite after applying fixes.
6. Conclude only when the task is genuinely complete.

OUTPUT:
Provide a report of any bugs found and fixed. Format your completion statement as: "TASK T-FND-06 QA COMPLETE: AI abstraction verified."
```

======================================================================
TASK T-FND-07 — Super Admin Feature Flag Manager
- Task objective: Create the centralized `FEATURE_FLAGS_KV` namespace and management UI in Super Admin V2.
- Why this task exists: Subscription tiers and API quotas are currently hardcoded in vertical workers; they must be dynamically governed.
- Dependencies: None.
- Parallel execution notes: Can run in parallel with T-FND-01, T-FND-02, T-FND-03, T-FND-04, T-FND-05, T-FND-06.
- Execution target: Replit (`webwaka-super-admin-v2`)
- Affected repos: `webwaka-super-admin-v2`
- Required governance/docs to consult: `PLATFORM_ECOSYSTEM.md`
- Acceptance criteria: SA v2 can CRUD feature flags and quotas per tenant in a dedicated KV namespace.
- Risks / drift warnings: Ensure the KV schema is well-documented so vertical workers know exactly how to query it.

PROMPT 1 — IMPLEMENTATION
```markdown
TASK ID: T-FND-07
TARGET: Replit (`webwaka-super-admin-v2`)

CONTEXT:
Subscription tiers, feature toggles, and API quotas are currently hardcoded across the vertical suites. We need to build a centralized Feature Flag Manager in Super Admin V2 that writes to a `FEATURE_FLAGS_KV` namespace.

INVARIANTS:
- Multi-Tenant Tenant-as-Code: Feature flags must be strictly isolated by `tenant_id`.
- Cloudflare-First Deployment: Utilize Cloudflare KV for fast, globally distributed reads.

INSTRUCTIONS:
1. Deep review: Read `PLATFORM_ECOSYSTEM.md` to understand the required feature flags and quotas.
2. Inspect the SA v2 backend API and frontend UI. Plan the CRUD operations.
3. Implement backend API endpoints (`GET`, `POST`, `PUT`, `DELETE`) to manage feature flags for a specific tenant in the `FEATURE_FLAGS_KV` namespace.
4. Build a simple management UI in the SA v2 React frontend to toggle features and set quota limits per tenant.
5. Document the KV JSON schema clearly so downstream vertical workers can consume it. Do not drift from this requirement.
6. Test the CRUD operations locally.

OUTPUT:
Provide a summary of the API endpoints, UI changes, and the KV schema documentation. Format your completion statement as: "TASK T-FND-07 COMPLETE: Super Admin Feature Flag Manager implemented."
```

PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX
```markdown
TASK ID: T-FND-07
TARGET: Replit (`webwaka-super-admin-v2`)

CONTEXT:
A Feature Flag Manager was implemented in SA v2 to manage tenant configurations in a KV namespace.

INSTRUCTIONS:
1. Understand intended behavior: SA v2 must be able to CRUD feature flags per tenant, and the KV schema must be well-documented.
2. Compare intended vs actual: Audit the codebase to ensure strict `tenant_id` isolation in the KV keys (e.g., `tenant:{id}:flags`).
3. Verify that the UI correctly interacts with the new API endpoints. Look for missing validation or bugs.
4. FIX THE CODE DIRECTLY: If you find security issues, isolation failures, or UI bugs, fix the code properly. Do not merely report the issue.
5. Re-test: Re-run the API and UI flows after applying fixes.
6. Conclude only when the task is genuinely complete.

OUTPUT:
Provide a report of any bugs found and fixed. Format your completion statement as: "TASK T-FND-07 QA COMPLETE: Feature Flag Manager verified."
```
