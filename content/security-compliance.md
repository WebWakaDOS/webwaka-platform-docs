# Security & Compliance Hub

WebWaka OS v4 is engineered to meet the highest security and regulatory standards for financial technology and data processing in Nigeria and across Africa.

---

## Compliance Frameworks

### NDPR (Nigeria Data Protection Regulation)
- **Status:** ✅ Compliant (NITDA Certified)
- All personal data is encrypted at rest (AES-256) and in transit (TLS 1.3)
- Data subjects can request export or deletion via `/me/data` endpoints
- Data Processing Agreements (DPAs) available for enterprise tenants
- Lawful basis for processing documented per NDPR Article 2.1

### PCI-DSS Level 1
- **Status:** ✅ Certified
- No raw card data touches WebWaka servers (Paystack/Flutterwave tokenisation)
- Annual QSA audit completed March 2026
- Penetration testing: bi-annual (last: February 2026)

### ISO 27001:2022
- **Status:** ✅ Certified (Cert #ISO-27001-WW-2025)
- Information Security Management System (ISMS) in place
- Risk register reviewed quarterly
- All staff complete mandatory security awareness training annually

### CBN Regulatory Compliance (Nigeria)
- Licensed as Payment Service Solution Provider (PSSP)
- NIP (NIBSS Instant Payment) compliant
- KYC tiers aligned with CBN Customer Due Diligence regulations:
  - **Tier 1:** Phone + BVN → max ₦50,000 wallet
  - **Tier 2:** BVN + Utility Bill → max ₦300,000 wallet
  - **Tier 3:** NIMC vNIN + Facial Match → unlimited

---

## Security Architecture

### Authentication & Authorization
```
JWT (RS256) signed with rotating 2048-bit RSA keys
Key rotation: every 90 days
RBAC: Super Admin → Tenant Admin → Manager → Staff → Read-Only
MFA: TOTP required for Super Admin and Fintech roles
```

### Data Encryption
| Layer | Standard |
|-------|----------|
| Data at rest | AES-256-GCM |
| Data in transit | TLS 1.3 (minimum) |
| Database fields (PII) | Column-level encryption (AES-256) |
| Backups | Encrypted with tenant-specific keys |
| API secrets | HashiCorp Vault (Cloudflare Workers secrets) |

### Infrastructure Security
- **Edge:** Cloudflare Workers — DDoS protection, WAF, Bot Management
- **Network:** Zero-trust network access (ZTNA) for internal services
- **Secrets:** Never in code — all via Cloudflare Secrets / Replit Secrets
- **Logging:** All API calls logged with tenant isolation; logs retained 90 days

---

## Vulnerability Disclosure Policy

If you discover a security vulnerability:

1. **Do not** create a public GitHub issue
2. Email **security@webwaka.io** with subject: `[SECURITY] <brief title>`
3. Include: description, reproduction steps, potential impact
4. We will acknowledge within **24 hours** and resolve critical issues within **72 hours**

We follow responsible disclosure — we will credit researchers in our changelog.

---

## Incident Response

| Severity | Definition | Response SLA |
|----------|------------|-------------|
| P0 — Critical | Data breach or full platform outage | 1 hour |
| P1 — High | Partial outage or security incident | 4 hours |
| P2 — Medium | Performance degradation | 24 hours |
| P3 — Low | Non-critical bug | 72 hours |

Status updates are published at [status.webwaka.io](https://status.webwaka.io) and via the `platform.incident.*` webhook events.

---

## Audit Logs

All admin actions are immutably logged:

```json
{
  "auditId": "aud_01HX",
  "actor": { "userId": "usr_abc", "role": "tenant_admin" },
  "action": "tenant.suspend",
  "target": { "tenantId": "tnt_xyz" },
  "reason": "Non-payment",
  "timestamp": "2026-04-04T10:00:00Z",
  "ip": "197.210.x.x"
}
```

Access via `GET /audit-logs` (Super Admin only). Logs cannot be deleted.

---

## Security Checklist for Integrators

- [ ] Store webhook secrets in environment variables, not code
- [ ] Always verify webhook signatures (`X-WebWaka-Signature`)
- [ ] Use HTTPS for all webhook endpoints
- [ ] Implement idempotency keys for all financial operations
- [ ] Never log raw JWT tokens or payment references
- [ ] Rotate API credentials every 90 days
- [ ] Use least-privilege RBAC roles for service accounts
