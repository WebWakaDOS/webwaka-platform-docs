# PHASE 3 PROMPTS — High-Value Verticals

This file contains all copy-paste implementation and QA prompts for Phase 3.

**Tasks in this phase:** T-MM-03

**Execution target:** Replit (`webwaka-services`)

**Note on deduplication:** T-MM-01 (JAMB/WAEC), T-MM-02 (Offline Tithe), and T-MM-04 (ESVARBON) were originally in this phase but have been superseded by the deeper, repo-specific implementations T-INS-01, T-CIV-01, and T-RES-01 in Phase 7. Execute Phase 7 tasks instead.

---

TASK T-MM-03 — WhatsApp Appointment Booking
- Task objective: Integrate the `webwaka-services` appointment module with the WhatsApp Business API.
- Why this task exists: Core feature of the Services epic (SRV-2) for SME adoption.
- Dependencies: T-FND-05 (Termii/Yournotify Notifications)
- Parallel execution notes: Can run in parallel with T-MM-01, T-MM-02, T-MM-04.
- Execution target: Replit (`webwaka-services`)
- Affected repos: `webwaka-services`
- Required governance/docs to consult: `webwaka_11_repos_research_report.md`
- Acceptance criteria: Users can book an appointment via a simulated WhatsApp chat flow.
- Risks / drift warnings: Must route all WhatsApp API calls through `@webwaka/core/notifications`, not directly.

PROMPT 1 — IMPLEMENTATION
```markdown
TASK ID: T-MM-03
TARGET: Replit (`webwaka-services`)

CONTEXT:
The Services suite needs to allow SME customers to book appointments via WhatsApp.

INVARIANTS:
- Build Once Use Infinitely: Must use `@webwaka/core/notifications` for WhatsApp communication.
- Nigeria-First, Africa-Ready: Architecture must handle local communication realities.
- Thoroughness Over Speed: Depth, validation, and architectural integrity are non-negotiable.

INSTRUCTIONS:
1. Deep review: Read `webwaka_11_repos_research_report.md` for context on WhatsApp appointment booking.
2. Inspect the webhook and appointment logic in `webwaka-services`. Plan the integration.
3. Implement a webhook handler in `webwaka-services` to receive incoming WhatsApp messages.
4. Build a simple conversational state machine to parse dates and services. Do not drift from this instruction.
5. Integrate with the existing appointment scheduling logic.
6. Ensure outbound messages are routed through the shared notification service.

OUTPUT:
Provide the webhook handler and state machine logic. Format your completion statement as: "TASK T-MM-03 COMPLETE: WhatsApp appointment booking implemented."
```

PROMPT 2 — QA / TEST / MISSING-WORK / BUG-FIX
```markdown
TASK ID: T-MM-03
TARGET: Replit (`webwaka-services`)

CONTEXT:
WhatsApp appointment booking was implemented via a webhook handler.

INSTRUCTIONS:
1. Understand intended behavior: Users must be able to book appointments through a simulated WhatsApp flow, routing outbound messages through core notifications.
2. Compare intended vs actual: Audit the codebase to verify that outbound messages strictly use `@webwaka/core/notifications`. Check the robustness of the conversational state machine.
3. Verify the integration with the existing appointment scheduling logic. Look for regressions or missing validation.
4. FIX THE CODE DIRECTLY: If you find direct WhatsApp API calls, a brittle state machine, or invariant violations, fix the code properly. Do not merely report the issue.
5. Re-test: Re-run the test suites after applying fixes.
6. Conclude only when the task is genuinely complete.

OUTPUT:
Provide a detailed report of any bugs found and fixed. Format your completion statement as: "TASK T-MM-03 QA COMPLETE: WhatsApp booking verified."
```

