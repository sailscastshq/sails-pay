[![Sails Pay](https://github.com/sailscastshq/sails-pay/blob/main/.github/logo.png)](https://docs.sailscasts.com/pay/)

The modern payments engine for Sails applications. Easily setup payments with providers like [Lemon Squeezy](https://lemonsqueezy.com) in your Sails apps. Find full documentation at [docs.sailscasts.com/pay/](https://docs.sailscasts.com/pay/).

## Supported payment providers

- [Bachs](https://bachs.io)
- [Lemon Squeezy](https://www.lemonsqueezy.com/)
- [Paystack](https://paystack.com)
- [Paga](https://paga.com)

## Bachs checkout

Install the core hook with the Bachs adapter:

```sh
npm install sails-pay @sails-pay/bachs
```

Configure Bachs in `config/pay.js`:

```js
module.exports.pay = {
  provider: 'default',
  providers: {
    default: {
      adapter: '@sails-pay/bachs',
      apiKey: process.env.BACHS_API_KEY,
      returnUrl: process.env.BACHS_RETURN_URL,
      cancelUrl: process.env.BACHS_CANCEL_URL,
      webhookSecret: process.env.BACHS_WEBHOOK_SECRET
    }
  }
}
```

Create a product checkout session with camelCase inputs:

```js
const checkoutUrl = await sails.pay.checkout({
  items: [{ product: 'prod_abc123' }],
  customer: {
    email: 'customer@example.com',
    name: 'Jane Doe'
  },
  reference: 'order_9876',
  metadata: {
    orderId: '9876'
  },
  returnUrl: 'https://example.com/payment/return',
  cancelUrl: 'https://example.com/payment/cancel',
  idempotencyKey: 'order_9876'
})
```

The adapter maps those inputs to Bachs Checkout Sessions internally:
`items` becomes `product_cart`, `product` becomes `product_id`,
`returnUrl` becomes `return_url`, and `idempotencyKey` becomes the
`Idempotency-Key` header.

### Bachs ad-hoc item pricing

Override a catalog product with a fixed price for one checkout using the
`amount` shorthand:

```js
const checkoutUrl = await sails.pay.checkout({
  items: [{ product: 'prod_abc123', amount: '19.00' }]
})
```

For pay-what-you-want pricing, provide camel-cased custom bounds. When using
Bachs' hosted checkout, omit `chosenAmount` and let the buyer select an amount
on the hosted page:

```js
const checkoutUrl = await sails.pay.checkout({
  items: [
    {
      product: 'prod_abc123',
      pricing: {
        type: 'custom',
        presetAmount: '10.00',
        minimumAmount: '5.00',
        maximumAmount: '100.00'
      }
    }
  ]
})
```

When the buyer already selected an amount in your own UI, pass it separately
as `chosenAmount`:

```js
const checkoutUrl = await sails.pay.checkout({
  items: [
    {
      product: 'prod_abc123',
      pricing: {
        type: 'custom',
        minimumAmount: '5.00',
        maximumAmount: '100.00'
      },
      chosenAmount: '12.00'
    }
  ]
})
```

Use `free` pricing when no money should be collected:

```js
const checkoutUrl = await sails.pay.checkout({
  items: [
    {
      product: 'prod_abc123',
      pricing: { type: 'free' }
    }
  ]
})
```

All money values must be decimal strings such as `'19.00'`, never JavaScript
numbers or minor units. `quantity` is optional and Bachs defaults it to `1`;
when supplied, it must be an integer of at least `1`.

Look up the returned checkout after redirect or webhook processing:

```js
const checkout = await sails.pay.checkout.get({
  checkoutId: 'chk_1a2b3c4d5e6f'
})

const charge = await sails.pay.verify({
  chargeId: checkout.charge.charge_id
})
```

## Bachs customer portal

Create a fresh, short-lived customer portal session with an API key that has
the `customers:write` permission:

```js
const portalUrl = await sails.pay.customer.portal({
  customerId: 'cust_1a2b3c4d5e6f'
})
```

When Bachs is not the default provider, select it explicitly:

```js
const portalUrl = await sails.pay
  .provider('bachs')
  .customer.portal({ customerId: 'cust_1a2b3c4d5e6f' })
```

Each call creates a new portal session. The adapter does not cache or persist
the returned URL.

## Bachs Connect

Use the named Bachs provider when a Sails application needs to onboard and pay
marketplace sellers, creators, or contractors while another provider remains
the default for customer payments:

```js
const bachs = sails.pay.provider('bachs')
```

Create a recipient-only connected account. The adapter converts the camelCase
input into Bachs' recipient configuration and requests only the capabilities
you explicitly enable:

```js
const account = await bachs.account.create({
  contactEmail: 'contributor@example.com',
  displayName: 'Tembo Contributor',
  country: 'NG',
  entityType: 'individual',
  capabilities: {
    transfers: true,
    payouts: true
  }
})

const onboarding = await bachs.account.link.create({
  accountId: account.id,
  type: 'onboarding',
  refreshUrl: 'https://example.com/connect/refresh',
  returnUrl: 'https://example.com/connect/return'
})
```

After Bachs reports both capabilities as active, move money from the platform
balance into the connected account:

```js
const transfer = await bachs.transfer.create({
  destination: account.id,
  amount: '1600.00',
  currency: 'NGN',
  transferGroup: 'creator-payrun-2026-08',
  description: 'August creator earnings',
  idempotencyKey: 'creator-payrun-2026-08-account-42'
})
```

Money amounts are decimal strings, not JavaScript numbers or minor units. The
adapter maps `transferGroup` to `transfer_group` and sends `idempotencyKey` as
the `Idempotency-Key` header.

Resolve a Nigerian bank account and register it as a destination belonging to
the connected account:

```js
const banks = await bachs.payout.bank.list({
  country: 'NG',
  currency: 'NGN',
  accountId: account.id
})

const selectedBankCode = '058' // Select a code from the provider response.

const resolved = await bachs.payout.bank.resolve({
  accountNumber: '0123456789',
  bankCode: selectedBankCode,
  currency: 'NGN',
  accountId: account.id
})

const destination = await bachs.payout.destination.create({
  type: 'bank_account',
  currency: 'NGN',
  name: resolved.account_name,
  accountNumber: '0123456789',
  bankCode: selectedBankCode,
  accountId: account.id,
  idempotencyKey: 'bank-destination-account-42'
})
```

Passing `accountId` makes the adapter act for that connected account using the
provider header. Application code never needs to construct `X-Account-Id` or
a Bachs URL itself.

Once the destination is usable, withdraw from the connected account:

```js
const payout = await bachs.payout.create({
  destination: destination.id,
  amount: '1500.00',
  reference: 'creator-payout-42',
  metadata: { contributorId: '42' },
  idempotencyKey: 'creator-payout-42-attempt-1',
  accountId: account.id
})

const currentPayout = await bachs.payout.get({
  payoutId: payout.id,
  accountId: account.id
})
```

The Connect resource API is:

```text
bachs.account.create()              bachs.account.get()
bachs.account.link.create()
bachs.transfer.create()             bachs.transfer.get()
bachs.balance.get()
bachs.payout.bank.list()            bachs.payout.bank.resolve()
bachs.payout.destination.create()   bachs.payout.destination.get()
bachs.payout.create()               bachs.payout.get()
bachs.webhooks.verify()
```

Verify Bachs webhooks against the exact raw request body before applying an
event:

```js
await bachs.webhooks.verify({
  rawBody: req.rawBody,
  timestamp: req.get('X-Bachs-Timestamp'),
  signature: req.get('X-Bachs-Signature')
})
```

The adapter is intentionally transport-focused. Your application remains the
source of truth for its own ledger, webhook-event idempotency, payout state,
authorization, retry policy, and reconciliation records.

## Contributing

If you're interested in contributing to Sails Pay, please read our [contributing guide](https://github.com/sailscastshq/sails-pay/blob/main/.github/CONTRIBUTING.md).

## Sponsors

If you'd like to become a sponsor, check out [DominusKelvin](https://github.com/sponsors/DominusKelvin) sponsor page and tiers.
