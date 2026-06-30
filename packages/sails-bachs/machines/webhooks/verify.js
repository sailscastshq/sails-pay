const crypto = require('crypto')
const parameters = require('../../helpers/parameters')

function normalizeRawBody(rawBody) {
  if (Buffer.isBuffer(rawBody)) {
    return rawBody.toString('utf8')
  }

  return rawBody
}

function safelyCompare(expected, received) {
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(received)

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
}

module.exports = require('machine').build({
  friendlyName: 'Verify Bachs webhook signature',
  description: 'Verifies X-Bachs-Timestamp and X-Bachs-Signature.',
  moreInfoUrl: 'https://docs.bachs.io/guides/webhooks/overview',
  inputs: {
    webhookSecret: parameters.BACHS_WEBHOOK_SECRET,
    rawBody: {
      type: 'ref',
      required: true,
      description: 'The exact raw request body string or Buffer.'
    },
    timestamp: {
      type: 'string',
      required: true,
      description: 'The X-Bachs-Timestamp header value.'
    },
    signature: {
      type: 'string',
      required: true,
      description: 'The X-Bachs-Signature header value.'
    },
    toleranceSeconds: {
      type: 'number',
      defaultsTo: 300,
      description: 'Maximum allowed timestamp skew in seconds.'
    }
  },
  exits: {
    success: {
      description: 'The signature is valid.',
      outputVariableName: 'valid',
      outputType: 'boolean'
    },
    invalidSignature: {
      description: 'The signature is missing, stale, or invalid.',
      outputVariableName: 'error',
      outputType: 'ref'
    }
  },
  fn: async function (
    { webhookSecret, rawBody, timestamp, signature, toleranceSeconds },
    exits
  ) {
    const adapterConfig = require('../../adapter').config
    const secret = webhookSecret || adapterConfig.webhookSecret

    if (!secret || !timestamp || !signature) {
      return exits.invalidSignature({
        message: 'Missing Bachs webhook signing data.'
      })
    }

    const parsedTimestamp = Number.parseInt(timestamp, 10)

    if (!Number.isFinite(parsedTimestamp)) {
      return exits.invalidSignature({
        message: 'Invalid Bachs webhook timestamp.'
      })
    }

    if (Math.abs(Date.now() / 1000 - parsedTimestamp) > toleranceSeconds) {
      return exits.invalidSignature({
        message: 'Stale Bachs webhook timestamp.'
      })
    }

    const rawBodyString = normalizeRawBody(rawBody)
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBodyString}`, 'utf8')
      .digest('hex')

    if (!safelyCompare(expected, signature)) {
      return exits.invalidSignature({
        message: 'Invalid Bachs webhook signature.'
      })
    }

    return exits.success(true)
  }
})
