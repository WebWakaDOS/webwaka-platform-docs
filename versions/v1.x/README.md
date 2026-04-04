# WebWaka OS v1.x — Legacy Documentation

**Status:** 🔒 End of Life (EOL) — March 2025  
**Supported Until:** December 2025 (security patches only)

> ⚠️ **This is legacy documentation.** WebWaka OS v1.x is no longer actively developed. [Migrate to v4.x →](/)

---

## Migration Guide: v1.x → v4.x

### Breaking Changes

| Area | v1.x | v4.x |
|------|------|------|
| Auth | API Keys (static) | JWT Bearer tokens (rotating) |
| Multi-tenancy | Single tenant per deployment | Multi-tenant by default |
| Pricing | Integer NGN | Kobo amounts (×100) |
| Offline | Not supported | Full offline-first with Dexie.js |
| AI | Hardcoded OpenAI | CORE-5 vendor-neutral abstraction |
| Languages | English only | en, yo, ig, ha, fr, sw, ar |
| Infrastructure | Self-hosted | Cloudflare Workers (edge-native) |

### Migration Steps

1. **Update authentication:** Replace API key headers with JWT Bearer tokens
   ```
   # v1.x
   X-API-Key: your-static-key
   
   # v4.x
   Authorization: Bearer <jwt-token>
   ```

2. **Update pricing:** Multiply all NGN amounts by 100 (convert to kobo)

3. **Update base URL:** 
   ```
   # v1.x
   https://api-v1.webwaka.io
   
   # v4.x
   https://api.webwaka.io/v4
   ```

4. **Add tenantId:** All requests now require a `tenantId` parameter

5. **Implement webhook verification:** v4.x requires HMAC-SHA256 signature verification

---

## v1.x API Overview

The v1.x API had a simpler, flat structure:

- `POST /login` → Auth
- `GET /products` → Product list
- `POST /orders` → Create order  
- `GET /balance` → Wallet balance

All these are superseded by the [v4.x API](/api-explorer).

---

## Support

v1.x support ended **March 2025**. For migration assistance: legacy-support@webwaka.io

[→ View current v4.x documentation](/)
