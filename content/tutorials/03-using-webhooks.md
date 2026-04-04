# Tutorial 3: Implementing Webhooks

**Difficulty:** Intermediate | **Time:** 25 minutes | **Prerequisites:** Tutorial 1

Webhooks let you react to platform events in real-time — new orders, successful payments, failed transfers, and more.

---

## Step 1: Create a Webhook Endpoint

We'll use **Express.js** to receive webhooks:

```bash
npm install express
```

Create `webhook-server.js`:

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();

// IMPORTANT: Use raw body parser (not json()) for signature verification
app.use('/webhooks/webwaka', express.raw({ type: 'application/json' }));

const WEBHOOK_SECRET = process.env.WEBWAKA_WEBHOOK_SECRET;

function verifySignature(rawBody, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

app.post('/webhooks/webwaka', (req, res) => {
  const signature = req.headers['x-webwaka-signature'];

  // 1. Verify the signature
  if (!verifySignature(req.body, signature, WEBHOOK_SECRET)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Parse the event
  const event = JSON.parse(req.body.toString());
  console.log('Received event:', event.event, '| ID:', event.id);

  // 3. Respond immediately (process async)
  res.status(200).json({ received: true });

  // 4. Process the event asynchronously
  processEvent(event).catch(console.error);
});

async function processEvent(event) {
  switch (event.event) {
    case 'order.confirmed':
      await handleOrderConfirmed(event.data);
      break;
    case 'payment.success':
      await handlePaymentSuccess(event.data);
      break;
    case 'transfer.failed':
      await handleTransferFailed(event.data);
      break;
    default:
      console.log('Unhandled event type:', event.event);
  }
}

async function handleOrderConfirmed(data) {
  console.log(`Order ${data.reference} confirmed — Total: ₦${(data.total/100).toFixed(2)}`);
  // e.g. Send SMS to customer via Termii
  // e.g. Update your inventory system
  // e.g. Trigger warehouse fulfilment
}

async function handlePaymentSuccess(data) {
  console.log(`Payment ${data.providerRef} successful — ₦${(data.amount/100).toFixed(2)}`);
  // e.g. Update order status in your DB
  // e.g. Send receipt email
}

async function handleTransferFailed(data) {
  console.error(`Transfer ${data.reference} failed — Reason: ${data.failureReason}`);
  // e.g. Alert finance team
  // e.g. Refund to wallet
}

app.listen(3000, () => console.log('Webhook server listening on port 3000'));
```

---

## Step 2: Register the Webhook

For local testing, use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
# Exposes: https://abc123.ngrok.io
```

Register the webhook with WebWaka:

```javascript
const webhook = await client.webhooks.create({
  url: 'https://abc123.ngrok.io/webhooks/webwaka',
  events: [
    'order.created',
    'order.confirmed',
    'payment.success',
    'payment.failed',
    'transfer.success',
    'transfer.failed',
    'wallet.low_balance',
  ],
});

// Store this securely!
console.log('Webhook ID:', webhook.id);
console.log('Webhook Secret:', webhook.secret);
```

---

## Step 3: Test with the Delivery Simulator

Trigger a test event from the staging environment:

```bash
curl -X POST https://staging-api.webwaka.io/v4/webhooks/test \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookId": "wh_01HX9K2M3N",
    "event": "order.confirmed",
    "data": {
      "orderId": "ord_test_001",
      "reference": "WW-ORD-TEST-001",
      "total": 5000000,
      "currency": "NGN"
    }
  }'
```

Your server should log:
```
Received event: order.confirmed | ID: evt_test_001
Order WW-ORD-TEST-001 confirmed — Total: ₦50,000.00
```

---

## Step 4: Implement Idempotency

Webhooks may be delivered more than once. Always deduplicate by `event.id`:

```javascript
const processedEvents = new Set(); // Use Redis or DB in production

async function processEvent(event) {
  if (processedEvents.has(event.id)) {
    console.log('Duplicate event ignored:', event.id);
    return;
  }
  processedEvents.add(event.id);

  // ... process normally
}
```

---

## Step 5: Monitor Deliveries

Check webhook delivery history:

```javascript
const deliveries = await client.webhooks.deliveries({
  webhookId: webhook.id,
  limit: 20,
});

for (const delivery of deliveries.data) {
  console.log(
    delivery.event,
    delivery.status,          // 'delivered' | 'failed'
    delivery.responseCode,    // HTTP status from your endpoint
    delivery.attempts,        // number of delivery attempts
  );
}
```

---

## Production Checklist

- [ ] Store `WEBWAKA_WEBHOOK_SECRET` in environment variables (not in code)
- [ ] Always verify signatures before processing
- [ ] Respond HTTP 200 within **30 seconds** (process asynchronously)
- [ ] Implement idempotency using `event.id`
- [ ] Use HTTPS for production webhook URLs
- [ ] Set up alerts for failed deliveries

---

## What's Next?

- [Webhooks Reference](/doc/content%2Fwebhooks.md) — full event catalogue
- [Tutorial 1: Getting Started](./01-getting-started.md)
- [API Explorer](/api-explorer) — test endpoints live
