# WEBWAKA ECOSYSTEM MASTER SYNTHESIS, REFACTORING STRATEGY, AND DEPENDENCY-ORDERED IMPLEMENTATION TASKBOOK

**Prepared by:** Manus AI (Principal Cross-Repo Synthesis Agent)  
**Date:** April 2026  
**Scope:** Complete synthesis of all 14 WebWaka repositories, resolving architectural drift, eliminating duplication, mapping horizontal AI capabilities, and generating a strictly phased, dependency-ordered taskbook with copy-paste execution prompts.

---

## SECTION 1. Executive Platform Synthesis

### 1.1 The Integrated Ecosystem View
WebWaka OS v4 is not a collection of isolated applications; it is **one integrated multi-repo ecosystem** operating under a strict "Build Once, Use Infinitely" paradigm. The ecosystem is composed of a control plane (`webwaka-super-admin-v2`), a foundational shared primitives library (`webwaka-core`), and 12 vertical execution suites (Commerce, Transport, Logistics, Fintech, Civic, etc.). All cross-module communication must occur via an asynchronous event bus, and all monetary values must be stored as Nigerian Kobo integers.

### 1.2 Architectural Target State
The target architecture mandates that any capability required by more than one suite (e.g., identity verification, payment processing, AI abstraction, offline sync resolution) must be abstracted into `@webwaka/core` or exposed as a shared service. Downstream vertical suites must remain "thin," containing only domain-specific business logic. Super Admin V2 must act as the god-level enablement layer, controlling tenant feature flags, API quotas, and billing ledgers without requiring code changes in the vertical suites.

### 1.3 Current Gap Between Target Principles and Present Reality
The extensive codebase audit reveals significant architectural drift:
1. **Duplication:** Delivery zone mapping, order tracking, and product attribute schemas are duplicated across Single-Vendor and Multi-Vendor Commerce modules, and should actually reside in Logistics.
2. **Event Schema Fragmentation:** The `WebWakaEvent<T>` schema is fragmented. Civic uses `CivicEvent`, Professional uses `PlatformEvent`, and Logistics uses `EventPayload`. This breaks the event-driven architecture target.
3. **Hardcoding:** Subscription tiers, delivery zones, and role permissions are frequently hardcoded within specific vertical repos rather than being dynamically pulled from Super Admin configuration KV stores.
4. **Provisioning Disconnect:** Super Admin V2 tenant creation does not automatically provision the downstream vertical KV configurations, requiring manual runbooks.

### 1.4 Guiding Refactor Direction
The immediate refactoring strategy focuses on **consolidation and elevation**:
- **Elevate** duplicated tracking and zone logic from Commerce into Logistics.
- **Standardize** the event bus payload across all 14 repos.
- **Centralize** external integrations (Termii, Paystack, NIBSS, OpenRouter) exclusively into `@webwaka/core`.
- **Automate** cross-repo tenant provisioning via Cloudflare Service Bindings between Super Admin and the vertical workers.

---

## SECTION 2. Reviewed Document Inventory

This synthesis is derived from a deep analysis of the following canonical documents:

### Platform Foundation & Governance
- `WebWakaDigitalOperatingSystem.md` (`webwaka-platform-docs`): Master architecture blueprint and 12 invariants.
- `PLATFORM_ROADMAP.md` (`webwaka-platform-docs`): High-level epic sequencing.
- `FACTORY-STATE-REPORT.md` (`webwaka-platform-docs`): Status of the parallel execution factory.
- `EVENT_BUS_SCHEMA.md` (`webwaka-platform-docs`): Documentation of the fragmented event schemas.

### Super Admin & Control Plane
- `CODEBASE_INVENTORY.md` (`webwaka-super-admin-v2`): Detailed breakdown of the SA v2 API surface.
- `ACTUAL_IMPLEMENTATION_AUDIT.md` (`webwaka-super-admin-v2`): Identification of schema divergences and security gaps.
- `PLATFORM_ECOSYSTEM.md` (`webwaka-super-admin-v2`): Inventory of active tenant modules and feature flags.

### Vertical Suites (Implementation & Research Reports)
- `webwaka_commerce_research_report.md` (Local): Analysis of POS, Single-Vendor, and Multi-Vendor duplication.
- `webwaka_transport_research_report.md` (Local): Analysis of seat inventory sync and offline agent sales.
- `webwaka_logistics_research_report.md` (Local): Analysis of delivery orchestration and proof of delivery.
- `webwaka_11_repos_research_report.md` (Local): Synthesis of Fintech, Civic, Professional, Real Estate, and Institutional verticals.
- `webwaka-transport-research.md` (`webwaka-transport`): Internal transport architecture document.

---

## SECTION 3. Ecosystem Capability Map

The following map normalizes capabilities across the ecosystem, identifying where they currently live and where they should be governed.

