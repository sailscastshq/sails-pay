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

function recordCalls(responses) {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    const next = responses[calls.length - 1]
    return jsonResponse(next.body, next.status)
  })
  return calls
}

test('adapter exposes exactly the Connect surface', () => {
  assert.deepEqual(Object.keys(adapter.connect).sort(), [
    'account',
    'balance',
    'payout',
    'transfer'
  ])
  assert.deepEqual(Object.keys(adapter.connect.account).sort(), [
    'create',
    'get',
    'link'
  ])
  assert.deepEqual(Object.keys(adapter.connect.transfer), ['create'])
  assert.deepEqual(Object.keys(adapter.connect.balance), ['get'])
  assert.deepEqual(Object.keys(adapter.connect.payout).sort(), [
    'create',
    'quote'
  ])
})

test('connect.account.create requests a recipient account and normalizes it', async () => {
  const calls = recordCalls([
    {
      status: 201,
      body: {
        id: 'acct_123',
        display_name: 'Ada Obi',
        country: 'NG',
        capabilities: {
          transfers: { status: 'pending', requested: true },
          payouts: { status: 'unrequested', requested: false }
        },
        requirements: { currently_due: ['payout_destination'] }
      }
    }
  ])

  const account = await adapter.connect.account.create({
    apiKey: 'sk_sandbox_123',
    email: 'ada@example.com',
    name: 'Ada Obi',
    idempotencyKey: 'maintainer-42'
  })

  assert.equal(calls[0].url, 'https://sandbox-api.bachs.io/v1/accounts')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'maintainer-42')
  assert.equal(calls[0].options.headers['X-Account-Id'], undefined)
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    contact_email: 'ada@example.com',
    display_name: 'Ada Obi',
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

  assert.equal(account.id, 'acct_123')
  assert.equal(account.email, 'ada@example.com')
  assert.equal(account.name, 'Ada Obi')
  assert.equal(account.country, 'NG')
  assert.deepEqual(account.capabilities, {
    transfers: 'pending',
    payouts: 'inactive'
  })
  assert.deepEqual(account.requirements, ['payout_destination'])
  assert.equal(account.raw.id, 'acct_123')
})

test('connect.account.get reads the account by id', async () => {
  const calls = recordCalls([
    {
      body: {
        id: 'acct_1/2',
        capabilities: { payouts: { status: 'active' } },
        requirements: { currently_due: [] }
      }
    }
  ])

  const account = await adapter.connect.account.get({
    apiKey: 'sk_sandbox_123',
    account: 'acct_1/2'
  })

  assert.equal(
    calls[0].url,
    'https://sandbox-api.bachs.io/v1/accounts/acct_1%2F2'
  )
  assert.equal(calls[0].options.method, 'GET')
  assert.deepEqual(account.capabilities, { payouts: 'active' })
  assert.deepEqual(account.requirements, [])
})

test('connect.account.link creates a hosted onboarding link', async () => {
  const calls = recordCalls([
    {
      body: {
        url: 'https://connect.bachs.io/l/abc',
        expires_at: '2026-09-14T16:00:00Z'
      }
    }
  ])

  const link = await adapter.connect.account.link({
    apiKey: 'sk_sandbox_123',
    account: 'acct_123',
    returnUrl: 'https://flossafrica.com/payouts/return',
    refreshUrl: 'https://flossafrica.com/payouts/refresh'
  })

  assert.equal(
    calls[0].url,
    'https://sandbox-api.bachs.io/v1/accounts/acct_123/account-links'
  )
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    type: 'onboarding',
    refresh_url: 'https://flossafrica.com/payouts/refresh',
    return_url: 'https://flossafrica.com/payouts/return'
  })
  assert.equal(link.url, 'https://connect.bachs.io/l/abc')
  assert.equal(link.expiresAt, '2026-09-14T16:00:00Z')
})

test('connect.transfer.create moves platform funds to the account', async () => {
  const calls = recordCalls([
    {
      status: 201,
      body: {
        id: 'tr_1',
        destination: 'acct_123',
        amount: '10000.00',
        currency: 'NGN',
        transfer_group: 'pool-2026-09',
        status: 'paid'
      }
    }
  ])

  const transfer = await adapter.connect.transfer.create({
    apiKey: 'sk_sandbox_123',
    account: 'acct_123',
    amount: '10000.00',
    currency: 'NGN',
    group: 'pool-2026-09',
    idempotencyKey: 'pool-2026-09-acct_123'
  })

  assert.equal(calls[0].url, 'https://sandbox-api.bachs.io/v1/transfers')
  assert.equal(calls[0].options.headers['X-Account-Id'], undefined)
  assert.equal(
    calls[0].options.headers['Idempotency-Key'],
    'pool-2026-09-acct_123'
  )
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    destination: 'acct_123',
    amount: '10000.00',
    currency: 'NGN',
    transfer_group: 'pool-2026-09'
  })
  assert.deepEqual(
    { ...transfer, raw: undefined },
    {
      id: 'tr_1',
      account: 'acct_123',
      amount: '10000.00',
      currency: 'NGN',
      group: 'pool-2026-09',
      status: 'paid',
      raw: undefined
    }
  )
})

