# SDK Documentation

Official WebWaka OS v4 SDKs provide type-safe, offline-aware access to the platform API.

---

## Node.js SDK (`@webwaka/sdk`)

### Installation

```bash
npm install @webwaka/sdk
```

### Quick Start

```typescript
import { WebWakaClient } from '@webwaka/sdk';

const client = new WebWakaClient({
  tenantSlug: 'acme-retail',
  apiKey: process.env.WEBWAKA_API_KEY,
  environment: 'production', // or 'staging'
});

// Authenticate
const session = await client.auth.login({
  email: 'admin@acme.ng',
  password: 'secret',
});

// List products
const products = await client.commerce.products.list({
  tenantId: session.tenantId,
  inStock: true,
});

// Create order (offline-capable)
const order = await client.commerce.orders.create({
  tenantId: session.tenantId,
  items: [{ productId: 'prd_001', quantity: 2, unitPrice: 500000 }],
  paymentMethod: 'paystack',
});
```

### Offline Support

The Node.js SDK automatically queues mutations when offline (using `lowdb` for persistence):

```typescript
const client = new WebWakaClient({
  tenantSlug: 'acme-retail',
  apiKey: process.env.WEBWAKA_API_KEY,
  offlineQueue: true, // enable offline queue
  offlineStore: './offline-queue.json',
});

// This will be queued if offline and replayed when connectivity resumes
await client.commerce.orders.create({ ... });
```

### AI Completions

```typescript
const result = await client.ai.complete({
  prompt: 'Translate this invoice summary to Yoruba',
  context: { invoiceId: 'INV-001' },
  language: 'yo',
  maxTokens: 256,
});
console.log(result.text); // Yoruba translation
console.log(result.provider); // 'openrouter' or 'llama-local'
```

---

## Python SDK (`webwaka-python`)

### Installation

```bash
pip install webwaka
```

### Quick Start

```python
from webwaka import WebWakaClient

client = WebWakaClient(
    tenant_slug='acme-retail',
    api_key=os.environ['WEBWAKA_API_KEY'],
    environment='production'
)

# Authenticate
session = client.auth.login(email='admin@acme.ng', password='secret')

# List products
products = client.commerce.products.list(tenant_id=session.tenant_id)

# Initiate wallet transfer
transfer = client.fintech.transfers.create(
    amount=500000,  # ₦5,000 in kobo
    currency='NGN',
    destination={
        'account_number': '0123456789',
        'bank_code': '058',  # GTBank
        'account_name': 'Chidi Okeke'
    },
    narration='Payment for Invoice INV-001',
    idempotency_key='unique-key-001'
)
```

### Webhook Verification

```python
from webwaka.webhooks import verify_signature

@app.route('/webhooks/webwaka', methods=['POST'])
def handle_webhook():
    payload = request.get_data(as_text=True)
    signature = request.headers.get('X-WebWaka-Signature')
    secret = os.environ['WEBWAKA_WEBHOOK_SECRET']

    if not verify_signature(payload, signature, secret):
        return 'Unauthorized', 401

    event = request.get_json()
    # Process event...
    return 'OK', 200
```

---

## PHP SDK (`webwaka/webwaka-php`)

### Installation

```bash
composer require webwaka/webwaka-php
```

### Quick Start

```php
use WebWaka\Client;

$client = new Client([
    'tenantSlug' => 'acme-retail',
    'apiKey'     => $_ENV['WEBWAKA_API_KEY'],
]);

$session = $client->auth()->login([
    'email'    => 'admin@acme.ng',
    'password' => 'secret',
]);

$products = $client->commerce()->products()->list([
    'tenantId' => $session['tenantId'],
]);

foreach ($products['data'] as $product) {
    echo $product['name'] . ' — ₦' . number_format($product['price'] / 100, 2) . "\n";
}
```

---

## SDK Feature Matrix

| Feature | Node.js | Python | PHP |
|---------|---------|--------|-----|
| Auth (login/refresh) | ✅ | ✅ | ✅ |
| Commerce (products/orders) | ✅ | ✅ | ✅ |
| Fintech (wallets/transfers) | ✅ | ✅ | ✅ |
| Transport (trips/fleet) | ✅ | ✅ | 🔄 |
| AI Completions (CORE-5) | ✅ | ✅ | 🔄 |
| Webhook verification | ✅ | ✅ | ✅ |
| Offline queue | ✅ | ❌ | ❌ |
| TypeScript types | ✅ | N/A | N/A |
| Async/await | ✅ | ✅ | ✅ |

✅ Supported | 🔄 Planned Q3 2026 | ❌ Not applicable

---

## SDK Versioning

SDKs follow **semantic versioning** aligned with the API version:
- SDK `4.x.x` targets API `v4`
- SDK `4.0.x` → bug fixes only
- SDK `4.1.0` → new features (backwards compatible)
- SDK `5.0.0` → breaking changes (new major API version)

All SDKs are open-source on GitHub: `github.com/webwaka-os/sdk-*`