| Capability Family | Specific Feature | Current Location | Target Control Surface |
| :--- | :--- | :--- | :--- |
| **Identity & KYC** | BVN/NIN/vNIN Verification | Fintech | `@webwaka/core/kyc` |
| **Identity & KYC** | CAC Company Verification | Super Admin | `@webwaka/core/kyc` |
| **Payments** | Paystack Webhooks & Checkout | Commerce, Services | `@webwaka/core/billing` |
| **Payments** | NIBSS NIP Transfers | Fintech | `@webwaka/core/billing` |
| **Communications** | Termii SMS / WhatsApp Fallback | Commerce, Civic | `@webwaka/core/notifications` |
| **Logistics** | Delivery Zones & Quotes | Commerce (Duplicated) | Logistics API |
| **Logistics** | Live Rider Tracking | Commerce (Duplicated) | Logistics API |
| **Data Sync** | Offline Dexie Mutation Queue | Transport, Civic | `@webwaka/core/sync` |
| **Platform Ops** | Tenant Suspension & Billing | Super Admin | Super Admin V2 |
| **Platform Ops** | Module Feature Toggles | Hardcoded in Verticals | Super Admin V2 (KV) |

---

## SECTION 4. Build-Once Reuse Matrix

To enforce the "Build Once, Use Infinitely" invariant, the following capabilities must be extracted from their current silos and elevated to shared platform modules.

| Capability Name | Currently Found In | Recommended Target | Why | Downstream Consumers |
| :--- | :--- | :--- | :--- | :--- |
| **Unified Event Schema** | Civic, Pro, Logistics | `@webwaka/core/events` | Current fragmentation prevents central SA billing/analytics. | All 12 vertical suites |
| **Delivery Quote Engine** | Commerce (Single/Multi) | Logistics Repo | Commerce should not calculate spatial logistics routing. | Commerce, Services |
| **Termii Voice Fallback** | Missing | `@webwaka/core/notifications` | High SMS failure rates in Nigeria require shared fallback. | All 12 vertical suites |
| **Offline Sync Engine** | Civic, Transport | `@webwaka/core/sync` | Every PWA needs Dexie-to-D1 sync; currently rebuilt per repo. | All frontend PWAs |
| **NIBSS Name Enquiry** | Fintech | `@webwaka/core/billing` | Preventing misdirected transfers is needed in Real Estate/Commerce. | Fintech, Commerce, Real Estate |
| **OpenRouter AI Abstraction** | Core (Basic) | `@webwaka/core/ai` | Needs Llama-3 local fallback for offline resilience. | Professional, Civic, Services |

## SECTION 5. Hardcoding and Configurability Audit

The following hardcoded patterns must be eliminated and moved into the Super Admin V2 configuration model.

1. **Tenant Status Enums:** Currently hardcoded in Super Admin SQL (`ACTIVE | SUSPENDED | PROVISIONING | ARCHIVED`) and TypeScript (`ACTIVE | SUSPENDED | TRIAL | CHURNED`). **Target:** Synchronize the D1 schema and TypeScript definitions atomically.
2. **Subscription Tiers & Quotas:** Hardcoded API limits per tier within vertical workers. **Target:** Move to a centralized `FEATURE_FLAGS_KV` namespace managed by Super Admin V2, queried dynamically by `@webwaka/core/auth`.
3. **Delivery Zones & Pricing:** Hardcoded spatial boundaries in Commerce. **Target:** Manage via Logistics API; query dynamic pricing based on vendor/customer location.
4. **Production D1 UUIDs:** Hardcoded as `TODO_REPLACE_WITH_PROD_*` in `wrangler.toml` files. **Target:** Automate via CI/CD pre-deploy scripts governed by Super Admin provisioning tools.
5. **Admin JWT Storage:** Stored in `localStorage` in Super Admin V2. **Target:** Move to `HttpOnly`, `SameSite=Strict` cookies configured by the auth middleware.

---

## SECTION 6. Shared Integration Consolidation Model

All external service integrations must be centralized into platform-level abstractions to ensure consistency and single-point-of-failure management.

1. **Payments (Paystack/NIBSS):** Abstracted into `@webwaka/core/billing`. Provides unified checkout, webhook validation, NIP transfers, and NQR generation.
2. **Communications (Termii/Yournotify):** Abstracted into `@webwaka/core/notifications`. Provides SMS, WhatsApp fallback, and voice OTP delivery.
3. **Identity & KYC (NIMC/CAC):** Abstracted into `@webwaka/core/kyc`. Provides BVN/NIN validation, facial matching, and company registry sync.
4. **Logistics & Transport:** Abstracted into `webwaka-logistics` and `webwaka-transport` APIs. Exposed to other suites via standardized event contracts (e.g., `delivery.status_changed`).
5. **AI (OpenRouter):** Abstracted into `@webwaka/core/ai`. Provides vendor-neutral LLM completions with local fallback.

---

## SECTION 7. AI Horizontal Platform Model

AI is not a standalone feature; it is a horizontal platform capability available across all suites, routed exclusively through the OpenRouter abstraction in `@webwaka/core/ai`.

1. **Service Layers:**
   - **Super Admin:** AI usage quota monitoring and anomaly detection.
   - **Tenant Admin:** AI-driven analytics, fraud scoring, and automated support ticket routing.
   - **End User:** AI-powered search, product recommendations, and chatbot assistants.
2. **Prompt Governance:** Standardized prompt templates managed in Super Admin V2, ensuring consistent tone and compliance across tenants.
3. **Model Routing:** Dynamic routing between GPT-4o (complex tasks), Claude 3 (general tasks), and Llama-3 (local offline fallback).
4. **Auditability:** All AI interactions logged to the centralized `logger` for compliance and cost attribution.

