# PHASE 2 PROMPTS — Core Vertical Consolidation

This file contains all copy-paste implementation and QA prompts for Phase 2.

**Tasks in this phase:** T-CVC-01, T-CVC-02, T-CVC-03

**Execution target:** Manus (cross-repo orchestration)

**Note on deduplication:** T-CVC-04 (NIBSS NIP) and T-CVC-05 (NBA Trust Account) were originally in this phase but have been superseded by the deeper, repo-specific implementations T-FIN-01 and T-PRO-01 in Phase 7. Execute Phase 7 tasks instead.

---

TASK T-CVC-01 — Extract Delivery Zones from Commerce to Logistics
- Task objective: Remove duplicated spatial logic from Single-Vendor and Multi-Vendor modules and centralize it in the Logistics API.
- Why this task exists: Commerce should not manage logistics routing; duplication violates "Build Once, Use Infinitely."
- Dependencies: T-FND-01
- Parallel execution notes: Can run in parallel with T-CVC-02, T-CVC-03, T-CVC-04, T-CVC-05.
- Execution target: Manus (cross-repo orchestration)
- Affected repos: `webwaka-commerce`, `webwaka-logistics`
- Required governance/docs to consult: `webwaka_commerce_research_report.md`
- Acceptance criteria: Commerce no longer contains delivery zone schemas or routing logic.
- Risks / drift warnings: Network latency between Commerce and Logistics could impact checkout speed.

PROMPT 1 — IMPLEMENTATION
```markdown
TASK ID: T-CVC-01
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Delivery zone mapping is currently duplicated in the Single-Vendor and Multi-Vendor Commerce modules. This spatial logic belongs in the Logistics suite.

INVARIANTS:
- Build Once, Use Infinitely: Remove duplication; centralize in Logistics.
- Multi-Repo Platform Architecture: Treat repos as modular components.
- Governance-Driven Execution: No assumptions; consult governance docs for 100% compliance.
- Thoroughness Over Speed: Depth, validation, and architectural integrity are non-negotiable.

INSTRUCTIONS:
1. Deep review: Read `webwaka_commerce_research_report.md` for context on the duplication.
2. Inspect the delivery zone logic in `webwaka-commerce` and plan its extraction.
3. Build a new `GET /delivery-zones` API endpoint in `webwaka-logistics` that returns pricing based on vendor/customer location.
4. Refactor `webwaka-commerce` to remove local delivery zone tables and logic. Do not drift from this instruction.
5. Update Commerce checkout flows to query the new Logistics API for shipping estimates.
6. Run tests in both repos to ensure checkout still functions correctly.

OUTPUT:
Provide a summary of the removed Commerce code and the new Logistics API. Format your completion statement as: "TASK T-CVC-01 COMPLETE: Delivery zones extracted to Logistics."
```

PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX
```markdown
TASK ID: T-CVC-01
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Delivery zones were extracted from Commerce and centralized in Logistics.

INSTRUCTIONS:
1. Understand intended behavior: Commerce should no longer contain any delivery zone logic; it must rely entirely on the Logistics API.
2. Compare intended vs actual: Audit the codebase by searching `webwaka-commerce` for lingering delivery zone schemas or hardcoded fallback logic.
3. Verify that the Logistics API handles errors gracefully (e.g., if a customer is outside all defined zones). Look for brittle error handling.
4. FIX THE CODE DIRECTLY: If you find lingering duplication, brittle error handling, or invariant violations, fix the code properly. Do not merely report the issue.
5. Re-test: Re-test the cross-repo checkout flow after applying fixes.
6. Conclude only when the task is genuinely complete.

OUTPUT:
Provide a report of any lingering duplication removed or error handling improved. Format your completion statement as: "TASK T-CVC-01 QA COMPLETE: Delivery zone extraction verified."
```

======================================================================
TASK T-CVC-02 — Consolidate Order Tracking Logic
- Task objective: Move duplicated tracking logic from Commerce into a centralized Logistics portal.
- Why this task exists: Real-time rider tracking belongs in Logistics.
- Dependencies: T-FND-01
- Parallel execution notes: Can run in parallel with T-CVC-01, T-CVC-03, T-CVC-04, T-CVC-05.
- Execution target: Manus (cross-repo orchestration)
- Affected repos: `webwaka-commerce`, `webwaka-logistics`
- Required governance/docs to consult: `webwaka_commerce_research_report.md`
- Acceptance criteria: Commerce delegates all tracking views to the Logistics portal.
- Risks / drift warnings: Event delivery failures could result in stale tracking data.

