# ADR-001: Multi-Tenant Architecture via Cloudflare KV Isolation

**Status:** Accepted  
**Date:** 2025-11-10  
**Deciders:** Platform Architecture Team  
**Blueprint Reference:** Part 3.2 — Infrastructure Layer

---

## Context

WebWaka OS v4 must serve thousands of independent business tenants (retail shops, transport fleets, logistics companies) from a single platform deployment. Each tenant needs isolated data, configuration, and branding — but sharing infrastructure costs must remain low for the Nigerian SME market.

## Decision

We will use **Cloudflare KV** for tenant configuration isolation with a **shared Postgres database** (row-level security by `tenant_id`) for transactional data, and **Cloudflare Durable Objects** for real-time per-tenant state.

### Architecture Pattern

```
Request → Cloudflare Worker
  ↓ Read tenantConfig from KV (tenant:{slug})
  ↓ Validate JWT with tenant-specific signing key
  ↓ Execute business logic
  ↓ Query Postgres with tenant_id filter (RLS enforced)
  ↓ Return response
```

### Tenant Isolation Layers

| Layer | Mechanism |
|-------|-----------|
| Config | Cloudflare KV namespace per environment |
| Auth | Per-tenant JWT signing keys |
| Data | Postgres Row-Level Security (`tenant_id` column) |
| Real-time | Cloudflare Durable Object per tenant |
| Assets | Cloudflare R2 bucket prefix per tenant |
| Branding | KV-stored CSS variables and logo URLs |

## Consequences

**Positive:**
- Zero cold-start latency (KV is edge-local)
- Hard data isolation via RLS — cross-tenant leaks are impossible at DB level
- Scales to 100,000+ tenants without schema changes

**Negative:**
- Cloudflare KV has eventual consistency (up to 60s) — not suitable for real-time config changes
- Durable Objects add latency for non-edge-collocated requests
- RLS adds ~5ms overhead per query

## Alternatives Considered

1. **Separate database per tenant** — Too expensive at scale; rejected
2. **Schema-per-tenant** — Complex migrations; rejected
3. **Redis for tenant config** — Requires self-managed infrastructure; rejected in favour of Cloudflare managed services