---

## SECTION 8. Dependency Architecture and Sequencing Logic

The implementation plan is structured into four strict phases based on dependency logic.

1. **Phase 1: Foundation & Control Plane (Weeks 1-3)**
   - **Dependencies:** `@webwaka/core` must be published before any downstream suite can adopt the shared primitives. Super Admin V2 must be fully operational to manage tenant provisioning.
   - **Parallelism:** Core primitive development (Payments, Notifications, KYC) can run in parallel with Super Admin V2 schema synchronization.
2. **Phase 2: Core Vertical Consolidation (Weeks 4-6)**
   - **Dependencies:** Logistics API must be established before Commerce can remove its duplicated delivery zone logic. Fintech KYC must be established before Real Estate and Civic can utilize identity verification.
   - **Parallelism:** Logistics API development and Fintech KYC integration.
3. **Phase 3: High-Value Verticals (Weeks 7-9)**
   - **Dependencies:** Commerce and Transport must adopt the unified event schema before cross-repo analytics can be built.
   - **Parallelism:** Commerce refactoring and Transport offline sync enhancements.
4. **Phase 4: Mass-Market Services & Institutions (Weeks 10-12)**
   - **Dependencies:** Civic, Professional, and Institutional suites depend on the stabilized foundation and core verticals.
   - **Parallelism:** Independent feature development within each vertical suite.

## SECTION 9. Phase-by-Phase Implementation Plan

This section organizes all tasks into a strict chronological sequence.

### Phase 1: Foundation & Control Plane

**TASK ID: T-FND-01**
- **Title:** Unify the Event Bus Schema
- **Objective:** Eliminate fragmentation across Civic, Professional, and Logistics by enforcing the canonical `WebWakaEvent<T>` schema.
- **Why it exists:** Divergent event structures prevent centralized SA billing and cross-repo analytics.
- **Dependencies:** None.
- **Can run in parallel with:** T-FND-02, T-FND-03
- **Execution Target:** Manus (cross-repo orchestration)
- **Primary affected repos:** `webwaka-core`, `webwaka-civic`, `webwaka-professional`, `webwaka-logistics`
- **Required governance:** `EVENT_BUS_SCHEMA.md`
- **Expected outputs:** Updated `events.ts` in core, refactored publishers in downstream suites.
- **Acceptance criteria:** All repos emit events matching the `event`, `tenantId`, `payload`, and `timestamp` schema.
- **Risks / drift warnings:** Suites might fail to update their local payload extraction logic, breaking downstream consumers.

**TASK ID: T-FND-02**
- **Title:** Synchronize SA v2 Tenant Status Enums
- **Objective:** Resolve the divergence between the SQL migration and TypeScript types for tenant statuses.
- **Why it exists:** Latent runtime type errors prevent reliable tenant state management.
- **Dependencies:** None.
- **Can run in parallel with:** T-FND-01, T-FND-03
- **Execution Target:** Replit (`webwaka-super-admin-v2`)
- **Primary affected repos:** `webwaka-super-admin-v2`
- **Required governance:** `ACTUAL_IMPLEMENTATION_AUDIT.md`
- **Expected outputs:** Atomic commit aligning SQL and TS to `ACTIVE | SUSPENDED | TRIAL | CHURNED`.
- **Acceptance criteria:** Vitest suite passes with the unified enum.
- **Risks / drift warnings:** Manual data migration might be required if production databases already contain invalid enum strings.

**TASK ID: T-FND-03**
- **Title:** Automate Cross-Repo Tenant Provisioning
- **Objective:** Replace manual KV injection with automated Cloudflare Workers Service Bindings between SA v2 and vertical workers.
- **Why it exists:** Manual onboarding is error-prone and scales poorly.
- **Dependencies:** T-FND-02
- **Can run in parallel with:** T-FND-01
- **Execution Target:** Manus (cross-repo orchestration)
- **Primary affected repos:** `webwaka-super-admin-v2`, `webwaka-commerce`, `webwaka-transport`
- **Required governance:** `COMMERCE_TENANT_ONBOARDING_GUIDE.md`
- **Expected outputs:** `POST /tenants` automatically configures vertical KV stores and emits `tenant.provisioned`.
- **Acceptance criteria:** A new tenant can immediately access the Commerce suite without manual runbooks.
- **Risks / drift warnings:** Service bindings require complex `wrangler.toml` configuration across multiple repositories.

### Phase 2: Core Vertical Consolidation

**TASK ID: T-CVC-01**
- **Title:** Extract Delivery Zones from Commerce to Logistics
- **Objective:** Remove duplicated spatial logic from Single-Vendor and Multi-Vendor modules and centralize it in the Logistics API.
- **Why it exists:** Commerce should not manage logistics routing; duplication violates "Build Once, Use Infinitely."
- **Dependencies:** T-FND-01
- **Can run in parallel with:** T-CVC-02
- **Execution Target:** Manus (cross-repo orchestration)
- **Primary affected repos:** `webwaka-commerce`, `webwaka-logistics`
- **Required governance:** `webwaka_commerce_research_report.md`
- **Expected outputs:** `GET /delivery-zones` API in Logistics; Commerce queries this API instead of local DB.
- **Acceptance criteria:** Commerce no longer contains delivery zone schemas or routing logic.
- **Risks / drift warnings:** Network latency between Commerce and Logistics could impact checkout speed.

