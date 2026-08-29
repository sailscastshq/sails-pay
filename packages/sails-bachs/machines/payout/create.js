const fetch = require('../../helpers/fetch')
const parameters = require('../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Create payout',
  description:
    'Creates an asynchronous Bachs payout to an approved destination.',
  moreInfoUrl: 'https://docs.bachs.io/api-reference/payouts/create-payout',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    destination: {
      type: 'string',
      required: true,
      description: 'An approved Bachs payout destination ID.'
    },
    amount: {
      type: 'string',
      required: true,
      description: 'The decimal amount the destination should receive.'
    },
    reference: {
      type: 'string',
      description: 'Your payout reference, up to 128 characters.'
    },
    metadata: { type: 'ref', description: 'Payout metadata.' },
    idempotencyKey: {
      type: 'string',
      description: 'Prevents a retry from creating a duplicate payout.'
    },
    accountId: {
      type: 'string',
      description: 'Optional connected Bachs account to act on behalf of.'
    }
  },
  exits: {
    success: {
      description: 'The payout accepted by Bachs.',
      outputVariableName: 'payout',
      outputType: 'ref'
    },
    couldNotCreatePayout: {
      description: 'The payout could not be created.',
      outputVariableName: 'error',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../adapter').config

    try {
      const payout = await fetch('/payouts', {
        method: 'POST',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        idempotencyKey: inputs.idempotencyKey || inputs.reference,
        headers: inputs.accountId
          ? { 'X-Account-Id': inputs.accountId }
          : undefined,
        body: {
          destination: inputs.destination,
          amount: inputs.amount,
          ...(inputs.reference && { reference: inputs.reference }),
          ...(inputs.metadata && { metadata: inputs.metadata })
        }
      })

      return exits.success(payout)
    } catch (error) {
      return exits.couldNotCreatePayout(error.bachs || error)
    }
  }
})
