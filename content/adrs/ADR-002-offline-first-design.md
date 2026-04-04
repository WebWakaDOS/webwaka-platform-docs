# ADR-002: Offline-First Design via Dexie.js + Mutation Queue

**Status:** Accepted  
**Date:** 2025-11-25  
**Deciders:** Frontend Architecture Team  
**Blueprint Reference:** Part 5.1 — Offline Resilience

---

## Context

Nigeria has 72% mobile internet penetration but frequent connectivity drops (2G/3G fallback, load-shedding affecting towers). A POS system that fails when offline would be unusable for our target market. The platform must function fully without internet and sync when connectivity is restored.

## Decision

All WebWaka frontend applications will use **Dexie.js** (IndexedDB wrapper) as the primary data store, with a **Mutation Queue** for write operations and a **Background Sync** service worker for deferred synchronisation.

### Data Flow (Online)

```
User Action → React Component → API Client → Server → Dexie Cache
```

### Data Flow (Offline)

```
User Action → React Component → Dexie Local Store → Mutation Queue
                                                          ↓
                              (connectivity restored) → Background Sync → Server
```

### Conflict Resolution

When a locally queued mutation conflicts with a server-side change:
1. **Last-Write-Wins** for non-critical fields (names, descriptions)
2. **Server-Wins** for financial amounts (inventory, balances)
3. **User-Prompted** for status changes (order status, trip status)

All conflicts are logged to `conflict_log` table for audit.

### Offline Capabilities by Module

| Module | Offline Read | Offline Write | Sync Strategy |
|--------|-------------|---------------|---------------|
| Commerce POS | ✅ Full | ✅ Full | Queue → Background Sync |
| Product Catalogue | ✅ Full | ❌ No | Periodic refresh (1h) |
| Order Management | ✅ 7 days | ✅ Create only | Queue → Background Sync |
| Fintech Wallet | ✅ Last known | ❌ No | On reconnect |
| Transport Fleet | ✅ Last known | ✅ Status only | Real-time when online |

## Consequences

**Positive:**
- POS works during outages — critical for market stalls and shops with unstable power
- Reduces server load (client caches reduce repeat fetches by ~60%)
- Lighthouse PWA score ≥ 90

**Negative:**
- IndexedDB storage limits (~50MB per origin) — mitigated by LRU eviction
- Conflict resolution complexity — addressed by clear domain rules above
- Testing complexity — requires offline simulation in test suites

## Alternatives Considered

1. **PouchDB** — More complex API, larger bundle; rejected
2. **LocalStorage** — Not suitable for relational data or large datasets; rejected
3. **Service Worker Cache API only** — No structured query support; rejected