**TASK ID: T-CVC-02**
- **Title:** Consolidate Order Tracking Logic
- **Objective:** Move duplicated tracking logic from Commerce into a centralized Logistics portal.
- **Why it exists:** Real-time rider tracking belongs in Logistics.
- **Dependencies:** T-FND-01
- **Can run in parallel with:** T-CVC-01
- **Execution Target:** Manus (cross-repo orchestration)
- **Primary affected repos:** `webwaka-commerce`, `webwaka-logistics`
- **Required governance:** `webwaka_commerce_research_report.md`
- **Expected outputs:** Logistics consumes `delivery.status_changed` events and powers the tracking UI.
- **Acceptance criteria:** Commerce delegates all tracking views to the Logistics portal.
- **Risks / drift warnings:** Event delivery failures could result in stale tracking data.

---

## SECTION 10. Copy-Paste Agent Prompts for Every Task

### T-FND-01: Unify the Event Bus Schema

**PROMPT 1 — IMPLEMENTATION**
```markdown
TASK ID: T-FND-01
TARGET: Manus (cross-repo orchestration)

CONTEXT:
WebWaka is an integrated multi-repo ecosystem. Currently, the event bus schema is fragmented: Civic uses `CivicEvent`, Professional uses `PlatformEvent`, and Logistics uses `EventPayload`. This prevents centralized Super Admin billing and analytics.

INVARIANTS:
- Build Once, Use Infinitely: The schema must live in `@webwaka/core/events`.
- Event-Driven Architecture: All cross-module communication must use this unified schema.

INSTRUCTIONS:
1. Review `EVENT_BUS_SCHEMA.md` in `webwaka-platform-docs`.
2. Inspect `src/core/events/index.ts` in `webwaka-core`.
3. Update the `WebWakaEvent<T>` interface to strictly require: `event` (string), `tenantId` (string), `payload` (T), and `timestamp` (number).
4. Identify all publishers in `webwaka-civic`, `webwaka-professional`, and `webwaka-logistics` that deviate from this schema.
5. Refactor the downstream publishers to use the unified schema, mapping their legacy fields into the `payload` object where appropriate.
6. Run the Vitest suites in all affected repos to ensure no typing errors remain.

OUTPUT:
Provide a summary of the files modified across the 4 repositories and confirm that the test suites pass. Format your completion statement as: "TASK T-FND-01 COMPLETE: Event bus schema unified."
```

**PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX**
```markdown
TASK ID: T-FND-01
TARGET: Manus (cross-repo orchestration)

CONTEXT:
The event bus schema was supposed to be unified across `webwaka-core`, `webwaka-civic`, `webwaka-professional`, and `webwaka-logistics`.

INSTRUCTIONS:
1. Understand the intended scope: All events must match the `WebWakaEvent<T>` schema defined in `EVENT_BUS_SCHEMA.md`.
2. Audit the codebase: Search for instances of `CivicEvent`, `PlatformEvent`, or `EventPayload` that may have been missed during the implementation phase.
3. Inspect the event consumers (subscribers) to ensure they are correctly parsing the new unified schema.
4. If you find any omissions, regressions, or invariant violations, fix the code directly. Do not merely report the issue.
5. Re-run the test suites after applying fixes.

OUTPUT:
Provide a detailed report of any bugs found and fixed. Format your completion statement as: "TASK T-FND-01 QA COMPLETE: Event bus schema verified and hardened."
```

### T-FND-02: Synchronize SA v2 Tenant Status Enums

**PROMPT 1 — IMPLEMENTATION**
```markdown
TASK ID: T-FND-02
TARGET: Replit (`webwaka-super-admin-v2`)

CONTEXT:
There is a latent runtime type error in `webwaka-super-admin-v2`. The D1 SQL migration defines tenant statuses as `ACTIVE | SUSPENDED | PROVISIONING | ARCHIVED`, while the TypeScript schema defines `ACTIVE | SUSPENDED | TRIAL | CHURNED`.

INVARIANTS:
- Thoroughness Over Speed: Data consistency is non-negotiable.

INSTRUCTIONS:
1. Review `ACTUAL_IMPLEMENTATION_AUDIT.md` in `webwaka-super-admin-v2`.
2. Inspect the latest SQL migration file in `migrations/` and `src/schema.ts`.
3. Decide on the canonical enum: `ACTIVE | SUSPENDED | TRIAL | CHURNED` is preferred based on recent product decisions.
4. Update the SQL migration (or create a new one if necessary) to enforce the chosen enum.
5. Ensure `src/schema.ts` perfectly matches the SQL definition.
6. Run the Vitest suite and local D1 migrations to validate the change.

OUTPUT:
Provide the updated SQL and TS snippets. Format your completion statement as: "TASK T-FND-02 COMPLETE: Tenant status enums synchronized."
```

**PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX**
```markdown
TASK ID: T-FND-02
TARGET: Replit (`webwaka-super-admin-v2`)

CONTEXT:
The tenant status enums in `webwaka-super-admin-v2` were supposed to be synchronized between SQL and TypeScript.

INSTRUCTIONS:
1. Understand the intended scope: Both SQL and TS must use the exact same enum strings.
2. Audit the codebase: Check the migration files, `schema.ts`, and any API handlers that validate tenant status.
3. Verify that existing tests cover status transitions.
4. If you find mismatches or missing validation logic, fix the code directly.
5. Re-run the local D1 migrations and test suite.

OUTPUT:
Provide a report of any fixes applied. Format your completion statement as: "TASK T-FND-02 QA COMPLETE: Tenant status enums verified."
```

### T-FND-03: Automate Cross-Repo Tenant Provisioning

**PROMPT 1 — IMPLEMENTATION**
```markdown
TASK ID: T-FND-03
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Tenant onboarding currently requires manual KV injection. We need to automate this using Cloudflare Workers Service Bindings between Super Admin V2 and the vertical workers (e.g., Commerce, Transport).

INVARIANTS:
- Multi-Tenant Tenant-as-Code: Provisioning must be atomic and automated.
- Cloudflare-First Deployment: Utilize native Service Bindings.

INSTRUCTIONS:
1. Review `COMMERCE_TENANT_ONBOARDING_GUIDE.md` to understand the current manual process.
2. Inspect `wrangler.toml` in `webwaka-super-admin-v2` and configure a Service Binding to the `webwaka-commerce` worker.
3. Update the `POST /tenants` handler in SA v2 to make an internal fetch call to the Commerce worker's provisioning endpoint.
4. Ensure the Commerce worker securely handles this internal request and writes the necessary KV configuration.
5. Emit a `tenant.provisioned` event upon success.
6. Test the cross-worker communication locally using `wrangler dev`.

OUTPUT:
Provide a summary of the `wrangler.toml` changes and the SA v2 handler updates. Format your completion statement as: "TASK T-FND-03 COMPLETE: Cross-repo tenant provisioning automated."
```

**PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX**
```markdown
TASK ID: T-FND-03
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Cross-repo tenant provisioning was automated via Service Bindings between SA v2 and Commerce.

INSTRUCTIONS:
1. Understand the intended scope: A new tenant created in SA v2 must instantly have a valid KV configuration in Commerce without manual intervention.
2. Audit the codebase: Verify the Service Binding configuration in `wrangler.toml`. Check the security of the Commerce internal endpoint (it must reject external traffic).
3. Verify that the `tenant.provisioned` event is emitted correctly.
4. If the binding is misconfigured or the endpoint is insecure, fix the code directly.
5. Re-test the flow using local worker instances.

OUTPUT:
Provide a report of any security or configuration fixes applied. Format your completion statement as: "TASK T-FND-03 QA COMPLETE: Cross-repo provisioning verified and secured."
```

### T-CVC-01: Extract Delivery Zones from Commerce to Logistics

**PROMPT 1 — IMPLEMENTATION**
```markdown
TASK ID: T-CVC-01
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Delivery zone mapping is currently duplicated in the Single-Vendor and Multi-Vendor Commerce modules. This spatial logic belongs in the Logistics suite.

INVARIANTS:
- Build Once, Use Infinitely: Remove duplication; centralize in Logistics.
- Multi-Repo Platform Architecture: Treat repos as modular components.

INSTRUCTIONS:
1. Review `webwaka_commerce_research_report.md` for context on the duplication.
2. Inspect the delivery zone schemas and logic in `webwaka-commerce`.
3. Create a unified `GET /delivery-zones` API in `webwaka-logistics`.
4. Refactor `webwaka-commerce` to remove local delivery zone tables and logic.
5. Update Commerce checkout flows to query the new Logistics API for shipping estimates.
6. Run tests in both repos to ensure checkout still functions correctly.

OUTPUT:
Provide a summary of the removed Commerce code and the new Logistics API. Format your completion statement as: "TASK T-CVC-01 COMPLETE: Delivery zones extracted to Logistics."
```

**PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX**
```markdown
TASK ID: T-CVC-01
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Delivery zones were extracted from Commerce and centralized in Logistics.

INSTRUCTIONS:
1. Understand the intended scope: Commerce should no longer contain any delivery zone logic; it must rely entirely on the Logistics API.
2. Audit the codebase: Search `webwaka-commerce` for lingering delivery zone schemas or hardcoded fallback logic.
3. Verify that the Logistics API handles errors gracefully (e.g., if a customer is outside all defined zones).
4. If you find lingering duplication or brittle error handling, fix the code directly.
5. Re-test the cross-repo checkout flow.

OUTPUT:
Provide a report of any lingering duplication removed or error handling improved. Format your completion statement as: "TASK T-CVC-01 QA COMPLETE: Delivery zone extraction verified."
```

### T-CVC-02: Consolidate Order Tracking Logic

