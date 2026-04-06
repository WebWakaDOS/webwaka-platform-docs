# `webwaka-core` API Documentation

**Package:** `@webwaka/core`  
**Version:** v4.x  
**Last Audited:** 2026-04-06  
**Owner:** Platform Core Team  
**Status:** Production — Canonical Reference

---

## Overview

`webwaka-core` is the single source of truth for all shared platform primitives across the WebWaka OS v4 ecosystem. Every other repository imports from this package — none may re-implement these capabilities independently.

**Capabilities provided:**
- Authentication middleware and JWT utilities
- Role-Based Access Control (RBAC) engine
- KYC/KYB identity verification logic
- NDPR compliance helpers
- Rate limiting middleware
- Cloudflare D1 query helpers
- SMS/notifications (Termii, Yournotify)
- Tax and payment utilities (NGN / kobo integers)
- Event Bus type definitions and publishers
- Offline sync mutation queue primitives

> **Anti-Drift Rule:** No other WebWaka repo may implement its own auth, RBAC, KYC, or notification logic. All imports must come from `@webwaka/core`.

---

## Installation

```bash
# In any WebWaka vertical or service repo
npm install @webwaka/core
```

`@webwaka/core` is a private package distributed via the WebWaka internal npm registry. Configure your `.npmrc`:

```
@webwaka:registry=https://registry.webwaka.io/npm/
//registry.webwaka.io/npm/:_authToken=${WEBWAKA_NPM_TOKEN}
```

---

## Module Index

| Module | Import Path | Description |
|---|---|---|
| Auth | `@webwaka/core/auth` | JWT creation, validation, refresh |
| RBAC | `@webwaka/core/rbac` | Permission checks and role resolution |
| KYC | `@webwaka/core/kyc` | KYC/KYB status checks and event triggers |
| NDPR | `@webwaka/core/ndpr` | Data protection compliance utilities |
| Rate Limiting | `@webwaka/core/rate-limit` | Per-tenant rate limiter middleware |
| D1 Helpers | `@webwaka/core/db` | Cloudflare D1 typed query helpers |
| Notifications | `@webwaka/core/notify` | SMS and push notification dispatch |
| Payments | `@webwaka/core/payments` | Kobo integer utilities, Paystack helpers |
| Event Bus | `@webwaka/core/events` | Event publishing and type definitions |
| Offline Sync | `@webwaka/core/offline` | Mutation queue primitives (IndexedDB) |
| AI Primitives | `@webwaka/core/ai` | AI request routing via webwaka-ai-platform |

---

## Auth Module — `@webwaka/core/auth`

### `createJwt(payload, options)`

Creates a signed JWT for a user or service-to-service call.

```typescript
import { createJwt } from '@webwaka/core/auth';

const token = await createJwt(
  {
    sub: 'user_abc123',
    tenantId: 'tenant_xyz',
    roles: ['staff'],
  },
  {
    expiresIn: '8h',
    audience: 'webwaka-commerce',
  }
);
```

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `payload.sub` | `string` | Yes | Subject (user or service identifier) |
| `payload.tenantId` | `string` | Yes | Tenant this JWT is scoped to |
| `payload.roles` | `string[]` | Yes | RBAC roles assigned to the subject |
| `payload.scopes` | `string[]` | No | Additional OAuth-style scopes |
| `options.expiresIn` | `string` | No | JWT TTL (default: `'1h'`) |
| `options.audience` | `string` | No | Intended audience identifier |

**Returns:** `Promise<string>` — signed JWT string

---

### `validateJwt(token, options)`

Validates and decodes a JWT. Throws on invalid, expired, or tampered tokens.

```typescript
import { validateJwt } from '@webwaka/core/auth';

const payload = await validateJwt(token, {
  audience: 'webwaka-commerce',
  requiredTenantId: 'tenant_xyz',
});

console.log(payload.sub);      // 'user_abc123'
console.log(payload.roles);    // ['staff']
```

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `token` | `string` | Yes | The JWT string to validate |
| `options.audience` | `string` | No | Expected audience; throws if mismatch |
| `options.requiredTenantId` | `string` | No | Assert that JWT belongs to this tenant |

**Returns:** `Promise<JwtPayload>` — decoded and validated payload

**Throws:**
- `AuthError('INVALID_TOKEN')` — malformed or signature invalid
- `AuthError('TOKEN_EXPIRED')` — past expiry
- `AuthError('WRONG_AUDIENCE')` — audience mismatch
- `AuthError('TENANT_MISMATCH')` — tenantId mismatch

---

### `authMiddleware(options)` — Cloudflare Workers Middleware

```typescript
import { authMiddleware } from '@webwaka/core/auth';

// In your Cloudflare Worker router (e.g. Hono)
app.use('/v4/*', authMiddleware({ requiredRoles: ['staff', 'admin'] }));
```

