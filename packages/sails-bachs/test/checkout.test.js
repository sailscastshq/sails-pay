const test = require('node:test')
const assert = require('node:assert/strict')
const adapter = require('../adapter')
const checkout = require('../machines/checkout')
const fetch = require('../helpers/fetch')

test.afterEach(() => {
  fetch.resetFetchImplementation()
  adapter.config = {}
})

test('checkout creates a Bachs checkout session from camelCase inputs', async () => {
  const calls = []

  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })

    return {
      ok: true,
      status: 201,
      statusText: 'Created',
      text: async () =>
        JSON.stringify({
          checkout_id: 'chk_123',
          checkout_url: 'https://pay.bachs.io/c/test'
        })
    }
  })

  const checkoutUrl = await checkout({
    apiKey: 'sk_sandbox_123',
    items: [{ product: 'prod_abc123' }],
    customer: {
      email: 'customer@example.com',
      name: 'Jane Doe'
    },
    returnUrl: 'https://example.com/return',
    cancelUrl: 'https://example.com/cancel',
    reference: 'order_123'
  })

  assert.equal(checkoutUrl, 'https://pay.bachs.io/c/test')
  assert.equal(
    calls[0].url,
    'https://sandbox-api.bachs.io/v1/checkout-sessions'
  )
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'order_123')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    customer: {
      email: 'customer@example.com',
      name: 'Jane Doe'
    },
    product_cart: [
      {
        product_id: 'prod_abc123'
      }
    ],
    return_url: 'https://example.com/return',
    cancel_url: 'https://example.com/cancel',
    reference: 'order_123'
  })
})

test('checkout sends custom pricing and the buyer-selected amount', async () => {
  const calls = []

  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })

    return {
      ok: true,
      status: 201,
      statusText: 'Created',
      text: async () =>
        JSON.stringify({
          checkout_url: 'https://pay.bachs.io/c/custom'
        })
    }
  })

  const checkoutUrl = await checkout({
    apiKey: 'sk_sandbox_123',
    items: [
      {
        product: 'prod_custom',
        pricing: {
          type: 'custom',
          presetAmount: '10.00',
          minimumAmount: '5.00',
          maximumAmount: '100.00'
        },
        chosenAmount: '12.00'
      }
    ]
  })

  assert.equal(checkoutUrl, 'https://pay.bachs.io/c/custom')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    customer: {},
    product_cart: [
      {
        product_id: 'prod_custom',
        pricing: {
          price_type: 'custom',
          preset_amount: '10.00',
          minimum_amount: '5.00',
          maximum_amount: '100.00'
        },
        amount: '12.00'
      }
    ]
  })
})

test('checkout preserves pure checkout behavior', async () => {
  const calls = []

  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })

    return {
      ok: true,
      status: 201,
      statusText: 'Created',
      text: async () =>
        JSON.stringify({
          checkout_url: 'https://pay.bachs.io/c/pure'
        })
    }
  })

  const checkoutUrl = await checkout({
    apiKey: 'sk_sandbox_123',
    amount: '42.00',
    currency: 'USD',
    reference: 'pure_123'
  })

  assert.equal(checkoutUrl, 'https://pay.bachs.io/c/pure')
  assert.equal(calls[0].url, 'https://sandbox-api.bachs.io/v1/checkouts')
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'pure_123')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    pricing: {
      currency: 'USD',
      amount: '42.00'
    },
    reference: 'pure_123'
  })
})