**PROMPT 1 — IMPLEMENTATION**
```markdown
TASK ID: T-CVC-02
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Order tracking logic is duplicated in Commerce. Real-time rider tracking should be powered by the Logistics portal.

INVARIANTS:
- Build Once, Use Infinitely: Remove duplication; centralize in Logistics.
- Event-Driven Architecture: Use `delivery.status_changed` events.

INSTRUCTIONS:
1. Review `webwaka_commerce_research_report.md` for context on the tracking duplication.
2. Inspect the tracking logic in `webwaka-commerce`.
3. Enhance the `webwaka-logistics` portal to consume `delivery.status_changed` events and display real-time tracking.
4. Refactor `webwaka-commerce` to remove local tracking views and redirect users to the Logistics tracking portal URL.
5. Ensure the redirect includes a secure, signed token to prevent unauthorized viewing of tracking data.

OUTPUT:
Provide a summary of the redirect logic in Commerce and the event consumption in Logistics. Format your completion statement as: "TASK T-CVC-02 COMPLETE: Order tracking consolidated in Logistics."
```

**PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX**
```markdown
TASK ID: T-CVC-02
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Order tracking logic was consolidated into the Logistics portal, with Commerce redirecting users.

INSTRUCTIONS:
1. Understand the intended scope: Commerce should only redirect; Logistics handles the UI and event consumption.
2. Audit the codebase: Verify the security of the tracking redirect token. Check that Logistics correctly updates the UI upon receiving a `delivery.status_changed` event.
3. If the token is insecure or the event consumption is brittle, fix the code directly.
4. Re-test the tracking flow end-to-end.

OUTPUT:
Provide a report of any security or event handling fixes applied. Format your completion statement as: "TASK T-CVC-02 QA COMPLETE: Order tracking consolidation verified."
```

---

## SECTION 11. Parallel Execution Map

After dependency filtering, the following task groups can be executed in parallel by multiple Replit or Manus agents.

**Parallel Group A: Foundation Hardening**
- T-FND-01: Unify Event Bus Schema (Manus)
- T-FND-02: Synchronize SA v2 Enums (Replit: `webwaka-super-admin-v2`)
- T-FND-04: Admin JWT to HttpOnly (Replit: `webwaka-super-admin-v2`)
- T-FND-05: Termii Voice Fallback (Replit: `webwaka-core`)

**Parallel Group B: Vertical Consolidation**
- T-CVC-01: Extract Delivery Zones (Manus)
- T-CVC-03: Implement Offline Dexie Sync for Transport (Replit: `webwaka-transport`)
- T-CVC-04: NIBSS NIP Integration (Replit: `webwaka-fintech`)
- T-CVC-05: NBA Trust Account Ledger (Replit: `webwaka-professional`)

**Parallel Group C: Institutional & Mass Market**
- T-MM-01: JAMB/WAEC API Integration (Replit: `webwaka-institutional`)
- T-MM-02: Offline Tithe Logging (Replit: `webwaka-civic`)
- T-MM-03: WhatsApp Appointment Booking (Replit: `webwaka-services`)
- T-MM-04: ESVARBON API Verification (Replit: `webwaka-real-estate`)

---

## SECTION 12. Refactor Priority Shortlist

The following high-impact refactors will accelerate platform convergence toward the target architecture and should be prioritized above new feature development.

1. **Event Schema Unification:** The fragmented `WebWakaEvent<T>` schema prevents cross-repo analytics and billing. Fixing this is the absolute highest priority.
2. **Delivery Zone & Tracking Extraction:** Removing spatial logic from Commerce into Logistics proves the "Build Once, Use Infinitely" model works across suites.
3. **Automated Tenant Provisioning:** Replacing manual KV injection with Service Bindings is critical for scaling beyond the current 50 active tenants.
4. **Offline Sync Standardization:** Moving the Dexie mutation queue logic from Civic/Transport into `@webwaka/core/sync` will accelerate the development of all future PWAs.
5. **Admin JWT Storage:** Moving the SA v2 token from `localStorage` to `HttpOnly` cookies closes a critical XSS vulnerability.

---

## SECTION 13. Open Risks and Unresolved Decisions

Based on the codebase audit and document synthesis, the following items remain unresolved and require architectural governance decisions.

1. **D1 Database Limits:** The current architecture uses a separate D1 database for each vertical suite per tenant. As the platform scales to thousands of tenants, this may hit Cloudflare's account-level D1 limits. *Decision required: Should small tenants share a pooled D1 database with strict `tenantId` isolation, while Enterprise tenants get dedicated D1s?*
2. **Cross-Repo Event Delivery Guarantees:** The current event bus relies on Cloudflare Queues. If a downstream consumer (e.g., SA v2 Billing) is down, events may be dropped after the retry limit. *Decision required: Should we implement a dead-letter queue (DLQ) with a manual replay UI in Super Admin?*
3. **Local AI Inference Hardware:** The "Vendor Neutral AI" invariant specifies Llama-3 local fallback. However, Cloudflare Workers AI limits may restrict the complexity of local inference compared to OpenRouter. *Decision required: What is the minimum acceptable capability for the offline/local AI fallback?*
4. **NIBSS/Paystack SLA Breaches:** Nigerian payment gateways frequently experience extended downtime. *Decision required: Should the platform implement an automated fallback from Paystack to Flutterwave/Monnify if failure rates exceed a threshold?*

---
*End of Master Synthesis Document. Generated by Manus AI.*

