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
  items: [{ product: 'prod_abc123', quantity: 1 }],
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

Look up the returned checkout after redirect or webhook processing:

```js
const checkout = await sails.pay.checkout.get({
  checkoutId: 'chk_1a2b3c4d5e6f'
})

const charge = await sails.pay.verify({
  chargeId: checkout.charge.charge_id
})
```

## Contributing

If you're interested in contributing to Sails Pay, please read our [contributing guide](https://github.com/sailscastshq/sails-pay/blob/main/.github/CONTRIBUTING.md).

## Sponsors

If you'd like to become a sponsor, check out [DominusKelvin](https://github.com/sponsors/DominusKelvin) sponsor page and tiers.