Extracts the `Authorization: Bearer <token>` header, validates the JWT, and attaches the payload to `c.get('user')` (Hono context).

---

## RBAC Module — `@webwaka/core/rbac`

### Role Hierarchy

```
super_admin
  └── tenant_admin
        ├── manager
        │     └── staff
        └── finance_manager
              └── accountant
```

Roles are additive — a `manager` implicitly has all `staff` permissions.

### `checkPermission(role, permission)`

```typescript
import { checkPermission } from '@webwaka/core/rbac';

const allowed = checkPermission('manager', 'orders:read');
// true

const blocked = checkPermission('staff', 'billing:write');
// false
```

**Built-in Permissions (partial list):**

| Permission | Description |
|---|---|
| `orders:read` | View orders |
| `orders:write` | Create and update orders |
| `orders:delete` | Delete / cancel orders |
| `billing:read` | View billing and invoices |
| `billing:write` | Issue invoices and process payments |
| `users:manage` | Create, update, deactivate users |
| `settings:read` | View tenant settings |
| `settings:write` | Update tenant settings |
| `kyc:approve` | Approve or reject KYC submissions |
| `reports:export` | Export data reports |

### `requirePermission(permission)` — Middleware

```typescript
import { requirePermission } from '@webwaka/core/rbac';

app.post('/v4/orders', requirePermission('orders:write'), handleCreateOrder);
```

Attaches after `authMiddleware`. Throws `RbacError('FORBIDDEN')` if the authenticated user lacks the required permission.

---

## KYC Module — `@webwaka/core/kyc`

### `getKycStatus(userId, tenantId)`

Returns the current KYC status for a user.

```typescript
import { getKycStatus } from '@webwaka/core/kyc';

const status = await getKycStatus('user_abc123', 'tenant_xyz');
// { level: 'tier2', status: 'approved', updatedAt: '2026-01-15T...' }
```

**KYC Levels:**

| Level | Requirements | Limits |
|---|---|---|
| `tier0` | No verification | NGN 50,000 / transaction |
| `tier1` | BVN or NIN verified | NGN 500,000 / transaction |
| `tier2` | ID document + liveness | NGN 5,000,000 / transaction |
| `tier3` | Full KYB (business) | Unlimited |

### `requireKycLevel(level)` — Middleware

```typescript
import { requireKycLevel } from '@webwaka/core/kyc';

// Block access to high-value transactions unless KYC tier2+
app.post('/v4/transfers/large', requireKycLevel('tier2'), handleLargeTransfer);
```

Throws `KycError('INSUFFICIENT_KYC_LEVEL')` if the user's verified level is below the requirement.

---

## Payments Module — `@webwaka/core/payments`

> **Nigeria First:** All monetary values are stored and transmitted as **kobo integers** (1 NGN = 100 kobo). Never use floating-point numbers for amounts.

### `toKobo(naira)` and `fromKobo(kobo)`

```typescript
import { toKobo, fromKobo } from '@webwaka/core/payments';

toKobo(1500)      // 150000  (NGN 1,500 → 150,000 kobo)
fromKobo(150000)  // 1500    (150,000 kobo → NGN 1,500)
```

### `initializePaystackTransaction(params)`

```typescript
import { initializePaystackTransaction } from '@webwaka/core/payments';

const result = await initializePaystackTransaction({
  email: 'buyer@example.com',
  amountKobo: 150000,           // NGN 1,500 expressed in kobo
  reference: 'order_abc123',
  tenantId: 'tenant_xyz',
  metadata: { orderId: 'order_abc123' },
});

// Redirect user to result.authorizationUrl
```

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | Yes | Customer email address |
| `amountKobo` | `number` (integer) | Yes | Amount in kobo — must be a whole number |
| `reference` | `string` | Yes | Unique transaction reference |
| `tenantId` | `string` | Yes | Tenant initiating the transaction |
| `metadata` | `object` | No | Arbitrary metadata attached to the transaction |

### `verifyPaystackWebhook(payload, signature, secret)`

```typescript
import { verifyPaystackWebhook } from '@webwaka/core/payments';

const isValid = verifyPaystackWebhook(rawBody, req.headers['x-paystack-signature'], secret);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid webhook signature' });
}
```

Always verify Paystack webhook signatures before processing events. Never trust unsigned webhook payloads.

---

## Notifications Module — `@webwaka/core/notify`

### `sendSms(params)`

Dispatches an SMS via Termii (primary) with automatic failover to Yournotify.

