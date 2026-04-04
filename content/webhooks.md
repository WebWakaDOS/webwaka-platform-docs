# Webhooks Reference

WebWaka OS v4 uses webhooks to push real-time event notifications to your systems. When a subscribed event occurs, we send an HTTP `POST` request to your configured endpoint.

---

## Subscribing to Webhooks

```http
POST /webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://yourapp.com/webhooks/webwaka",
  "events": ["order.confirmed", "payment.success", "tenant.suspended"]
}
```

Response:

```json
{
  "id": "wh_01HX9K2M3N",
  "url": "https://yourapp.com/webhooks/webwaka",
  "events": ["order.confirmed", "payment.success", "tenant.suspended"],
  "secret": "whsec_abc123...",
  "isActive": true,
  "createdAt": "2026-04-04T10:00:00Z"
}
```

Store the `secret` — it is shown only once and is used to verify payload signatures.

---

## Verifying Signatures

Every webhook request includes an `X-WebWaka-Signature` header (HMAC-SHA256):

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}
```

---

## Payload Schema

All webhook payloads share a common envelope:

```json
{
  "id": "evt_01HX9K2M3N",
  "event": "order.confirmed",
  "tenantId": "tnt_9x8y7z",
  "timestamp": "2026-04-04T10:00:00Z",
  "apiVersion": "4.0.0",
  "data": { }
}
```

---

## Event Types

### Commerce Events

| Event | Description |
|-------|-------------|
| `order.created` | A new order was placed |
| `order.confirmed` | Order payment confirmed |
| `order.shipped` | Order dispatched from warehouse |
| `order.delivered` | Order marked as delivered |
| `order.cancelled` | Order cancelled (by customer or system) |
| `product.low_stock` | Product stock falls below threshold |
| `product.out_of_stock` | Product is completely out of stock |

**`order.confirmed` payload:**

```json
{
  "id": "evt_01HX9K2M3N",
  "event": "order.confirmed",
  "tenantId": "tnt_9x8y7z",
  "timestamp": "2026-04-04T10:00:00Z",
  "data": {
    "orderId": "ord_abc",
    "reference": "WW-ORD-20260404-001",
    "total": 5000000,
    "currency": "NGN",
    "items": [
      { "productId": "prd_xyz", "name": "Dangote Cement 50kg", "qty": 10, "unitPrice": 500000 }
    ],
    "customer": { "id": "cus_123", "name": "Chidi Okeke", "phone": "+2348012345678" }
  }
}
```

---

### Fintech Events

| Event | Description |
|-------|-------------|
| `payment.initiated` | Payment process started |
| `payment.success` | Payment completed successfully |
| `payment.failed` | Payment failed |
| `transfer.success` | Bank transfer completed |
| `transfer.failed` | Bank transfer failed |
| `wallet.funded` | Wallet balance increased |
| `wallet.low_balance` | Wallet balance below threshold |

**`payment.success` payload:**

```json
{
  "event": "payment.success",
  "data": {
    "paymentId": "pay_001",
    "orderId": "ord_abc",
    "amount": 5000000,
    "currency": "NGN",
    "provider": "paystack",
    "providerRef": "T123456789",
    "paidAt": "2026-04-04T10:05:00Z"
  }
}
```

---

### Tenant Events

| Event | Description |
|-------|-------------|
| `tenant.created` | New tenant registered |
| `tenant.activated` | Tenant subscription activated |
| `tenant.suspended` | Tenant suspended (non-payment or policy) |
| `tenant.plan_upgraded` | Subscription plan upgraded |

---

### Transport Events

| Event | Description |
|-------|-------------|
| `trip.started` | Trip departed origin |
| `trip.completed` | Trip arrived at destination |
| `trip.cancelled` | Trip cancelled |
| `vehicle.breakdown` | Vehicle breakdown reported |

---

### AI Events

| Event | Description |
|-------|-------------|
| `ai.provider_switched` | CORE-5 switched from OpenRouter to Llama-3 local |
| `ai.quota_warning` | AI usage at 80% of monthly quota |

---

## Retry Policy

- Failed deliveries (non-2xx response or timeout > 30s) are retried **3 times**
- Back-off: 1 min → 5 min → 30 min
- After 3 failures, the webhook is marked **inactive** and `WW_WHK_002` is logged
- You can manually re-enable via `PATCH /webhooks/{id}` with `{ "isActive": true }`

---

## Best Practices

1. **Respond fast:** Return HTTP 200 immediately; process asynchronously.
2. **Verify signatures:** Always validate `X-WebWaka-Signature` before processing.
3. **Handle duplicates:** Use `evt.id` to deduplicate events.
4. **Use HTTPS:** Webhook URLs must be `https://`.
5. **Test with staging:** Use `https://staging-api.webwaka.io/v4` for integration tests.
