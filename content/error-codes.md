# Error Code Glossary

All WebWaka OS v4 API errors follow a structured format: `WW_{DOMAIN}_{NUMBER}`. Every error response includes `code`, `message`, and optional `details`.

```json
{
  "code": "WW_AUTH_001",
  "message": "Token is invalid or expired",
  "details": { "expiredAt": "2026-04-04T10:00:00Z" }
}
```

---

## Authentication Errors (`WW_AUTH_*`)

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WW_AUTH_001` | 401 | Token is invalid or expired | Re-authenticate via `/auth/token` |
| `WW_AUTH_002` | 401 | Refresh token is invalid | User must log in again |
| `WW_AUTH_003` | 403 | Insufficient role permissions | Check RBAC role assignment |
| `WW_AUTH_004` | 403 | Tenant access denied | Ensure correct `tenantSlug` in token |
| `WW_AUTH_005` | 401 | Missing `Authorization` header | Include `Authorization: Bearer <token>` |
| `WW_AUTH_006` | 429 | Too many login attempts | Wait 15 minutes before retrying |
| `WW_AUTH_007` | 400 | Invalid credentials format | Check email format and password requirements |

---

## Validation Errors (`WW_VAL_*`)

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WW_VAL_001` | 400 | Required field missing | Check the `details.field` property |
| `WW_VAL_002` | 400 | Invalid field format | See `details.expected` for the expected format |
| `WW_VAL_003` | 400 | Value out of acceptable range | See `details.min` and `details.max` |
| `WW_VAL_004` | 409 | Duplicate unique field | The slug, SKU, or reference already exists |
| `WW_VAL_005` | 400 | Invalid enum value | See `details.allowed` for valid values |
| `WW_VAL_006` | 422 | Business rule violation | See `details.rule` for specifics |

---

## Tenant Errors (`WW_TNT_*`)

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WW_TNT_001` | 404 | Tenant not found | Verify the `tenantId` or `tenantSlug` |
| `WW_TNT_002` | 403 | Tenant is suspended | Contact support@webwaka.io |
| `WW_TNT_003` | 402 | Tenant subscription expired | Renew subscription in the Central Management dashboard |
| `WW_TNT_004` | 429 | Tenant API rate limit exceeded | Respect `X-RateLimit-*` response headers |
| `WW_TNT_005` | 409 | Tenant slug already taken | Choose a different slug |

---

## Commerce Errors (`WW_COM_*`)

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WW_COM_001` | 404 | Product not found | Verify the `productId` |
| `WW_COM_002` | 409 | Insufficient stock | Reduce order quantity or restock |
| `WW_COM_003` | 404 | Order not found | Verify the `orderId` |
| `WW_COM_004` | 409 | Order already fulfilled | Cannot modify a completed order |
| `WW_COM_005` | 400 | Empty order — no items | Include at least one item in the order |
| `WW_COM_006` | 422 | Price mismatch | Cart price differs from current product price |

---

## Fintech Errors (`WW_FIN_*`)

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WW_FIN_001` | 404 | Wallet not found | Create a wallet for the tenant first |
| `WW_FIN_002` | 422 | Insufficient wallet balance | Top up the wallet before transferring |
| `WW_FIN_003` | 422 | Transfer limit exceeded | Daily limit is ₦5,000,000 per wallet |
| `WW_FIN_004` | 422 | Invalid bank account | Name enquiry failed; verify account number and bank code |
| `WW_FIN_005` | 409 | Duplicate idempotency key | This transfer was already processed |
| `WW_FIN_006` | 503 | Payment gateway unavailable | Retry with exponential back-off |
| `WW_FIN_007` | 422 | KYC level insufficient | Upgrade tenant KYC tier to proceed |

---

## Transport Errors (`WW_TRN_*`)

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WW_TRN_001` | 404 | Trip not found | Verify the `tripId` |
| `WW_TRN_002` | 409 | Trip already started | Cannot modify an in-transit trip |
| `WW_TRN_003` | 409 | No available vehicles | All fleet vehicles are assigned |
| `WW_TRN_004` | 422 | Route not supported | Check supported routes via `/transport/routes` |

---

## AI Errors (`WW_AI_*`)

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WW_AI_001` | 503 | All AI providers unavailable | Both OpenRouter and local Llama-3 are unreachable |
| `WW_AI_002` | 429 | AI rate limit exceeded | Reduce request frequency |
| `WW_AI_003` | 422 | Prompt too long | Reduce `maxTokens` or shorten the prompt |
| `WW_AI_004` | 400 | Unsupported language | Use one of: `en`, `yo`, `ig`, `ha`, `fr`, `sw`, `ar` |

---

## Webhook Errors (`WW_WHK_*`)

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WW_WHK_001` | 404 | Webhook not found | Verify the `webhookId` |
| `WW_WHK_002` | 422 | Delivery failed after 3 retries | Ensure your endpoint returns HTTP 200 within 30 seconds |
| `WW_WHK_003` | 400 | Invalid event type | See the [Webhooks Reference](/doc/content%2Fwebhooks.md) for valid event types |

---

## System Errors (`WW_SYS_*`)

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `WW_SYS_001` | 500 | Unexpected internal error | Check the [Platform Status](/status) and contact support |
| `WW_SYS_002` | 503 | Service temporarily unavailable | Retry with exponential back-off (max 5 retries) |
| `WW_SYS_003` | 504 | Request timeout | Reduce payload size or retry |

---

## Rate Limiting

All API responses include rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 997
X-RateLimit-Reset: 1743859200
```

Default limits:
- **Standard endpoints:** 1,000 requests / 15 minutes per tenant
- **Auth endpoints:** 20 requests / 15 minutes per IP
- **AI endpoints:** 100 requests / hour per tenant