const invalidItemCases = [
  {
    name: 'amount with explicit pricing',
    item: {
      product: 'prod_123',
      amount: '19.00',
      pricing: { type: 'fixed', amount: '19.00' }
    },
    field: 'items[0]',
    message: /both amount and pricing/
  },
  {
    name: 'an unsupported pricing type',
    item: {
      product: 'prod_123',
      pricing: { type: 'metered' }
    },
    field: 'items[0].pricing.type',
    message: /fixed, custom, or free/
  },
  {
    name: 'fixed pricing without an amount',
    item: {
      product: 'prod_123',
      pricing: { type: 'fixed' }
    },
    field: 'items[0].pricing.amount',
    message: /required for fixed pricing/
  },
  ...['presetAmount', 'minimumAmount', 'maximumAmount'].map((field) => ({
    name: `fixed pricing with ${field}`,
    item: {
      product: 'prod_123',
      pricing: {
        type: 'fixed',
        amount: '19.00',
        [field]: '10.00'
      }
    },
    field: `items[0].pricing.${field}`,
    message: /not allowed with fixed pricing/
  })),
  {
    name: 'custom pricing with a fixed amount',
    item: {
      product: 'prod_123',
      pricing: {
        type: 'custom',
        amount: '19.00'
      }
    },
    field: 'items[0].pricing.amount',
    message: /not allowed with custom pricing/
  },
  ...['amount', 'presetAmount', 'minimumAmount', 'maximumAmount'].map(
    (field) => ({
      name: `free pricing with ${field}`,
      item: {
        product: 'prod_123',
        pricing: {
          type: 'free',
          [field]: '10.00'
        }
      },
      field: `items[0].pricing.${field}`,
      message: /not allowed with free pricing/
    })
  ),
  {
    name: 'free pricing with chosenAmount',
    item: {
      product: 'prod_123',
      pricing: { type: 'free' },
      chosenAmount: '10.00'
    },
    field: 'items[0].chosenAmount',
    message: /not allowed with free pricing/
  },
  {
    name: 'fixed amount shorthand with chosenAmount',
    item: {
      product: 'prod_123',
      amount: '19.00',
      chosenAmount: '10.00'
    },
    field: 'items[0].chosenAmount',
    message: /catalog custom pricing or ad-hoc custom pricing/
  },
  {
    name: 'explicit fixed pricing with chosenAmount',
    item: {
      product: 'prod_123',
      pricing: { type: 'fixed', amount: '19.00' },
      chosenAmount: '10.00'
    },
    field: 'items[0].chosenAmount',
    message: /catalog custom pricing or ad-hoc custom pricing/
  },
  {
    name: 'a numeric amount shorthand',
    item: {
      product: 'prod_123',
      amount: 1900
    },
    field: 'items[0].amount',
    message: /decimal string/
  },
  {
    name: 'a numeric chosenAmount',
    item: {
      product: 'prod_123',
      chosenAmount: 1200
    },
    field: 'items[0].chosenAmount',
    message: /decimal string/
  },
  {
    name: 'a numeric fixed pricing amount',
    item: {
      product: 'prod_123',
      pricing: { type: 'fixed', amount: 1900 }
    },
    field: 'items[0].pricing.amount',
    message: /decimal string/
  },
  ...['presetAmount', 'minimumAmount', 'maximumAmount'].map((field) => ({
    name: `a numeric custom pricing ${field}`,
    item: {
      product: 'prod_123',
      pricing: {
        type: 'custom',
        [field]: 1000
      }
    },
    field: `items[0].pricing.${field}`,
    message: /decimal string/
  })),
  ...[
    ['zero', 0],
    ['a fraction', 1.5],
    ['a string', '2']
  ].map(([description, quantity]) => ({
    name: `${description} quantity`,
    item: {
      product: 'prod_123',
      quantity
    },
    field: 'items[0].quantity',
    message: /integer of at least 1/
  }))
]

for (const invalidCase of invalidItemCases) {
  test(`checkout rejects ${invalidCase.name} before calling Bachs`, async () => {
    let fetchCalls = 0

    fetch.setFetchImplementation(async () => {
      fetchCalls += 1
    })

    await assert.rejects(
      () =>
        checkout({
          apiKey: 'sk_sandbox_123',
          items: [invalidCase.item]
        }),
      (error) => {
        assert.equal(error.exit, 'invalidRequest')
        assert.equal(error.raw.field, invalidCase.field)
        assert.match(error.raw.message, invalidCase.message)
        return true
      }
    )

    assert.equal(fetchCalls, 0)
  })
}

test('adapter exposes checkout.get as the uniform checkout lookup API', async () => {
  const calls = []

  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () =>
        JSON.stringify({
          checkout_id: 'chk_123',
          status: 'COMPLETED',
          charge: {
            charge_id: 'chr_123',
            status: 'succeeded'
          }
        })
    }
  })

  const result = await adapter.checkout.get({
    apiKey: 'sk_sandbox_123',
    checkoutId: 'chk_123'
  })

  assert.equal(typeof adapter.checkout, 'function')
  assert.equal(typeof adapter.checkout.get, 'function')
  assert.equal(result.checkout_id, 'chk_123')
  assert.equal(result.charge.charge_id, 'chr_123')
  assert.equal(
    calls[0].url,
    'https://sandbox-api.bachs.io/v1/checkouts/chk_123'
  )
  assert.equal(calls[0].options.method, 'GET')
})
