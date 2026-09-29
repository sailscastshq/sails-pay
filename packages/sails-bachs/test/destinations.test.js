const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const adapter = require('../adapter')
const fetch = require('../helpers/fetch')
afterEach(() => {
  adapter.config = {}
  fetch.resetFetchImplementation()
})
const response = (body, status = 200) => ({
  ok: status < 400,
  status,
  statusText: 'Request failed',
  text: async () => JSON.stringify(body)
})
const bank = {
  id: 'pd_bank',
  type: 'bank_account',
  currency: 'NGN',
  status: 'approved',
  is_usable: true,
  is_default: true,
  bank_code: '058',
  bank_name: 'GTBank',
  account_number: '0123456789',
  account_name: 'ADA OKAFOR'
}

test('bank list and resolution use reference endpoints without account impersonation, preserving leading zeros', async () => {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    return response(
      calls.length === 1
        ? { banks: [{ code: '058', name: 'GTBank' }] }
        : {
            resolved: true,
            account_name: 'ADA OKAFOR',
            account_number: '0123456789'
          }
    )
  })
  assert.deepEqual(await adapter.connect.bank.list({ country: 'ng' }), [
    { code: '058', name: 'GTBank' }
  ])
  const result = await adapter.connect.bank.resolve({
    country: 'NG',
    bankCode: '058',
    accountNumber: '0123456789'
  })
  assert.equal(result.accountNumber, '0123456789')
  assert.equal(result.accountName, 'ADA OKAFOR')
  assert.equal(calls[0].url.endsWith('/v1/reference/banks?country=NG'), true)
  assert.equal(calls[1].url.endsWith('/v1/misc/bank-accounts/resolve'), true)
  assert.equal(calls[1].options.headers['X-Account-Id'], undefined)
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    country: 'NG',
    bank_code: '058',
    account_number: '0123456789'
  })
})

test('an unresolved HTTP-200 bank lookup never returns a trusted name', async () => {
  fetch.setFetchImplementation(async () =>
    response({
      resolved: false,
      account_name: 'untrusted',
      message: 'Account not found'
    })
  )
  const result = await adapter.connect.bank.resolve({
    country: 'NG',
    bankCode: '058',
    accountNumber: '0123456789'
  })
  assert.equal(result.resolved, false)
  assert.equal(result.accountName, null)
  assert.equal(result.message, 'Account not found')
})

test('destination reads are scoped, paginated, and normalize usable/default/review fields', async () => {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    return response(
      calls.length === 1
        ? { destinations: [bank], total: 2, limit: 1, offset: 0 }
        : {
            ...bank,
            status: 'pending_review',
            is_usable: false,
            status_reason: 'Review required'
          }
    )
  })
  const list = await adapter.connect.destination.list({
    account: 'acct_owner',
    currency: 'NGN',
    limit: 1
  })
  assert.equal(list.total, 2)
  assert.equal(list.destinations[0].type, 'bank')
  assert.equal(list.destinations[0].isDefault, true)
  const pending = await adapter.connect.destination.get({
    account: 'acct_owner',
    destination: 'pd_bank'
  })
  assert.equal(pending.status, 'pending')
  assert.equal(pending.isUsable, false)
  assert.equal(pending.statusReason, 'Review required')
  assert.equal(calls[1].url.endsWith('/v1/payouts/destinations/pd_bank'), true)
  for (const { options } of calls)
    assert.equal(options.headers['X-Account-Id'], 'acct_owner')
})

test('destination writes translate uniform fields and routing updates retain pending review', async () => {
  const calls = []
  fetch.setFetchImplementation(async (url, options) => {
    calls.push({ url, options })
    return response({ ...bank, status: 'pending_review', is_usable: false })
  })
  await adapter.connect.destination.create({
    account: 'acct_owner',
    type: 'crypto',
    currency: 'USDT_TRC20',
    walletAddress: 'wallet',
    network: 'TRON',
    idempotencyKey: 'new-wallet'
  })
  const changed = await adapter.connect.destination.update({
    account: 'acct_owner',
    destination: 'pd_bank',
    type: 'bank',
    currency: 'NGN',
    bankCode: '058',
    accountNumber: '0123456789',
    accountName: 'ADA OKAFOR'
  })
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    type: 'crypto_wallet',
    currency: 'USDT_TRC20',
    wallet_address: 'wallet',
    network: 'TRON'
  })
  assert.equal(calls[0].options.headers['Idempotency-Key'], 'new-wallet')
  assert.equal(calls[1].options.method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    type: 'bank_account',
    currency: 'NGN',
    bank_code: '058',
    account_number: '0123456789',
    account_name: 'ADA OKAFOR'
  })
  assert.equal(changed.status, 'pending')
  assert.equal(changed.isUsable, false)
})

test('a pending default destination never silently falls back to another approved bank', async () => {
  let calls = 0
  fetch.setFetchImplementation(async () => {
    calls++
    return response({
      destinations: [
        { ...bank, status: 'pending_review', is_usable: false },
        { ...bank, id: 'pd_other', is_default: false }
      ]
    })
  })
  let error
  try {
    await adapter.connect.payout.create({
      account: 'acct_owner',
      currency: 'NGN',
      amount: '100'
    })
  } catch (caught) {
    error = caught
  }
  assert.equal(error.code, 'noDestination')
  assert.equal(calls, 1)
})

test('provider destination errors retain field errors and structured exits', async () => {
  fetch.setFetchImplementation(async () =>
    response(
      {
        error_code: 'VALIDATION_ERROR',
        detail: 'Check the number',
        errors: [{ field: 'account_number', message: 'Exactly ten digits' }]
      },
      422
    )
  )
  let error
  try {
    await adapter.connect.destination.update({
      account: 'acct_owner',
      destination: 'pd_bank',
      accountNumber: '123'
    })
  } catch (caught) {
    error = caught
  }
  assert.equal(error.code, 'couldNotUpdateDestination')
  assert.equal(error.raw.code, 'VALIDATION_ERROR')
  assert.equal(error.raw.errors[0].field, 'account_number')
})