PROMPT 1 — IMPLEMENTATION
```markdown
TASK ID: T-CVC-02
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Order tracking logic is duplicated in Commerce. Real-time rider tracking should be powered by the Logistics portal.

INVARIANTS:
- Build Once, Use Infinitely: Remove duplication; centralize in Logistics.
- Event-Driven Architecture: Use `delivery.status_changed` events.
- Multi-Repo Platform Architecture: Treat each repo as a modular component of one integrated ecosystem.
- Thoroughness Over Speed: Depth, validation, and architectural integrity are non-negotiable.

INSTRUCTIONS:
1. Deep review: Read `webwaka_commerce_research_report.md` for context on the tracking duplication.
2. Inspect the tracking logic in `webwaka-commerce`. Plan the consolidation.
3. Enhance the `webwaka-logistics` portal to consume `delivery.status_changed` events and display real-time tracking.
4. Refactor `webwaka-commerce` to remove local tracking views and redirect users to the Logistics tracking portal URL. Do not drift from this instruction.
5. Ensure the redirect includes a secure, signed token to prevent unauthorized viewing of tracking data.
6. Test the event consumption and redirect flow locally.

OUTPUT:
Provide a summary of the redirect logic in Commerce and the event consumption in Logistics. Format your completion statement as: "TASK T-CVC-02 COMPLETE: Order tracking consolidated in Logistics."
```

PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX
```markdown
TASK ID: T-CVC-02
TARGET: Manus (cross-repo orchestration)

CONTEXT:
Order tracking logic was consolidated into the Logistics portal, with Commerce redirecting users.

INSTRUCTIONS:
1. Understand intended behavior: Commerce should only redirect; Logistics handles the UI and event consumption.
2. Compare intended vs actual: Audit the codebase by verifying the security of the tracking redirect token. Check that Logistics correctly updates the UI upon receiving a `delivery.status_changed` event.
3. Verify that Commerce has fully removed its local tracking views. Look for lingering UI components.
4. FIX THE CODE DIRECTLY: If the token is insecure, the event consumption is brittle, or bugs are found, fix the code properly. Do not merely report the issue.
5. Re-test: Re-test the tracking flow end-to-end after applying fixes.
6. Conclude only when the task is genuinely complete.

OUTPUT:
Provide a report of any security or event handling fixes applied. Format your completion statement as: "TASK T-CVC-02 QA COMPLETE: Order tracking consolidation verified."
```

======================================================================
TASK T-CVC-03 — Implement Offline Dexie Sync for Transport
- Task objective: Build an offline-first PWA for bus park agents using Dexie.js for local persistence.
- Why this task exists: Internet connectivity is unreliable at Nigerian bus parks; agents need to continue selling tickets offline.
- Dependencies: None.
- Parallel execution notes: Can run in parallel with T-CVC-01, T-CVC-02, T-CVC-04, T-CVC-05.
- Execution target: Replit (`webwaka-transport`)
- Affected repos: `webwaka-transport`
- Required governance/docs to consult: `webwaka_transport_research_report.md`
- Acceptance criteria: Agents can issue tickets offline; mutations sync automatically to D1 when reconnected.
- Risks / drift warnings: Conflict resolution must handle double-booking of seats during offline periods.

PROMPT 1 — IMPLEMENTATION
```markdown
TASK ID: T-CVC-03
TARGET: Replit (`webwaka-transport`)

CONTEXT:
Bus park agents frequently experience network drops. The Transport suite requires an offline-first PWA to allow continuous ticket sales, syncing data to the backend when connectivity is restored.

INVARIANTS:
- Mobile/PWA/Offline First: All frontend modules MUST use Dexie/IndexedDB for local-first persistence.
- Nigeria-First, Africa-Ready: Architecture must handle local connectivity realities.
- Thoroughness Over Speed: Depth, validation, and architectural integrity are non-negotiable.

INSTRUCTIONS:
1. Deep review: Read `webwaka_transport_research_report.md` to understand the bus park agent workflow.
2. Inspect the frontend architecture in `webwaka-transport`. Plan the Dexie integration.
3. Implement a Dexie database schema for `tickets`, `trips`, and `mutations`.
4. Build a sync engine that pushes local mutations to the D1 backend when online.
5. Implement conflict resolution logic to handle cases where an offline-sold seat was already booked online. Do not drift from this requirement.
6. Write Playwright E2E tests to simulate offline mode, ticket sales, and subsequent sync.

OUTPUT:
Provide a summary of the Dexie schema, sync engine, and conflict resolution logic. Format your completion statement as: "TASK T-CVC-03 COMPLETE: Offline Dexie sync implemented for Transport."
```

PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX
```markdown
TASK ID: T-CVC-03
TARGET: Replit (`webwaka-transport`)

CONTEXT:
An offline-first PWA using Dexie was implemented for Transport bus park agents.

INSTRUCTIONS:
1. Understand intended behavior: The PWA must allow offline ticket sales and sync mutations to D1, handling conflicts gracefully.
2. Compare intended vs actual: Audit the codebase to verify the Dexie schema matches the D1 schema. Check the robustness of the sync engine and conflict resolution logic.
3. Verify that the UI clearly indicates offline status and pending sync counts. Look for missing UI feedback.
4. FIX THE CODE DIRECTLY: If you find schema mismatches, brittle sync logic, poor conflict resolution, or missing UI elements, fix the code properly. Do not merely report the issue.
5. Re-test: Re-run the E2E tests after applying fixes.
6. Conclude only when the task is genuinely complete.

OUTPUT:
Provide a report of any sync, schema, or UI fixes applied. Format your completion statement as: "TASK T-CVC-03 QA COMPLETE: Transport offline sync verified."
```

