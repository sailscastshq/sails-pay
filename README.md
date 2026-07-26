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

## Contributing

If you're interested in contributing to Sails Pay, please read our [contributing guide](https://github.com/sailscastshq/sails-pay/blob/main/.github/CONTRIBUTING.md).

## Sponsors

If you'd like to become a sponsor, check out [DominusKelvin](https://github.com/sponsors/DominusKelvin) sponsor page and tiers.