### Phase 3: High-Value Verticals

**TASK ID: T-MM-01**
- **Title:** JAMB/WAEC API Integration
- **Objective:** Integrate the `webwaka-institutional` education module with national examination APIs.
- **Why it exists:** Core feature of the Education epic (INS-1) for student onboarding.
- **Dependencies:** T-FND-01 (Event Bus), T-FND-03 (Tenant Provisioning)
- **Can run in parallel with:** T-MM-02, T-MM-03, T-MM-04
- **Execution Target:** Replit (`webwaka-institutional`)
- **Primary affected repos:** `webwaka-institutional`
- **Required governance:** `webwaka_11_repos_research_report.md`
- **Expected outputs:** `POST /students/verify-exam` API endpoint calling JAMB/WAEC.
- **Acceptance criteria:** Validates student registration numbers against mock national APIs and creates student records.
- **Risks / drift warnings:** Do not hardcode API keys; retrieve them from the tenant's KV configuration.

**TASK ID: T-MM-02**
- **Title:** Offline Tithe Logging
- **Objective:** Implement Dexie-based offline mutation queue for church donations in the Civic suite.
- **Why it exists:** Core feature of the Church/NGO epic (CIV-1) for rural offline environments.
- **Dependencies:** T-FND-01 (Event Bus)
- **Can run in parallel with:** T-MM-01, T-MM-03, T-MM-04
- **Execution Target:** Replit (`webwaka-civic`)
- **Primary affected repos:** `webwaka-civic`
- **Required governance:** `webwaka_11_repos_research_report.md`
- **Expected outputs:** Dexie database schema and sync engine for donations.
- **Acceptance criteria:** PWA successfully logs tithes offline and syncs to D1 upon reconnection.
- **Risks / drift warnings:** Ensure conflict resolution strategy favors the server timestamp.

**TASK ID: T-MM-03**
- **Title:** WhatsApp Appointment Booking
- **Objective:** Integrate the `webwaka-services` appointment module with the WhatsApp Business API.
- **Why it exists:** Core feature of the Services epic (SRV-2) for SME adoption.
- **Dependencies:** T-FND-05 (Termii/Yournotify Notifications)
- **Can run in parallel with:** T-MM-01, T-MM-02, T-MM-04
- **Execution Target:** Replit (`webwaka-services`)
- **Primary affected repos:** `webwaka-services`
- **Required governance:** `webwaka_11_repos_research_report.md`
- **Expected outputs:** Webhook handler for incoming WhatsApp messages and appointment scheduling logic.
- **Acceptance criteria:** Users can book an appointment via a simulated WhatsApp chat flow.
- **Risks / drift warnings:** Must route all WhatsApp API calls through `@webwaka/core/notifications`, not directly.

**TASK ID: T-MM-04**
- **Title:** ESVARBON API Verification
- **Objective:** Integrate the `webwaka-real-estate` module with the Estate Surveyors and Valuers Registration Board.
- **Why it exists:** Core feature of the Real Estate epic (RES-1) for agent verification.
- **Dependencies:** T-FND-01 (Event Bus)
- **Can run in parallel with:** T-MM-01, T-MM-02, T-MM-03
- **Execution Target:** Replit (`webwaka-real-estate`)
- **Primary affected repos:** `webwaka-real-estate`
- **Required governance:** `webwaka_11_repos_research_report.md`
- **Expected outputs:** `POST /agents/verify` API endpoint calling ESVARBON.
- **Acceptance criteria:** Validates agent registration numbers and activates their profile.
- **Risks / drift warnings:** Handle API timeouts gracefully and allow manual verification fallback.

---

### T-MM-01: JAMB/WAEC API Integration

**PROMPT 1 — IMPLEMENTATION**
```markdown
TASK ID: T-MM-01
TARGET: Replit (`webwaka-institutional`)

CONTEXT:
The Institutional suite needs to integrate with JAMB/WAEC APIs for student onboarding in the Education module.

INVARIANTS:
- Tenant-as-Code: API keys must be retrieved from KV, not hardcoded.

INSTRUCTIONS:
1. Review `webwaka_11_repos_research_report.md` for context.
2. Implement `POST /students/verify-exam` in `webwaka-institutional`.
3. Create a mock integration service for JAMB/WAEC that accepts a registration number and returns a mock student profile.
4. Ensure the endpoint creates a student record in the D1 database upon successful verification.
5. Write Vitest tests to cover successful and failed verification scenarios.

OUTPUT:
Provide the updated API handler and test results. Format your completion statement as: "TASK T-MM-01 COMPLETE: JAMB/WAEC integration implemented."
```

**PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX**
```markdown
TASK ID: T-MM-01
TARGET: Replit (`webwaka-institutional`)

CONTEXT:
The JAMB/WAEC integration was implemented for student onboarding.

INSTRUCTIONS:
1. Understand the intended scope: The API must verify student registration numbers and create records.
2. Audit the codebase: Check for hardcoded API keys. Verify that the D1 database schema is updated correctly.
3. If you find any omissions, regressions, or invariant violations, FIX THE CODE DIRECTLY. Do not merely report the issue.
4. Re-run the test suites after applying fixes.

OUTPUT:
Provide a detailed report of any bugs found and fixed. Format your completion statement as: "TASK T-MM-01 QA COMPLETE: JAMB/WAEC integration verified."
```