```typescript
import { sendSms } from '@webwaka/core/notify';

await sendSms({
  to: '+2348012345678',
  message: 'Your OTP is 482910. Valid for 5 minutes.',
  tenantId: 'tenant_xyz',
  type: 'otp',
});
```

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `to` | `string` | Yes | E.164 phone number |
| `message` | `string` | Yes | SMS body text |
| `tenantId` | `string` | Yes | Tenant sending the SMS (for billing) |
| `type` | `'otp' \| 'transactional' \| 'marketing'` | Yes | Message type (affects routing priority and opt-out rules) |
| `senderId` | `string` | No | Registered sender ID; defaults to tenant's configured sender ID |

**Returns:** `Promise<{ messageId: string; provider: 'termii' | 'yournotify' }>`

---

## Event Bus Module — `@webwaka/core/events`

### Publishing Events

```typescript
import { publishEvent } from '@webwaka/core/events';

await publishEvent({
  type: 'order.placed',
  tenantId: 'tenant_xyz',
  payload: {
    orderId: 'order_abc123',
    amountKobo: 150000,
    customerId: 'cust_456',
  },
});
```

### Standard Event Types

| Event Type | Publisher | Consumers |
|---|---|---|
| `order.placed` | webwaka-commerce | webwaka-central-mgmt, webwaka-logistics |
| `payment.completed` | webwaka-fintech | webwaka-central-mgmt, webwaka-commerce |
| `payment.failed` | webwaka-fintech | webwaka-central-mgmt |
| `kyc.approved` | webwaka-core | All verticals |
| `tenant.suspended` | webwaka-central-mgmt | All repos |
| `ai.usage.billed` | webwaka-ai-platform | webwaka-central-mgmt |
| `webhook.delivered` | Any | webwaka-central-mgmt |
| `webhook.failed` | Any | webwaka-central-mgmt (DLQ) |

### Event Payload Schema

All events conform to this envelope:

```typescript
interface WebWakaEvent {
  id: string;           // UUID — auto-generated by publishEvent()
  type: string;         // Dot-notation event type (e.g. 'order.placed')
  tenantId: string;     // Tenant context
  timestamp: string;    // ISO 8601 UTC
  version: '1';         // Envelope schema version
  payload: Record<string, unknown>;  // Event-specific data
}
```

---

## D1 Query Helpers — `@webwaka/core/db`

All D1 queries enforce `tenant_id` isolation automatically when using these helpers.

```typescript
import { createDb } from '@webwaka/core/db';

const db = createDb(env.DB, { tenantId: 'tenant_xyz' });

// All queries automatically include WHERE tenant_id = 'tenant_xyz'
const orders = await db.query(
  'SELECT * FROM orders WHERE status = ?',
  ['pending']
);
```

> **Warning:** Never query D1 directly without using these helpers in a multi-tenant context. Raw queries that omit `tenant_id` filters are a data isolation vulnerability.

---

## Error Reference

All `@webwaka/core` errors follow this structure:

```typescript
interface CoreError {
  code: string;     // e.g. 'AUTH_001'
  message: string;  // Human-readable description
  statusCode: number;
}
```

| Code | HTTP Status | Description |
|---|---|---|
| `AUTH_001` | 401 | Missing or malformed Authorization header |
| `AUTH_002` | 401 | Invalid JWT signature |
| `AUTH_003` | 401 | JWT expired |
| `AUTH_004` | 401 | JWT audience mismatch |
| `AUTH_005` | 401 | Tenant ID mismatch |
| `RBAC_001` | 403 | Insufficient role for requested action |
| `KYC_001` | 403 | KYC level too low for requested operation |
| `KYC_002` | 409 | KYC verification already in progress |
| `PAY_001` | 400 | Amount must be a positive kobo integer |
| `PAY_002` | 400 | Invalid Paystack webhook signature |
| `NOTIFY_001` | 503 | All SMS providers unavailable |
| `EVENT_001` | 500 | Event bus publish failure |
| `DB_001` | 500 | D1 query error (details in logs) |
| `DB_002` | 400 | tenantId required for this query |

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| v4.3.0 | 2026-03-01 | Added `requireKycLevel` middleware; KYC tier3 (KYB) support |
| v4.2.0 | 2026-01-15 | Offline sync mutation queue added (`@webwaka/core/offline`) |
| v4.1.0 | 2025-12-01 | Yournotify failover for SMS notifications |
| v4.0.0 | 2025-11-10 | Initial v4 release — full Cloudflare Workers + D1 rewrite |

---

## Related Documentation

- [ADR-001: Multi-Tenant Architecture](../adrs/ADR-001-multi-tenant-architecture.md)
- [ADR-002: Offline-First Design](../adrs/ADR-002-offline-first-design.md)
- [ADR-003: Vendor-Neutral AI Routing](../adrs/ADR-003-vendor-neutral-ai.md)
- [Security & Compliance Guide](../security-compliance.md)
- [Webhooks Reference](../webhooks.md)
- [Error Codes Reference](../error-codes.md)
