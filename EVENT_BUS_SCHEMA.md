# WebWaka Platform Event Bus Schema

## Overview
The WebWaka Platform Event Bus (CORE-2) uses a standardized schema across all modules to ensure consistency and reliable cross-module communication.

## Standard Schema
All events emitted to the platform event bus MUST adhere to the following schema:

```typescript
export interface WebWakaEvent<T = unknown> {
  event: string;      // The event type (e.g., 'civic.event.created', 'parcel.created')
  tenantId: string;   // The ID of the tenant emitting the event
  payload: T;         // The event-specific payload
  timestamp: number;  // UTC Unix timestamp (ms)
}
```

## Key Invariants
1. **Tenant Isolation**: Every event MUST include a `tenantId`.
2. **Standardized Naming**: Event names MUST follow dot-notation (e.g., `module.entity.action`).
3. **Timestamp**: Every event MUST include a `timestamp` in milliseconds.
4. **Payload**: The `payload` MUST contain all necessary context for the event, but SHOULD NOT contain sensitive PII unless strictly necessary and encrypted.

## Helpers
The `@webwaka/core` package provides a standardized helper for emitting events:

```typescript
import { emitEvent } from '@webwaka/core';

await emitEvent(env, 'module.entity.action', tenantId, payload);
```

## Audit
- **Civic**: Uses `CivicEvent` with `type`, `tenantId`, `organizationId`, `payload`, `timestamp`, `version`. Needs migration to standard schema.
- **Professional**: Uses `PlatformEvent` with `id`, `tenantId`, `type`, `sourceModule`, `timestamp`, `payload`. Needs migration to standard schema.
- **Logistics**: Uses `EventPayload` with `event`, `tenantId`, `parcelId`, `trackingNumber`, `timestamp`, `data`. Needs migration to standard schema.
