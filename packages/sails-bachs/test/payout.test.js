const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const adapter = require('../adapter')
const fetch = require('../helpers/fetch')

afterEach(() => {
  adapter.config = {}
  fetch.resetFetchImplementation()
})

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Request failed',
    text: async () => JSON.stringify(body)
  }
}

test('adapter exposes the Bachs payout and balance surface', () => {
  assert.equal(typeof adapter.account.create, 'function')
  assert.equal(typeof adapter.account.get, 'function')
  assert.equal(typeof adapter.account.link.create, 'function')
  assert.equal(typeof adapter.transfer.create, 'function')
  assert.equal(typeof adapter.transfer.get, 'function')
  assert.equal(typeof adapter.payout.create, 'function')
  assert.equal(typeof adapter.payout.get, 'function')
  assert.equal(typeof adapter.payout.destination.create, 'function')
  assert.equal(typeof adapter.payout.destination.get, 'function')
  assert.equal(typeof adapter.payout.bank.list, 'function')
  assert.equal(typeof adapter.payout.bank.resolve, 'function')
  assert.equal(typeof adapter.balance.get, 'function')
})

test('Connect account creation requests only recipient transfer and payout capabilities', async () => {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    return jsonResponse({ id: 'acct_123', capabilities: {} }, 201)
  })

  await adapter.account.create({
    apiKey: 'sk_sandbox_123',
    contactEmail: 'contributor@example.com',
    displayName: 'Tembo Contributor',
    idempotencyKey: 'connect-user-42'
  })

  assert.equal(calls[0].url, 'https://sandbox-api.bachs.io/v1/accounts')
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'connect-user-42')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    contact_email: 'contributor@example.com',
    display_name: 'Tembo Contributor',
    country: 'NG',
    entity_type: 'individual',
    configuration: {
      recipient: {
        capabilities: {
          transfers: { requested: true },
          payouts: { requested: true }
        }
      }
    }
  })
})

test('Connect account creation omits capabilities that were not requested', async () => {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    return jsonResponse({ id: 'acct_123', capabilities: {} }, 201)
  })

  await adapter.account.create({
    apiKey: 'sk_sandbox_123',
    contactEmail: 'contributor@example.com',
    capabilities: { transfers: true, payouts: false }
  })

  assert.deepEqual(
    JSON.parse(calls[0].options.body).configuration.recipient.capabilities,
    { transfers: { requested: true } }
  )
})

test('Connect onboarding links use the documented connected-account path', async () => {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    return jsonResponse({ id: 'cal_123', url: 'https://connect.bachs.io/123' })
  })

  await adapter.account.link.create({
    apiKey: 'sk_sandbox_123',
    accountId: 'acct/unsafe',
    type: 'onboarding',
    refreshUrl: 'https://temboai.com/payouts/connect/refresh',
    returnUrl: 'https://temboai.com/payouts/connect/return'
  })

  assert.equal(
    calls[0].url,
    'https://sandbox-api.bachs.io/v1/connected-accounts/acct%2Funsafe/account-links'
  )
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    type: 'onboarding',
    refresh_url: 'https://temboai.com/payouts/connect/refresh',
    return_url: 'https://temboai.com/payouts/connect/return'
  })
})

test('Connect account reads escape the account identifier', async () => {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    return jsonResponse({ id: 'acct_123', capabilities: {} })
  })

  await adapter.account.get({
    apiKey: 'sk_sandbox_123',
    accountId: 'acct/unsafe'
  })

  assert.equal(
    calls[0].url,
    'https://sandbox-api.bachs.io/v1/accounts/acct%2Funsafe'
  )
})

test('Connect transfers support platform funding and connected-account recovery', async () => {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    return jsonResponse({ id: 'tr_123', status: 'paid' })
  })

  await adapter.transfer.create({
    apiKey: 'sk_sandbox_123',
    destination: 'acct_123',
    amount: '1600.00',
    currency: 'NGN',
    transferGroup: 'tembo-payout-123',
    description: 'Tembo contributor payout',
    idempotencyKey: 'fund-123'
  })
  await adapter.transfer.create({
    apiKey: 'sk_sandbox_123',
    accountId: 'acct_123',
    destination: 'self',
    amount: '50.00',
    currency: 'NGN',
    idempotencyKey: 'recover-123'
  })
  await adapter.transfer.get({
    apiKey: 'sk_sandbox_123',
    transferId: 'tr/unsafe'
  })

  assert.equal(calls[0].url, 'https://sandbox-api.bachs.io/v1/transfers')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    destination: 'acct_123',
    amount: '1600.00',
    currency: 'NGN',
    transfer_group: 'tembo-payout-123',
    description: 'Tembo contributor payout'
  })
  assert.equal(calls[1].options.headers['X-Account-Id'], 'acct_123')
  assert.equal(
    calls[2].url,
    'https://sandbox-api.bachs.io/v1/transfers/tr%2Funsafe'
  )
})