test('connect.balance.get acts as the account and returns one entry per currency', async () => {
  const calls = recordCalls([
    {
      body: {
        account_id: 'acct_123',
        balances: [
          {
            currency: 'NGN',
            available_balance: '12000.00',
            pending_balance: '0.00'
          },
          {
            currency: 'USD',
            available_balance: '5.00',
            pending_balance: '1.00'
          }
        ],
        total_balance_usd: '13.00'
      }
    }
  ])

  const balances = await adapter.connect.balance.get({
    apiKey: 'sk_sandbox_123',
    account: 'acct_123'
  })

  assert.equal(calls[0].url, 'https://sandbox-api.bachs.io/v1/balances')
  assert.equal(calls[0].options.headers['X-Account-Id'], 'acct_123')
  assert.deepEqual(balances, [
    { currency: 'NGN', available: '12000.00', pending: '0.00' },
    { currency: 'USD', available: '5.00', pending: '1.00' }
  ])
})

test('connect.payout.quote scopes the quote to the account and normalizes both currencies', async () => {
  const calls = recordCalls([
    {
      status: 201,
      body: {
        quote_id: 'pqt_123',
        from_currency: 'USD',
        to_currency: 'NGN',
        from_amount: '25.00',
        to_amount: '37125.00',
        exchange_rate: '1500.00',
        expires_at: '2026-09-28T12:31:00Z'
      }
    }
  ])

  const quote = await adapter.connect.payout.quote({
    apiKey: 'sk_sandbox_123',
    account: 'acct_123',
    fromCurrency: 'USD',
    toCurrency: 'NGN',
    amount: '25.00'
  })

  assert.equal(calls[0].url, 'https://sandbox-api.bachs.io/v1/payouts/quotes')
  assert.equal(calls[0].options.headers['X-Account-Id'], 'acct_123')
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    from_currency: 'USD',
    to_currency: 'NGN',
    amount: '25.00'
  })
  assert.deepEqual(
    { ...quote, raw: undefined },
    {
      id: 'pqt_123',
      fromCurrency: 'USD',
      toCurrency: 'NGN',
      fromAmount: '25.00',
      toAmount: '37125.00',
      exchangeRate: '1500.00',
      expiresAt: '2026-09-28T12:31:00Z',
      raw: undefined
    }
  )
})

test('connect.payout.quote exposes Bachs quote errors', async () => {
  recordCalls([
    {
      status: 400,
      body: {
        error_code: 'VALIDATION_ERROR',
        detail: 'Unsupported currency pair'
      }
    }
  ])

  await assert.rejects(
    adapter.connect.payout.quote({
      apiKey: 'sk_sandbox_123',
      account: 'acct_123',
      fromCurrency: 'USD',
      toCurrency: 'NGN',
      amount: '25.00'
    }),
    (error) =>
      error.exit === 'couldNotCreateQuote' &&
      error.raw.code === 'VALIDATION_ERROR'
  )
})

test('connect.payout.create resolves the default destination for the currency', async () => {
  const calls = recordCalls([
    {
      body: {
        destinations: [
          { id: 'pd_old', is_usable: true, is_default: false },
          { id: 'pd_broken', is_usable: false, is_default: false },
          { id: 'pd_default', is_usable: true, is_default: true }
        ],
        total: 3,
        limit: 20,
        offset: 0
      }
    },
    {
      body: {
        id: 'pay_1',
        status: 'processing',
        amount: '9000.00',
        currency: 'NGN',
        fee: '50.00',
        total_debited: '9050.00',
        destination: 'pd_default'
      }
    }
  ])

  const payout = await adapter.connect.payout.create({
    apiKey: 'sk_sandbox_123',
    account: 'acct_123',
    amount: '9000.00',
    currency: 'NGN',
    reference: 'withdrawal-1',
    idempotencyKey: 'withdrawal-1-attempt-1'
  })

  assert.equal(
    calls[0].url,
    'https://sandbox-api.bachs.io/v1/payouts/destinations?currency=NGN'
  )
  assert.equal(calls[0].options.headers['X-Account-Id'], 'acct_123')
  assert.equal(calls[1].url, 'https://sandbox-api.bachs.io/v1/payouts')
  assert.equal(calls[1].options.headers['X-Account-Id'], 'acct_123')
  assert.equal(
    calls[1].options.headers['Idempotency-Key'],
    'withdrawal-1-attempt-1'
  )
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    destination: 'pd_default',
    amount: '9000.00',
    reference: 'withdrawal-1'
  })
  assert.deepEqual(
    { ...payout, raw: undefined },
    {
      id: 'pay_1',
      account: 'acct_123',
      amount: '9000.00',
      currency: 'NGN',
      sourceCurrency: 'NGN',
      fee: '50.00',
      totalDebited: '9050.00',
      destination: 'pd_default',
      status: 'pending',
      raw: undefined
    }
  )
})

