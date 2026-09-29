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

### Guest checkout

For a one-time hosted checkout, omit `customer` to let Bachs collect the buyer's email and name on its checkout page. The adapter omits empty customer details from the request. Bachs' default guest flow returns the payer under `customer_details` while `customer` remains `null`; handle that field in your payment webhooks. Supplying real customer details continues to work as before.

Guest payment details do not verify an app account or establish ownership of a product. Recurring checkout still requires the customer identity expected by Bachs.

See [Bachs guest checkout](https://docs.bachs.io/guides/checkout/checkout-sessions#guest-checkout).

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

## Connect

`sails.pay.connect` is for platforms that hold money for other people:
creators, maintainers, contractors, sellers. Each person gets a connected
account with a balance of its own. You collect payments with
`sails.pay.checkout`, transfer each person's share into their balance, and they
withdraw to their bank.

The API is the same for every provider that supports Connect. Bachs supports it
today.

Give someone a balance and send them through hosted onboarding:

```js
const account = await sails.pay.connect.account.create({
  email: 'ada@example.com',
  name: 'Ada Obi',
  country: 'NG',
  capabilities: ['transfers', 'payouts'],
  idempotencyKey: `maintainer-${maintainer.id}`
})

const { url } = await sails.pay.connect.account.link({
  account: account.id,
  type: 'onboarding',
  returnUrl: 'https://example.com/payouts/return',
  refreshUrl: 'https://example.com/payouts/refresh'
})
```

Check whether they can get paid:

```js
const account = await sails.pay.connect.account.get({ account: 'acct_...' })

account.capabilities.payouts // 'active' | 'pending' | 'inactive'
account.requirements // still due, e.g. ['payout_destination']
```

Transfer from your platform balance into theirs, then read their balance:

```js
await sails.pay.connect.transfer.create({
  account: 'acct_...',
  amount: '10000.00',
  currency: 'NGN',
  group: 'payrun-2026-09',
  idempotencyKey: 'payrun-2026-09-acct_...'
})

const balances = await sails.pay.connect.balance.get({ account: 'acct_...' })
// [{ currency: 'NGN', available: '10000.00', pending: '0.00' }]
```

Withdraw to their default destination for the currency, or pass `destination`:

```js
const payout = await sails.pay.connect.payout.create({
  account: 'acct_...',
  amount: '9000.00',
  currency: 'NGN',
  reference: 'withdrawal-42',
  idempotencyKey: 'withdrawal-42'
})
// { id, account, amount, currency, sourceCurrency, fee, totalDebited,
//   destination, status: 'pending', raw }
```

For a cross-currency payout, quote the amount in the balance currency first.
Then create the payout with its quote ID instead of an amount. The `currency`
used to find a default destination is the currency it receives:

```js
const quote = await sails.pay.connect.payout.quote({
  account: 'acct_...',
  fromCurrency: 'USD',
  toCurrency: 'NGN',
  amount: '25.00'
})
// { id, fromCurrency, toCurrency, fromAmount, toAmount, exchangeRate,
//   expiresAt, raw }

const payout = await sails.pay.connect.payout.create({
  account: 'acct_...',
  currency: 'NGN',
  quoteId: quote.id,
  reference: 'withdrawal-usd-42',
  idempotencyKey: 'withdrawal-usd-42'
})
```

Submit while the quote is valid and handle an expired quote by requesting a new
one. `toAmount` is Bachs' quoted destination amount; confirm the total source
balance debit from the created payout's `totalDebited`. Bachs' quote docs conflict
on fee treatment, so do not compute a withdrawal limit from an assumed fee.

Every method returns the same shape for every provider, with the provider's
untouched response on `raw`. Amounts are decimal strings. The account is always
passed as `account`, so application code never sets provider headers.

A provider without Connect throws
`The "<provider>" provider does not support Connect yet.` when you touch
`sails.pay.connect`.

Sails Pay moves the money. Your application owns the ledger, who may withdraw
from which account, webhook idempotency, and reconciliation.

### Split a checkout with a connected account

When a sale belongs to one connected account, split it at checkout instead of
transferring later. The account receives the rest of the sale when it settles,
and the provider records your platform fee:

```js
const checkoutUrl = await sails.pay.checkout({
  items: [{ product: 'prod_abc123', amount: '10500.00' }],
  reference: 'order_42',
  connect: {
    destination: 'acct_...',
    platformFee: '500.00'
  }
})
```

`destination` and `platformFee` are both required, and `platformFee` is a
positive decimal string. `connect` works on product checkout sessions only.
With Bachs, it maps to `transfer_data.destination` and `platform_fee`.

## Contributing

If you're interested in contributing to Sails Pay, please read our [contributing guide](https://github.com/sailscastshq/sails-pay/blob/main/.github/CONTRIBUTING.md).

## Sponsors

If you'd like to become a sponsor, check out [DominusKelvin](https://github.com/sponsors/DominusKelvin) sponsor page and tiers.

## Bank details and payout destinations

Bank lookup and destination management require `@sails-pay/bachs` **0.0.10** or later. This is an adapter patch; the existing `sails-pay` 0.2.6 hook already exposes these methods.

Use the provider's bank directory and account resolution to let recipients correct their payout details. Identity checks and onboarding can stay in the provider's hosted flow.

```js
// Get the provider's current bank directory; do not maintain one yourself.
const banks = await sails.pay.connect.bank.list({ country: 'NG' })

// Keep account numbers as strings so leading zeros survive.
const resolved = await sails.pay.connect.bank.resolve({
  country: 'NG',
  bankCode: '058',
  accountNumber: '0123456789'
})

// A successful HTTP response may still contain resolved: false.
if (!resolved.resolved) throw new Error('Check your bank details')

// List destinations belonging to this authenticated recipient's account.
const { destinations } = await sails.pay.connect.destination.list({
  account: recipient.connectedAccountId,
  currency: 'NGN',
  limit: 100,
  offset: 0
})

// Get a destination's latest status before allowing withdrawals.
const destination = await sails.pay.connect.destination.get({
  account: recipient.connectedAccountId,
  destination: recipient.payoutDestinationId
})

// Update the chosen bank with the name resolved on your server.
const updated = await sails.pay.connect.destination.update({
  account: recipient.connectedAccountId,
  destination: destination.id,
  type: 'bank',
  currency: 'NGN',
  bankCode: '058',
  accountNumber: resolved.accountNumber,
  accountName: resolved.accountName
})

// Create a destination if the recipient has none yet.
const created = await sails.pay.connect.destination.create({
  account: recipient.connectedAccountId,
  type: 'bank',
  currency: 'NGN',
  bankCode: '058',
  accountNumber: resolved.accountNumber,
  idempotencyKey: `bank-${recipient.id}-${confirmation.id}`
})
```

`bank.list` returns `{ code, name }[]`. `bank.resolve` returns `{ resolved, accountName, accountNumber, message }`. Both are platform-level reference calls. Destination operations are scoped to `account`; derive that account and the selected destination from the authenticated recipient, never arbitrary browser inputs.

`destination.list` returns `{ destinations, total, limit, offset }`. Each destination has normalized `type` (`bank`, `mobileMoney`, or `crypto`), `status` (`approved`, `pending`, or `rejected`), `statusReason`, `isUsable`, `isDefault`, routing details, and `raw`. Supported rails depend on the provider. Keep full account numbers and raw responses on the server; send only a masked summary to the browser.

Changing bank routing details can return the destination to review. Enable withdrawals only when `status === 'approved'` **and** `isUsable`. Retain the chosen destination ID and pass it to `payout.create({ account, destination, ... })`; do not switch to a different bank while review is pending. The Bachs adapter also refuses an unusable default rather than silently choosing a different usable destination.

Resolve and save are separate steps. Store a short-lived server confirmation bound to the connected account, bank code, account number and resolved name. Invalidate it when any input changes, and invalidate an existing withdrawal quote when the selected bank changes. Saving bank details should not automatically retry an old withdrawal.

For Bachs bank creation, the provider resolves the name itself. Bank updates use the supplied account name, so only send a name obtained through server-side resolution. Provider failures have dedicated exits: `couldNotListBanks`, `couldNotResolveBank`, `couldNotListDestinations`, `couldNotGetDestination`, `couldNotCreateDestination`, and `couldNotUpdateDestination`.
