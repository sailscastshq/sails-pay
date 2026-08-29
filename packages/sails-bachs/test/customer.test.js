const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const adapter = require('../adapter')
const fetch = require('../helpers/fetch')

afterEach(() => {
  adapter.config = {}
  fetch.resetFetchImplementation()
})

test('customer.portal creates a fresh sandbox portal session without a body', async () => {
  const calls = []

  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })

    return {
      ok: true,
      status: 201,
      statusText: 'Created',
      text: async () =>
        JSON.stringify({
          id: `psn_${calls.length}`,
          url: `https://portal.bachs.io/s/${calls.length}`
        })
    }
  })

  const firstPortalUrl = await adapter.customer.portal({
    apiKey: 'sk_sandbox_123',
    customerId: 'cust_123'
  })
  const secondPortalUrl = await adapter.customer.portal({
    apiKey: 'sk_sandbox_123',
    customerId: 'cust_123'
  })

  assert.equal(typeof adapter.customer.portal, 'function')
  assert.equal(firstPortalUrl, 'https://portal.bachs.io/s/1')
  assert.equal(secondPortalUrl, 'https://portal.bachs.io/s/2')
  assert.equal(calls.length, 2)

  for (const call of calls) {
    assert.equal(
      call.url,
      'https://sandbox-api.bachs.io/v1/customers/cust_123/portal-sessions'
    )
    assert.equal(call.options.method, 'POST')
    assert.equal(call.options.headers.Authorization, 'Bearer sk_sandbox_123')
    assert.equal(Object.hasOwn(call.options, 'body'), false)
  }
})

test('customer.portal falls back to adapter configuration', async () => {
  const calls = []
  adapter.config = {
    apiKey: 'sk_live_configured',
    baseUrl: 'https://configured.example'
  }

  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })

    return {
      ok: true,
      status: 201,
      statusText: 'Created',
      text: async () =>
        JSON.stringify({
          id: 'psn_configured',
          url: 'https://portal.bachs.io/s/configured'
        })
    }
  })

  const portalUrl = await adapter.customer.portal({
    customerId: 'cust_configured'
  })

  assert.equal(portalUrl, 'https://portal.bachs.io/s/configured')
  assert.equal(
    calls[0].url,
    'https://configured.example/v1/customers/cust_configured/portal-sessions'
  )
  assert.equal(
    calls[0].options.headers.Authorization,
    'Bearer sk_live_configured'
  )
})

test('customer.portal input credentials override adapter configuration', async () => {
  const calls = []
  adapter.config = {
    apiKey: 'sk_live_configured',
    baseUrl: 'https://configured.example'
  }

  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })

    return {
      ok: true,
      status: 201,
      statusText: 'Created',
      text: async () =>
        JSON.stringify({
          id: 'psn_override',
          url: 'https://portal.bachs.io/s/override'
        })
    }
  })

  await adapter.customer.portal({
    apiKey: 'sk_sandbox_override',
    baseUrl: 'https://override.example/api',
    customerId: 'cust/override'
  })

  assert.equal(
    calls[0].url,
    'https://override.example/v1/customers/cust%2Foverride/portal-sessions'
  )
  assert.equal(
    calls[0].options.headers.Authorization,
    'Bearer sk_sandbox_override'
  )
})

test('customer.portal rejects a malformed success response', async () => {
  fetch.setFetchImplementation(async () => ({
    ok: true,
    status: 201,
    statusText: 'Created',
    text: async () => JSON.stringify({ id: 'psn_without_url' })
  }))

  await assert.rejects(
    () =>
      adapter.customer.portal({
        apiKey: 'sk_sandbox_123',
        customerId: 'cust_123'
      }),
    (error) => {
      assert.equal(error.exit, 'couldNotCreatePortalUrl')
      assert.deepEqual(error.raw, { id: 'psn_without_url' })
      return true
    }
  )
})

for (const statusCode of [401, 403, 404, 429, 500, 503]) {
  test(`customer.portal normalizes Bachs ${statusCode} responses`, async () => {
    fetch.setFetchImplementation(async () => ({
      ok: false,
      status: statusCode,
      statusText: 'Request failed',
      text: async () =>
        JSON.stringify({
          detail: `Portal request failed with ${statusCode}`,
          error_code: `STATUS_${statusCode}`
        })
    }))

    await assert.rejects(
      () =>
        adapter.customer.portal({
          apiKey: 'sk_sandbox_123',
          customerId: 'cust_123'
        }),
      (error) => {
        assert.equal(error.exit, 'couldNotCreatePortalUrl')
        assert.equal(error.raw.statusCode, statusCode)
        assert.equal(error.raw.statusText, 'Request failed')
        assert.equal(error.raw.code, `STATUS_${statusCode}`)
        assert.equal(
          error.raw.message,
          `Portal request failed with ${statusCode}`
        )
        return true
      }
    )
  })
}
