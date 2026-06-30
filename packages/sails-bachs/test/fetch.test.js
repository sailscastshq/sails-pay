const test = require('node:test')
const assert = require('node:assert/strict')
const fetch = require('../helpers/fetch')

test('resolveBaseUrl uses configured URL first', () => {
  assert.equal(
    fetch.resolveBaseUrl({
      apiKey: 'sk_sandbox_123',
      baseUrl: 'https://example.test'
    }),
    'https://example.test'
  )
})

test('resolveBaseUrl derives sandbox URL from sandbox keys', () => {
  assert.equal(
    fetch.resolveBaseUrl({ apiKey: 'sk_sandbox_123' }),
    'https://sandbox-api.bachs.io'
  )
})

test('resolveBaseUrl defaults to live URL', () => {
  assert.equal(
    fetch.resolveBaseUrl({ apiKey: 'sk_live_123' }),
    'https://api.bachs.io'
  )
})

test('fetch prefixes /v1, sends auth, idempotency, and JSON body', async () => {
  const calls = []

  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })

    return {
      ok: true,
      status: 201,
      statusText: 'Created',
      text: async () =>
        JSON.stringify({ checkout_url: 'https://pay.bachs.io/c/test' })
    }
  })

  const response = await fetch('/checkout-sessions', {
    method: 'POST',
    apiKey: 'sk_sandbox_123',
    idempotencyKey: 'order_123',
    body: {
      reference: 'order_123'
    }
  })

  assert.deepEqual(response, {
    checkout_url: 'https://pay.bachs.io/c/test'
  })
  assert.equal(
    calls[0].url,
    'https://sandbox-api.bachs.io/v1/checkout-sessions'
  )
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer sk_sandbox_123')
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'order_123')
  assert.equal(calls[0].options.body, '{"reference":"order_123"}')

  fetch.resetFetchImplementation()
})

test('fetch normalizes non-2xx Bachs errors', async () => {
  fetch.setFetchImplementation(async () => ({
    ok: false,
    status: 400,
    statusText: 'Bad Request',
    text: async () =>
      JSON.stringify({
        detail: 'Invalid request parameters',
        error_code: 'VALIDATION_ERROR',
        errors: [
          {
            field: 'customer.email',
            message: 'Invalid email',
            type: 'value_error'
          }
        ]
      })
  }))

  await assert.rejects(
    () =>
      fetch('/checkout-sessions', {
        method: 'POST',
        apiKey: 'sk_sandbox_123',
        body: {}
      }),
    (error) => {
      assert.equal(error.bachs.statusCode, 400)
      assert.equal(error.bachs.code, 'VALIDATION_ERROR')
      assert.equal(error.bachs.message, 'Invalid request parameters')
      assert.equal(error.bachs.errors[0].field, 'customer.email')
      return true
    }
  )

  fetch.resetFetchImplementation()
})
