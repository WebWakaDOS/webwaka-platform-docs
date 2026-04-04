# Tutorial 1: Getting Started with WebWaka OS v4

**Difficulty:** Beginner | **Time:** 20 minutes | **Prerequisites:** Node.js 18+

In this tutorial you will authenticate, list tenants, and create your first product using the WebWaka API.

---

## Step 1: Set Up Your Project

Create a new Node.js project and install the SDK:

```bash
mkdir webwaka-demo && cd webwaka-demo
npm init -y
npm install @webwaka/sdk dotenv
```

Create a `.env` file:

```env
WEBWAKA_API_KEY=your_api_key_here
WEBWAKA_TENANT_SLUG=sandbox
WEBWAKA_ENV=staging
```

---

## Step 2: Authenticate

Create `index.js`:

```javascript
require('dotenv').config();
const { WebWakaClient } = require('@webwaka/sdk');

const client = new WebWakaClient({
  tenantSlug: process.env.WEBWAKA_TENANT_SLUG,
  apiKey: process.env.WEBWAKA_API_KEY,
  environment: process.env.WEBWAKA_ENV,
});

async function main() {
  const session = await client.auth.login({
    email: 'dev@sandbox.webwaka.io',
    password: 'Sandbox2026!',
  });
  console.log('✅ Authenticated!');
  console.log('Tenant ID:', session.tenantId);
  console.log('Token expires in:', session.expiresIn, 'seconds');
  return session;
}

main().catch(console.error);
```

Run it:

```bash
node index.js
```

Expected output:

```
✅ Authenticated!
Tenant ID: tnt_sandbox_001
Token expires in: 3600 seconds
```

---

## Step 3: Create a Product

Add this to `index.js`:

```javascript
async function createProduct(session) {
  const product = await client.commerce.products.create({
    tenantId: session.tenantId,
    name: 'Indomie Noodles (Carton)',
    sku: 'INDO-CTN-001',
    price: 450000,       // ₦4,500 in kobo
    currency: 'NGN',
    stock: 100,
    category: 'Food & Beverage',
  });

  console.log('✅ Product created!');
  console.log('Product ID:', product.id);
  console.log('Price: ₦' + (product.price / 100).toFixed(2));
  return product;
}
```

**Why kobo?** WebWaka stores all NGN amounts in kobo (1 NGN = 100 kobo) to avoid floating-point errors in financial calculations. This follows the same pattern as Stripe (cents) and Paystack.

---

## Step 4: Place an Order

```javascript
async function placeOrder(session, product) {
  const order = await client.commerce.orders.create({
    tenantId: session.tenantId,
    items: [
      {
        productId: product.id,
        quantity: 5,
        unitPrice: product.price,
      },
    ],
    paymentMethod: 'paystack',
    customer: {
      name: 'Chidi Okeke',
      phone: '+2348012345678',
    },
  });

  console.log('✅ Order placed!');
  console.log('Order Reference:', order.reference);
  console.log('Total: ₦' + (order.total / 100).toFixed(2));
  console.log('Status:', order.status);
}
```

---

## Step 5: Handle Offline Scenarios

The SDK automatically queues mutations when offline. Test it:

```javascript
const clientOffline = new WebWakaClient({
  tenantSlug: process.env.WEBWAKA_TENANT_SLUG,
  apiKey: process.env.WEBWAKA_API_KEY,
  environment: 'staging',
  offlineQueue: true,
  offlineStore: './offline-queue.json',
});

// Simulate offline — this order will be queued
const queuedOrder = await clientOffline.commerce.orders.create({ ... });
console.log('Order status:', queuedOrder.status); // 'queued'

// When network restores, the SDK auto-replays the queue
clientOffline.on('sync:complete', ({ replayed }) => {
  console.log(`Synced ${replayed} queued operations`);
});
```

---

## What's Next?

- [Tutorial 2: Multi-Tenant Onboarding](./02-tenant-integration.md)
- [Tutorial 3: Implementing Webhooks](./03-using-webhooks.md)
- [API Explorer](/api-explorer) — Try endpoints live
- [SDK Documentation](/doc/content%2Fsdk-docs.md)