test('payout.create maps idempotency and connected-account headers', async () => {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    return jsonResponse({ id: 'pay_123', status: 'pending' })
  })

  const payout = await adapter.payout.create({
    apiKey: 'sk_sandbox_123',
    destination: 'pd_123',
    amount: '1500.00',
    reference: 'tembo-payout-123',
    metadata: { contributor: '42' },
    idempotencyKey: 'idem-123',
    accountId: 'acct_connected'
  })

  assert.equal(payout.id, 'pay_123')
  assert.equal(calls[0].url, 'https://sandbox-api.bachs.io/v1/payouts')
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'idem-123')
  assert.equal(calls[0].options.headers['X-Account-Id'], 'acct_connected')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    destination: 'pd_123',
    amount: '1500.00',
    reference: 'tembo-payout-123',
    metadata: { contributor: '42' }
  })
})

test('payout destination creation sends bank details without renaming mistakes', async () => {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    return jsonResponse(
      {
        id: 'pd_123',
        status: 'pending_review',
        account_name: 'KELVIN OMERESHONE'
      },
      201
    )
  })

  const destination = await adapter.payout.destination.create({
    apiKey: 'sk_sandbox_123',
    currency: 'NGN',
    type: 'bank_account',
    name: 'Tembo contributor payout',
    accountNumber: '0123456789',
    bankCode: '058',
    metadata: { contributor: '42' },
    idempotencyKey: 'destination-42',
    accountId: 'acct_connected'
  })

  assert.equal(destination.id, 'pd_123')
  assert.equal(
    calls[0].url,
    'https://sandbox-api.bachs.io/v1/payouts/destinations'
  )
  assert.equal(calls[0].options.headers['X-Account-Id'], 'acct_connected')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    currency: 'NGN',
    name: 'Tembo contributor payout',
    type: 'bank_account',
    account_number: '0123456789',
    bank_code: '058',
    metadata: { contributor: '42' }
  })
})

test('payout reads, bank tools, and balances use the documented endpoints', async () => {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    return jsonResponse({ ok: true })
  })

  await adapter.payout.get({
    apiKey: 'sk_sandbox_123',
    payoutId: 'pay/unsafe',
    accountId: 'acct_connected'
  })
  await adapter.payout.destination.get({
    apiKey: 'sk_sandbox_123',
    destinationId: 'pd/unsafe',
    accountId: 'acct_connected'
  })
  await adapter.payout.bank.list({
    apiKey: 'sk_sandbox_123',
    accountId: 'acct_connected'
  })
  await adapter.payout.bank.resolve({
    apiKey: 'sk_sandbox_123',
    accountNumber: '0123456789',
    bankCode: '058',
    accountId: 'acct_connected'
  })
  await adapter.balance.get({
    apiKey: 'sk_sandbox_123',
    accountId: 'acct_connected'
  })

  assert.deepEqual(
    calls.map((call) => call.url),
    [
      'https://sandbox-api.bachs.io/v1/payouts/pay%2Funsafe',
      'https://sandbox-api.bachs.io/v1/payouts/destinations/pd%2Funsafe',
      'https://sandbox-api.bachs.io/v1/payouts/banks?country=NG&currency=NGN',
      'https://sandbox-api.bachs.io/v1/payouts/banks/resolve',
      'https://sandbox-api.bachs.io/v1/balances'
    ]
  )
  assert.deepEqual(JSON.parse(calls[3].options.body), {
    account_number: '0123456789',
    bank_code: '058',
    currency: 'NGN'
  })
  for (const call of calls) {
    assert.equal(call.options.headers['X-Account-Id'], 'acct_connected')
  }
})

test('payout.create preserves normalized Bachs errors for reconciliation decisions', async () => {
  fetch.setFetchImplementation(async () =>
    jsonResponse(
      {
        detail: 'Payouts are not enabled',
        error_code: 'PAYOUTS_NOT_ENABLED'
      },
      403
    )
  )

  await assert.rejects(
    () =>
      adapter.payout.create({
        apiKey: 'sk_sandbox_123',
        destination: 'pd_123',
        amount: '1500.00',
        reference: 'tembo-payout-123'
      }),
    (error) => {
      assert.equal(error.exit, 'couldNotCreatePayout')
      assert.equal(error.raw.statusCode, 403)
      assert.equal(error.raw.code, 'PAYOUTS_NOT_ENABLED')
      return true
    }
  )
})