test('connect.payout.create uses a quote and the NGN default destination without an amount', async () => {
  const calls = recordCalls([
    {
      body: {
        destinations: [
          { id: 'pd_ngn', is_usable: true, is_default: true },
          { id: 'pd_review', is_usable: false }
        ]
      }
    },
    {
      status: 201,
      body: {
        id: 'pay_usd_ngn',
        status: 'processing',
        amount: '37125.00',
        currency: 'NGN',
        source_currency: 'USD',
        fee: '1.00',
        total_debited: '25.00',
        destination: 'pd_ngn'
      }
    }
  ])

  const payout = await adapter.connect.payout.create({
    apiKey: 'sk_sandbox_123',
    account: 'acct_123',
    currency: 'NGN',
    quoteId: 'pqt_123',
    reference: 'withdrawal-usd-1',
    idempotencyKey: 'withdrawal-usd-1'
  })

  assert.equal(
    calls[0].url,
    'https://sandbox-api.bachs.io/v1/payouts/destinations?currency=NGN'
  )
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    destination: 'pd_ngn',
    quote_id: 'pqt_123',
    reference: 'withdrawal-usd-1'
  })
  assert.equal(payout.amount, '37125.00')
  assert.equal(payout.currency, 'NGN')
  assert.equal(payout.sourceCurrency, 'USD')
  assert.equal(payout.fee, '1.00')
  assert.equal(payout.totalDebited, '25.00')
})

test('connect.payout.create rejects amount plus quote before calling Bachs', async () => {
  const calls = recordCalls([])

  await assert.rejects(
    adapter.connect.payout.create({
      apiKey: 'sk_sandbox_123',
      account: 'acct_123',
      amount: '25.00',
      currency: 'NGN',
      quoteId: 'pqt_123'
    }),
    (error) =>
      error.exit === 'couldNotCreatePayout' &&
      error.raw.message === 'Pass exactly one of amount or quoteId.'
  )
  assert.equal(calls.length, 0)
})

test('connect.payout.create uses an explicit destination without a lookup', async () => {
  const calls = recordCalls([
    {
      body: {
        id: 'pay_2',
        status: 'completed',
        amount: '100.00',
        currency: 'NGN',
        destination: 'pd_1'
      }
    }
  ])

  const payout = await adapter.connect.payout.create({
    apiKey: 'sk_sandbox_123',
    account: 'acct_123',
    amount: '100.00',
    destination: 'pd_1',
    idempotencyKey: 'withdrawal-2'
  })

  assert.equal(calls.length, 1)
  assert.equal(payout.status, 'paid')
})

test('connect.payout.create exits noDestination when nothing is usable', async () => {
  recordCalls([
    {
      body: {
        destinations: [{ id: 'pd_review', is_usable: false }],
        total: 1,
        limit: 20,
        offset: 0
      }
    }
  ])

  await assert.rejects(
    adapter.connect.payout.create({
      apiKey: 'sk_sandbox_123',
      account: 'acct_123',
      amount: '100.00',
      currency: 'NGN'
    }),
    (error) => error.exit === 'noDestination'
  )
})

test('connect.payout.create exits noDestination without a destination or currency', async () => {
  const calls = recordCalls([])

  await assert.rejects(
    adapter.connect.payout.create({
      apiKey: 'sk_sandbox_123',
      account: 'acct_123',
      amount: '100.00'
    }),
    (error) => error.exit === 'noDestination'
  )
  assert.equal(calls.length, 0)
})

test('Connect errors surface the normalized Bachs error', async () => {
  recordCalls([
    {
      status: 400,
      body: { error_code: 'INSUFFICIENT_BALANCE', detail: 'Not enough funds' }
    }
  ])

  await assert.rejects(
    adapter.connect.transfer.create({
      apiKey: 'sk_sandbox_123',
      account: 'acct_123',
      amount: '1.00',
      currency: 'NGN'
    }),
    (error) =>
      error.exit === 'couldNotCreateTransfer' &&
      error.raw.code === 'INSUFFICIENT_BALANCE'
  )
})
