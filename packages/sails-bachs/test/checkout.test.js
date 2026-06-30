const test = require('node:test')
const assert = require('node:assert/strict')
const adapter = require('../adapter')
const checkout = require('../machines/checkout')
const fetch = require('../helpers/fetch')

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
    items: [{ product: 'prod_abc123', quantity: 1 }],
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
        product_id: 'prod_abc123',
        quantity: 1
      }
    ],
    return_url: 'https://example.com/return',
    cancel_url: 'https://example.com/cancel',
    reference: 'order_123'
  })

  fetch.resetFetchImplementation()
})

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

  fetch.resetFetchImplementation()
})
