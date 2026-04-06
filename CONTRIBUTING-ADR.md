# Contributing an Architectural Decision Record (ADR)

**Scope:** All WebWaka OS v4 repositories  
**Owner:** Platform Architecture Team  
**Last Updated:** 2026-04-06

---

## What Is an ADR?

An Architectural Decision Record (ADR) is a short document that captures a significant architectural decision — the context that drove it, the decision itself, and its consequences. ADRs are the canonical record of *why* the platform is built the way it is.

Every significant technical decision that affects more than one team, repo, or long-term capability **must** be recorded as an ADR.

---

## When to Write an ADR

Write an ADR when a decision:

- Affects the design or API surface of a shared primitive (`@webwaka/core`)
- Introduces or changes a cross-repo integration pattern (event bus, webhooks, AI routing)
- Selects a new infrastructure provider or service (e.g., switching payment processors)
- Establishes a new compliance or security boundary (NDPR, HIPAA, PCI)
- Resolves a fundamental conflict between two or more of the 7 Core Invariants
- Deprecates or supersedes a previous ADR

If you are unsure whether a decision warrants an ADR, ask in `#platform-architecture` on the internal chat. When in doubt, write one.

---

## Naming Convention

ADR files must be placed in `/content/adrs/` and named as follows:

```
ADR-{NUMBER}-{kebab-case-title}.md
```

**Examples:**
```
ADR-004-paystack-kobo-integer-enforcement.md
ADR-005-openrouter-vendor-neutral-ai-routing.md
ADR-006-offline-first-indexeddb-mutation-queue.md
```

Numbers are **sequential and never reused**. Even if an ADR is rejected, its number is retired. Check the `/content/adrs/` directory for the next available number before creating a file.

---

## ADR Lifecycle & Statuses

| Status | Meaning |
|--------|---------|
| **Proposed** | Draft under review. Not yet binding. |
| **Accepted** | Approved by the Architecture Review Board. All teams must comply. |
| **Rejected** | Considered and declined. Document remains for historical context. |
| **Deprecated** | Was accepted but is no longer the recommended approach. A replacement ADR should exist. |
| **Superseded** | Formally replaced by a newer ADR. Reference the superseding ADR number in the header. |

---

## Process: How to Propose, Review, and Finalize an ADR

### Step 1: Copy the Template

```bash
cp content/adrs/adr-template.md content/adrs/ADR-XXXX-your-decision-title.md
```

Replace `XXXX` with the next sequential number. Set the status to `Proposed`.

### Step 2: Fill Out the Template

Complete all sections of the template:
- **Context** — What problem are you solving? What constraints apply?
- **Decision** — What have you decided to do?
- **Consequences** — What are the trade-offs?
- **Alternatives Considered** — What else did you evaluate and why was it rejected?
- **Compliance & Invariant Check** — Verify the decision does not violate any of the 7 Core Invariants.

Do **not** leave placeholder text or `[TODO]` markers in a Proposed ADR. Every section must be substantive.

### Step 3: Open a Pull Request

Open a PR to `webwaka-platform-docs` with:
- **Title:** `[ADR-XXXX] Short decision title`
- **Description:** A one-paragraph summary of the decision and why it matters
- **Reviewers:** Tag at least two members of the Platform Architecture Team

### Step 4: Architecture Review

The Architecture Review Board (ARB) will:
1. Check for conflicts with existing ADRs
2. Verify invariant compliance
3. Assess cross-repo impact
4. Request changes or approve

The review period is a minimum of **2 business days** for non-urgent decisions. Emergency ADRs (P0 incidents) may be fast-tracked with verbal approval documented in the PR within 24 hours.

### Step 5: Finalize

Once approved:
1. Update the status field from `Proposed` to `Accepted` (or `Rejected`)
2. Set the `Date` to the approval date
3. List the final deciders in the `Deciders` field
4. Merge the PR — the ADR is now canonical and binding

### Step 6: Communicate

After merging an `Accepted` ADR:
- Post a summary in `#engineering-announcements`
- Update any affected repo's `README.md` or implementation guide to reference the ADR
- If the ADR supersedes a previous one, update the old ADR's status to `Superseded by ADR-XXXX`

---

## Reviewing an ADR (Reviewer Checklist)

When reviewing an ADR PR, verify:

- [ ] The problem in **Context** is clearly and specifically described
- [ ] The **Decision** is stated in active voice and is unambiguous
- [ ] **Consequences** honestly lists both positives and trade-offs
- [ ] At least two **Alternatives** were considered with reasons for rejection
- [ ] The **Invariant Check** table is complete and no violations are accepted without justification
- [ ] The naming convention and sequential numbering are correct
- [ ] The ADR does not introduce code — it documents decisions only

---

## Style Guidelines

- Write in clear, plain English. Assume the reader is a competent engineer but unfamiliar with this specific decision.
- Use active voice: "We will use X" not "X will be used."
- Be specific. Vague ADRs create drift. Name the service, library, or pattern explicitly.
- Keep ADRs focused on a single decision. If you have multiple decisions, write multiple ADRs.
- Include ASCII or Mermaid diagrams where they aid understanding.

---

## Questions & Contact

- **ADR Process:** Platform Architecture Team — `#platform-architecture` (internal chat)
- **Emergency ADR (P0):** Escalate directly to the VP Engineering
- **Documentation issues:** Open an issue in `webwaka-platform-docs`
