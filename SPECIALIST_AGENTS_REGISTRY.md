# WebWaka OS v4: Specialist Agents Registry

**Document Type:** Agent Configuration
**Status:** Active

This document defines the specialist agents required to execute the comprehensive platform roadmap. It includes both existing agents from the Agency Directory and new domain-specific agents that must be created.

---

## 1. Existing Agency Agents (To Be Reused)

The following agents from the `AGENCY_AGENTS_COMPREHENSIVE_SKILLS_DIRECTORY.md` will be heavily utilized across all phases:

| Agent Name | Primary Role | Usage in WebWaka |
|------------|--------------|------------------|
| **Backend Architect** | System design, API development | Core primitives, database schemas, Hono APIs |
| **Frontend Developer** | React/Vite implementation | PWA UIs, offline sync integration |
| **UI Designer** | Visual design systems | Tenant admin dashboards, customer portals |
| **Security Engineer** | Threat modeling, RBAC | JWT validation, tenant isolation, compliance |
| **Data Engineer** | Database architecture | D1 schemas, Hyperdrive optimization |
| **DevOps Automator** | CI/CD, Infrastructure | GitHub Actions, Cloudflare deployments |
| **AI Engineer** | ML model integration | OpenRouter BYOK abstraction, AI features |
| **API Tester** | Quality assurance | E2E testing, Playwright, Vitest |

---

## 2. New Domain-Specific Agents (To Be Created)

To ensure domain expertise for specific vertical suites, the following new agents must be created as `SKILL.md` files in the `/agents/` directory before their respective phases begin.

### 2.1 webwaka-fintech-architect
**Required For:** Phase 3 (Fintech Ecosystem)
**Expertise:**
- Core banking ledger design (immutable double-entry)
- Nigerian payment gateways (Paystack, Flutterwave)
- CBN compliance (NQR, NIBSS NIP)
- Agency banking float management

### 2.2 webwaka-transport-specialist
**Required For:** Phase 4 (Transportation & Mobility)
**Expertise:**
- Seat inventory algorithms (atomic validation)
- Route and fleet scheduling state machines
- Offline-first ticketing for bus parks

### 2.3 webwaka-crm-specialist
**Required For:** Phase 5 (Cross-Cutting Modules)
**Expertise:**
- Customer data modeling
- Multi-tenant data segregation
- Workflow automation engines

### 2.4 webwaka-compliance-officer
**Required For:** All Phases
**Expertise:**
- NDPR (Nigeria Data Protection Regulation)
- AML/CFT (Anti-Money Laundering)
- NAFDAC/SON compliance for specific verticals

---

## 3. Agent Orchestration Workflow

When executing a specific epic (e.g., `FIN-1: Core Banking`), the `webwaka-engineering-orchestrator` will:

1. Read the Epic definition from the Roadmap.
2. Spawn the `webwaka-fintech-architect` to design the schema.
3. Spawn the `Backend Architect` to implement the Hono API.
4. Spawn the `Security Engineer` to verify KYC compliance.
5. Spawn the `API Tester` to write the Vitest suite.
6. Hand off to `webwaka-qa-governance` for final approval.
