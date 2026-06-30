const fetch = require('../../helpers/fetch')
const { buildRefundPayload } = require('../../helpers/payloads')
const parameters = require('../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Create refund',
  description: 'Creates a Bachs refund for a completed payment.',
  moreInfoUrl: 'https://docs.bachs.io/api-reference/refunds/create-refund',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    chargeId: {
      type: 'string',
      required: true,
      description: 'The Bachs charge ID to refund.'
    },
    reference: {
      type: 'string',
      required: true,
      description:
        'Your unique refund reference. Bachs requires this per organization and environment.'
    },
    refundAddress: {
      type: 'string',
      description: 'Destination wallet address for crypto refunds.'
    },
    amount: {
      type: 'string',
      description:
        'Optional partial refund amount in the charge settlement currency.'
    },
    feeBearer: {
      type: 'string',
      description: 'Who bears the refund fee: org or customer.'
    },
    reason: {
      type: 'string',
      description: 'Human-readable reason for the refund.'
    },
    idempotencyKey: {
      type: 'string',
      description:
        'Optional idempotency key. Sent as both body idempotency_key and Idempotency-Key header.'
    },
    simulatedOutcome: {
      type: 'string',
      description: 'Sandbox-only forced refund outcome.'
    }
  },
  exits: {
    success: {
      description: 'The Bachs refund.',
      outputVariableName: 'refund',
      outputType: 'ref'
    },
    couldNotCreateRefund: {
      description: 'Refund could not be created.',
      outputVariableName: 'errors',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../adapter').config

    try {
      const refund = await fetch('/payments/refunds', {
        method: 'POST',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        idempotencyKey: inputs.idempotencyKey || inputs.reference,
        body: buildRefundPayload(inputs)
      })

      return exits.success(refund)
    } catch (error) {
      return exits.couldNotCreateRefund(error.bachs || error)
    }
  }
})
