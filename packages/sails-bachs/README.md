# @sails-pay/bachs

The Bachs adapter for [Sails Pay](https://github.com/sailscastshq/sails-pay).
It exposes Bachs Checkout, Connect, customer portal, refund, and webhook
operations through Sails Pay's camelCase machine API.

## Install

```sh
npm install sails-pay @sails-pay/bachs
```

Configure it as the default or a named provider in `config/pay.js`:

```js
module.exports.pay = {
  provider: 'paystack',
  providers: {
    paystack: {
      adapter: '@sails-pay/paystack',
      apiKey: process.env.PAYSTACK_SECRET_KEY
    },
    bachs: {
      adapter: '@sails-pay/bachs',
      apiKey: process.env.BACHS_API_KEY,
      baseUrl: process.env.BACHS_BASE_URL,
      webhookSecret: process.env.BACHS_WEBHOOK_SECRET
    }
  }
}
```

Select the named provider once in application code:

```js
const bachs = sails.pay.provider('bachs')
```

## Connect API

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

Create and onboard a recipient-only connected account:

```js
const account = await bachs.account.create({
  contactEmail: 'contributor@example.com',
  displayName: 'Tembo Contributor',
  country: 'NG',
  entityType: 'individual',
  capabilities: { transfers: true, payouts: true }
})

const onboarding = await bachs.account.link.create({
  accountId: account.id,
  type: 'onboarding',
  refreshUrl: 'https://example.com/connect/refresh',
  returnUrl: 'https://example.com/connect/return'
})
```

Fund the connected balance from the platform:

```js
const transfer = await bachs.transfer.create({
  destination: account.id,
  amount: '1600.00',
  currency: 'NGN',
  transferGroup: 'creator-payrun-2026-08',
  idempotencyKey: 'creator-payrun-2026-08-account-42'
})
```

Register a destination and withdraw while acting as that account:

```js
const destination = await bachs.payout.destination.create({
  type: 'bank_account',
  currency: 'NGN',
  name: 'Tembo Contributor',
  accountNumber: '0123456789',
  bankCode: '058',
  accountId: account.id,
  idempotencyKey: 'bank-destination-account-42'
})

const payout = await bachs.payout.create({
  destination: destination.id,
  amount: '1500.00',
  reference: 'creator-payout-42',
  idempotencyKey: 'creator-payout-42-attempt-1',
  accountId: account.id
})
```

Amounts are decimal strings. The adapter maps camelCase inputs to the Bachs
payload, adds authentication and idempotency headers, uses
`X-Connected-Account-ID` for connected-account transfer recovery, and uses
`X-Account-Id` for account-scoped balances, destinations, and withdrawals. It
also encodes resource identifiers and normalizes provider errors. Applications
remain responsible for their ledger, authorization, event idempotency, payout
state machine, and reconciliation policy.

Verify webhook signatures using the exact raw request body:

```js
await bachs.webhooks.verify({
  rawBody: req.rawBody,
  timestamp: req.get('X-Bachs-Timestamp'),
  signature: req.get('X-Bachs-Signature')
})
```