### T-MM-02: Offline Tithe Logging

**PROMPT 1 — IMPLEMENTATION**
```markdown
TASK ID: T-MM-02
TARGET: Replit (`webwaka-civic`)

CONTEXT:
The Civic suite needs an offline-first PWA for logging church donations (tithes) in rural areas with poor connectivity.

INVARIANTS:
- Mobile/PWA/Offline First: Must use Dexie for local persistence.

INSTRUCTIONS:
1. Review `webwaka_11_repos_research_report.md` for context.
2. Implement a Dexie database schema in the `webwaka-civic` frontend for `donations`.
3. Build a sync engine that pushes local mutations to the D1 backend when online.
4. Ensure the UI clearly indicates offline status and pending sync counts.
5. Write Playwright E2E tests to simulate offline mode and subsequent sync.

OUTPUT:
Provide the Dexie schema and sync logic. Format your completion statement as: "TASK T-MM-02 COMPLETE: Offline tithe logging implemented."
```

**PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX**
```markdown
TASK ID: T-MM-02
TARGET: Replit (`webwaka-civic`)

CONTEXT:
Offline tithe logging was implemented using Dexie.

INSTRUCTIONS:
1. Understand the intended scope: The PWA must work entirely offline and sync automatically upon reconnection.
2. Audit the codebase: Verify the Dexie schema matches the D1 schema. Check the conflict resolution logic.
3. If you find any omissions, regressions, or invariant violations, FIX THE CODE DIRECTLY. Do not merely report the issue.
4. Re-run the test suites after applying fixes.

OUTPUT:
Provide a detailed report of any bugs found and fixed. Format your completion statement as: "TASK T-MM-02 QA COMPLETE: Offline tithe logging verified."
```

### T-MM-03: WhatsApp Appointment Booking

**PROMPT 1 — IMPLEMENTATION**
```markdown
TASK ID: T-MM-03
TARGET: Replit (`webwaka-services`)

CONTEXT:
The Services suite needs to allow SME customers to book appointments via WhatsApp.

INVARIANTS:
- Build Once Use Infinitely: Must use `@webwaka/core/notifications` for WhatsApp communication.

INSTRUCTIONS:
1. Review `webwaka_11_repos_research_report.md` for context.
2. Implement a webhook handler in `webwaka-services` to receive incoming WhatsApp messages.
3. Build a simple conversational state machine to parse dates and services.
4. Integrate with the existing appointment scheduling logic.
5. Ensure outbound messages are routed through the shared notification service.

OUTPUT:
Provide the webhook handler and state machine logic. Format your completion statement as: "TASK T-MM-03 COMPLETE: WhatsApp appointment booking implemented."
```

**PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX**
```markdown
TASK ID: T-MM-03
TARGET: Replit (`webwaka-services`)

CONTEXT:
WhatsApp appointment booking was implemented via a webhook handler.

INSTRUCTIONS:
1. Understand the intended scope: Users must be able to book appointments through a simulated WhatsApp flow.
2. Audit the codebase: Verify that outbound messages strictly use `@webwaka/core/notifications`. Check the robustness of the conversational state machine.
3. If you find any omissions, regressions, or invariant violations, FIX THE CODE DIRECTLY. Do not merely report the issue.
4. Re-run the test suites after applying fixes.

OUTPUT:
Provide a detailed report of any bugs found and fixed. Format your completion statement as: "TASK T-MM-03 QA COMPLETE: WhatsApp booking verified."
```

### T-MM-04: ESVARBON API Verification

**PROMPT 1 — IMPLEMENTATION**
```markdown
TASK ID: T-MM-04
TARGET: Replit (`webwaka-real-estate`)

CONTEXT:
The Real Estate suite needs to verify agents against the ESVARBON registry.

INVARIANTS:
- Tenant-as-Code: API keys must be retrieved from KV.

INSTRUCTIONS:
1. Review `webwaka_11_repos_research_report.md` for context.
2. Implement `POST /agents/verify` in `webwaka-real-estate`.
3. Create a mock integration service for ESVARBON that accepts a registration number.
4. Ensure the endpoint activates the agent profile upon successful verification.
5. Write Vitest tests to cover verification flows.

OUTPUT:
Provide the updated API handler and test results. Format your completion statement as: "TASK T-MM-04 COMPLETE: ESVARBON API verification implemented."
```

**PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX**
```markdown
TASK ID: T-MM-04
TARGET: Replit (`webwaka-real-estate`)

CONTEXT:
ESVARBON API verification was implemented for real estate agents.

INSTRUCTIONS:
1. Understand the intended scope: The API must verify agent registration numbers and activate profiles.
2. Audit the codebase: Check for hardcoded API keys. Verify fallback logic for API timeouts.
3. If you find any omissions, regressions, or invariant violations, FIX THE CODE DIRECTLY. Do not merely report the issue.
4. Re-run the test suites after applying fixes.

OUTPUT:
Provide a detailed report of any bugs found and fixed. Format your completion statement as: "TASK T-MM-04 QA COMPLETE: ESVARBON verification verified."
```
