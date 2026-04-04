# Tutorial 2: Multi-Tenant Onboarding

**Difficulty:** Intermediate | **Time:** 30 minutes | **Prerequisites:** Tutorial 1

This tutorial walks through onboarding a new commerce tenant — a Nigerian retail chain — including KYC setup, product catalogue seeding, and payment gateway configuration.

---

## Step 1: Create the Tenant

```javascript
const tenant = await client.tenants.create({
  name: 'Eko Superstore',
  slug: 'eko-superstore',
  vertical: 'retail',
  currency: 'NGN',
  locale: 'en-NG',
  timezone: 'Africa/Lagos',
  contact: {
    email: 'admin@ekosuperstore.ng',
    phone: '+2348099887766',
  },
});

console.log('Tenant ID:', tenant.id);
console.log('Status:', tenant.status); // 'trial'
```

---

## Step 2: Configure KYC (Tier 2)

Tier 2 allows wallets up to ₦300,000. You need BVN + Utility Bill.

```javascript
const kyc = await client.compliance.kyc.submit({
  tenantId: tenant.id,
  tier: 2,
  documents: {
    bvn: '22087654321',
    utilityBill: {
      type: 'electricity',
      issuer: 'EKEDC',
      fileBase64: '<base64-encoded-pdf>',
      issuedDate: '2026-03-01',
    },
  },
});

console.log('KYC Status:', kyc.status); // 'pending_review'
// KYC approval takes 24–48 hours in production
// In sandbox, use BVN '22012345678' for instant approval
```

---

## Step 3: Seed Product Catalogue

Efficiently seed using the bulk import endpoint:

```javascript
const products = [
  { name: 'Dangote Cement 50kg', sku: 'DAN-CEM-50', price: 720000, stock: 500, category: 'Building Materials' },
  { name: 'Golden Morn 900g', sku: 'GOL-MRN-900', price: 135000, stock: 200, category: 'Food & Beverage' },
  { name: 'Ariel Detergent 2kg', sku: 'ARI-DET-2K', price: 89000, stock: 150, category: 'Household' },
  { name: 'Peak Milk 400g', sku: 'PEK-MLK-400', price: 58000, stock: 300, category: 'Dairy' },
];

const result = await client.commerce.products.bulkCreate({
  tenantId: tenant.id,
  products,
});

console.log(`Imported ${result.created} products`);
console.log(`Failed: ${result.failed.length}`);
```

---

## Step 4: Configure Payment Gateway

```javascript
// Link Paystack account
const gateway = await client.fintech.gateways.configure({
  tenantId: tenant.id,
  provider: 'paystack',
  credentials: {
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    secretKey: process.env.PAYSTACK_SECRET_KEY,
  },
  webhook: {
    url: 'https://api.ekosuperstore.ng/webhooks/paystack',
    events: ['charge.success', 'transfer.success'],
  },
});

console.log('Gateway status:', gateway.status); // 'active'
```

---

## Step 5: Activate the Tenant

After KYC approval, activate the tenant:

```javascript
// Poll for KYC approval (in production, use webhooks instead)
async function waitForKYC(tenantId) {
  while (true) {
    const kyc = await client.compliance.kyc.get({ tenantId });
    if (kyc.status === 'approved') {
      console.log('KYC approved! Tier:', kyc.tier);
      break;
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}

await waitForKYC(tenant.id);

const activated = await client.tenants.activate({ tenantId: tenant.id });
console.log('Tenant status:', activated.status); // 'active'
```

---

## Step 6: Test the Full Flow

```javascript
// Login as the new tenant
const tenantSession = await client.auth.login({
  email: 'admin@ekosuperstore.ng',
  password: 'initialPassword123!',
  tenantSlug: 'eko-superstore',
});

// Create a test sale
const order = await client.commerce.orders.create({
  tenantId: tenant.id,
  items: [{ productId: products[0].id, quantity: 2, unitPrice: 720000 }],
  paymentMethod: 'cash', // POS cash sale
});

console.log('Test sale successful! Order:', order.reference);
```

---

## What's Next?

- [Tutorial 3: Implementing Webhooks](./03-using-webhooks.md)
- [Tenant Onboarding Guide](/doc/COMMERCE_TENANT_ONBOARDING_GUIDE.md)
- [Fintech Wallet Setup](/doc/content%2Fsdk-docs.md)
