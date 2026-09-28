const { test } = require('node:test')
const assert = require('node:assert/strict')
const hook = require('../index')

async function liftWith(providers, provider) {
  const sails = {
    config: { pay: { provider, providers } },
    hooks: { pay: {} },
    log: { info() {} }
  }
  await hook(sails).initialize()
  return sails
}

test('sails.pay.connect is the default provider Connect API', async () => {
  const sails = await liftWith(
    { default: { adapter: '@sails-pay/bachs', apiKey: 'sk_sandbox_123' } },
    'default'
  )

  assert.equal(typeof sails.pay.connect.account.create, 'function')
  assert.equal(typeof sails.pay.connect.account.get, 'function')
  assert.equal(typeof sails.pay.connect.account.link, 'function')
  assert.equal(typeof sails.pay.connect.transfer.create, 'function')
  assert.equal(typeof sails.pay.connect.balance.get, 'function')
  assert.equal(typeof sails.pay.connect.payout.create, 'function')
  assert.equal(typeof sails.pay.connect.payout.quote, 'function')
})

test('named providers expose the same Connect API', async () => {
  const sails = await liftWith(
    {
      default: { adapter: '@sails-pay/paystack', apiKey: 'sk_test_123' },
      bachs: { adapter: '@sails-pay/bachs', apiKey: 'sk_sandbox_123' }
    },
    'default'
  )

  assert.equal(
    typeof sails.pay.provider('bachs').connect.transfer.create,
    'function'
  )
})

test('providers without Connect throw a clear error on access', async () => {
  const sails = await liftWith(
    { default: { adapter: '@sails-pay/paystack', apiKey: 'sk_test_123' } },
    'default'
  )

  assert.throws(
    () => sails.pay.connect,
    /The "paystack" provider does not support Connect yet\./
  )
})
