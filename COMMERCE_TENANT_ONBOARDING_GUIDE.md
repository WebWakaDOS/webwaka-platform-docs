# WebWaka Commerce: Tenant Onboarding Guide

**Version:** 1.0
**Target Audience:** Platform Administrators & DevOps

This guide details the exact steps, templates, and validation procedures required to onboard a new business onto the WebWaka Commerce vertical using the Tenant-as-Code architecture.

---

## 1. Tenant JSON Templates

The WebWaka architecture relies on JSON configurations stored in Cloudflare KV to dynamically compose the application for each tenant.

### Template A: Retail POS + Single Vendor Storefront
Use this for a standard retail business that wants both physical point-of-sale and an online store.

```json
{
  "id": "tenant_[business_name]_001",
  "name": "[Business Name]",
  "type": "retail",
  "domain": "shop.[business_name].com",
  "currency": "NGN",
  "timezone": "Africa/Lagos",
  "modules": {
    "pos": {
      "enabled": true,
      "offline_mode": true
    },
    "single_vendor": {
      "enabled": true,
      "payment_gateway": "paystack"
    }
  },
  "syncPreferences": {
    "sync_pos_to_single_vendor": true,
    "sync_pos_to_multi_vendor": false,
    "sync_single_vendor_to_multi_vendor": false,
    "conflict_resolution": "last_write_wins"
  },
  "theme": {
    "primaryColor": "#2563eb",
    "logoUrl": "https://assets.webwaka.com/[business_name]/logo.png"
  }
}
```

### Template B: Multi-Vendor Marketplace Owner
Use this for the entity that owns and operates the marketplace.

```json
{
  "id": "tenant_[marketplace_name]_owner",
  "name": "[Marketplace Name]",
  "type": "multi_vendor",
  "domain": "www.[marketplace_name].com",
  "currency": "NGN",
  "timezone": "Africa/Lagos",
  "modules": {
    "multi_vendor": {
      "enabled": true,
      "commission_rate": 0.10,
      "payment_gateway": "paystack_split"
    }
  },
  "syncPreferences": {
    "sync_pos_to_single_vendor": false,
    "sync_pos_to_multi_vendor": false,
    "sync_single_vendor_to_multi_vendor": false,
    "conflict_resolution": "manual"
  },
  "theme": {
    "primaryColor": "#16a34a",
    "logoUrl": "https://assets.webwaka.com/[marketplace_name]/logo.png"
  }
}
```

### Template C: Marketplace Vendor (Scoped)
Use this for individual sellers operating within a marketplace.

```json
{
  "id": "tenant_vendor_[vendor_name]",
  "name": "[Vendor Name]",
  "type": "vendor",
  "marketplaceId": "tenant_[marketplace_name]_owner",
  "currency": "NGN",
  "timezone": "Africa/Lagos",
  "modules": {
    "vendor_admin": {
      "enabled": true
    }
  },
  "syncPreferences": {
    "sync_pos_to_single_vendor": false,
    "sync_pos_to_multi_vendor": true,
    "sync_single_vendor_to_multi_vendor": false,
    "conflict_resolution": "last_write_wins"
  }
}
```

---

## 2. Step-by-Step Onboarding Process

### Step 1: Prepare the Tenant Configuration
1. Select the appropriate JSON template from above.
2. Replace all bracketed variables (e.g., `[business_name]`) with the actual client details.
3. Save the file locally as `tenant_[name].json`.

### Step 2: Inject into Cloudflare KV
Run the following Wrangler command to inject the configuration into the production KV namespace:

```bash
wrangler kv:key put --binding=TENANTS "tenant_[name]" "$(cat tenant_[name].json)" --env production
```

### Step 3: Configure Custom Domain
1. Log in to the Cloudflare Dashboard.
2. Navigate to **Workers & Pages** > **webwaka-commerce-api-prod**.
3. Go to **Triggers** > **Custom Domains**.
4. Add the tenant's domain (e.g., `shop.businessname.com`).
5. Instruct the tenant to point their DNS CNAME to your Workers domain.

### Step 4: Initialize Admin User
Run the user creation script to generate the initial admin credentials for the tenant:

```bash
node scripts/create-admin-user.js --tenant="tenant_[name]" --email="admin@[business_name].com" --role="admin"
```

---

## 3. Pre-Flight Smoke Test Checklist

Before handing over credentials to the new tenant, the DevOps team MUST complete this checklist:

- [ ] **Domain Resolution:** Visit `https://shop.[business_name].com/api/health` and verify a 200 OK response.
- [ ] **Tenant Resolution:** Verify the API response includes the correct `tenantId` in the headers.
- [ ] **UI Loading:** Visit the root domain and verify the PWA loads with the correct `primaryColor` and `logoUrl`.
- [ ] **Admin Login:** Log in using the generated admin credentials.
- [ ] **RBAC Verification:** Verify the admin dashboard loads and the "Staff Management" section is accessible.
- [ ] **Sync Preferences:** Verify the "Inventory Sync Preferences" match the JSON configuration.
- [ ] **Offline Capability:** Disconnect internet, add a test item to the POS cart, and verify the Dexie mutation queue captures the event.

**If all checks pass, the tenant is ready for handover.**
