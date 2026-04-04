# Developer Portal

Welcome to the WebWaka OS v4 Developer Portal. Build integrations, custom vertical suites, and third-party apps on top of the WebWaka Open API.

---

## Getting Started

### 1. Create a Developer Account

Register at [portal.webwaka.io/developers](https://portal.webwaka.io/developers) to receive:
- A **sandbox tenant** pre-populated with test data
- API credentials with `developer` role
- Access to the Staging environment (`https://staging-api.webwaka.io/v4`)

### 2. Get Your API Key

```bash
curl -X POST https://staging-api.webwaka.io/v4/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@yourcompany.com","password":"secret","tenantSlug":"sandbox"}'
```

Save the returned `accessToken` — it expires in 1 hour. Use `refreshToken` to get a new one.

### 3. Make Your First API Call

```bash
curl https://staging-api.webwaka.io/v4/tenants \
  -H "Authorization: Bearer <your-access-token>"
```

---

## App Types

### Embedded Apps
Integrate directly into a tenant's WebWaka dashboard via the **App Marketplace**. Apps can:
- Add custom menu items and pages
- Display widgets in the tenant dashboard
- Access tenant data via OAuth 2.0

### Webhook Integrations
React to platform events in real-time. No polling required.

### Backend Integrations
Server-to-server API calls using long-lived API keys for automation and data sync.

### Mobile Extensions
Use the WebWaka Mobile SDK to extend the merchant app with custom screens.

---

## OAuth 2.0 (for Marketplace Apps)

For apps that access **multiple tenants' data** with user consent:

```
Authorization Code Flow:

1. Redirect user to:
   https://portal.webwaka.io/oauth/authorize
   ?client_id=YOUR_CLIENT_ID
   &redirect_uri=https://yourapp.com/callback
   &scope=commerce:read fintech:read
   &response_type=code

2. Exchange code for token:
   POST https://api.webwaka.io/v4/oauth/token
   { "code": "AUTH_CODE", "client_secret": "...", "redirect_uri": "..." }

3. Use token in API calls:
   Authorization: Bearer <access_token>
```

Available scopes:

| Scope | Description |
|-------|-------------|
| `commerce:read` | Read products and orders |
| `commerce:write` | Create and update orders |
| `fintech:read` | Read wallet and transaction data |
| `fintech:write` | Initiate transfers |
| `tenants:read` | Read tenant configuration |
| `ai:complete` | Use CORE-5 AI completions |

---

## Sandbox Test Data

| Entity | Value |
|--------|-------|
| Test tenant slug | `sandbox` |
| Test email | `dev@sandbox.webwaka.io` |
| Test password | `Sandbox2026!` |
| Test BVN | `22012345678` |
| Test Paystack key | `sk_test_xxxxxxxxxxxx` |
| Webhook test URL | Use [webhook.site](https://webhook.site) |

**Test bank accounts for transfers:**
| Account Number | Bank | Always succeeds? |
|----------------|------|-----------------|
| `0000000000` | GTBank (058) | ✅ Yes |
| `1111111111` | First Bank (011) | ❌ Fails (insufficient funds) |

---

## Rate Limits (Developer/Sandbox)

| Endpoint group | Limit |
|----------------|-------|
| Auth | 20 req/15 min |
| Commerce | 500 req/15 min |
| Fintech | 200 req/15 min |
| AI | 50 req/hour |

---

## App Review Process

1. Submit your app via the Developer Portal
2. Security team reviews within **5 business days**
3. Sandbox testing period (2 weeks minimum)
4. Listing on the WebWaka App Marketplace
5. Revenue share: 70% developer / 30% WebWaka platform

---

## Developer Support

- **Docs:** You are here ✅
- **Community Forum:** [community.webwaka.io](https://community.webwaka.io)
- **GitHub Issues:** `github.com/webwaka-os/platform/issues`
- **Discord:** [discord.gg/webwaka-dev](https://discord.gg/webwaka-dev)
- **Enterprise Support:** devrel@webwaka.io
