const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')
const adapter = require('../adapter')
const verify = require('../machines/webhooks/verify')

function sign({ rawBody, secret, timestamp }) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex')
}

test('webhooks.verify accepts a valid Bachs webhook signature', async () => {
  const rawBody = '{"id":"evt_123","type":"collection.succeeded"}'
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = sign({
    rawBody,
    secret: 'whsec_123',
    timestamp
  })

  const valid = await verify({
    webhookSecret: 'whsec_123',
    rawBody,
    timestamp,
    signature
  })

  assert.equal(valid, true)
})

test('webhooks.verify rejects invalid signatures', async () => {
  const rawBody = '{"id":"evt_123","type":"collection.succeeded"}'
  const timestamp = Math.floor(Date.now() / 1000).toString()

  await assert.rejects(
    () =>
      verify({
        webhookSecret: 'whsec_123',
        rawBody,
        timestamp,
        signature: 'bad-signature'
      }),
    (error) => {
      assert.equal(error.exit, 'invalidSignature')
      assert.equal(error.raw.message, 'Invalid Bachs webhook signature.')
      return true
    }
  )
})

test('webhooks.verify rejects stale timestamps', async () => {
  const rawBody = '{"id":"evt_123","type":"collection.succeeded"}'
  const timestamp = '100'
  const signature = sign({
    rawBody,
    secret: 'whsec_123',
    timestamp
  })

  await assert.rejects(
    () =>
      verify({
        webhookSecret: 'whsec_123',
        rawBody,
        timestamp,
        signature,
        toleranceSeconds: 300
      }),
    (error) => {
      assert.equal(error.exit, 'invalidSignature')
      assert.equal(error.raw.message, 'Stale Bachs webhook timestamp.')
      return true
    }
  )
})

test('adapter exposes webhooks.verify as the uniform webhook verification API', () => {
  assert.equal(typeof adapter.webhooks.verify, 'function')
  assert.deepEqual(Object.keys(adapter.webhooks), ['verify'])
})
