const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
const {
  toDestination,
  destinationPayload
} = require('../../../helpers/connect')
module.exports = require('machine').build({
  friendlyName: 'Create payout destination',
  description:
    'Manages a destination on the specified connected account. Routing changes require provider review before further payouts.',
  moreInfoUrl:
    'https://docs.bachs.io/api-reference/payouts/create-payout-destination',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    account: { type: 'string', required: true },
    type: {
      type: 'string',
      isIn: ['bank', 'mobileMoney', 'crypto'],
      required: true
    },
    currency: { type: 'string', required: true },
    name: { type: 'string' },
    accountNumber: { type: 'string' },
    accountName: { type: 'string' },
    bankCode: { type: 'string' },
    bankName: { type: 'string' },
    phoneNumber: { type: 'string' },
    mobileProvider: { type: 'string' },
    walletAddress: { type: 'string' },
    network: { type: 'string' },
    idempotencyKey: { type: 'string' },
    metadata: { type: 'ref' }
  },
  exits: {
    success: { outputType: 'ref' },
    couldNotCreateDestination: {
      outputType: 'ref',
      description: 'The destination request failed.'
    }
  },
  fn: async function (inputs, exits) {
    const config = require('../../../adapter').config
    try {
      const response = await fetch('/payouts/destinations', {
        method: 'POST',
        apiKey: inputs.apiKey || config.apiKey,
        baseUrl: inputs.baseUrl || config.baseUrl,
        headers: { 'X-Account-Id': inputs.account },
        idempotencyKey: inputs.idempotencyKey,
        body: destinationPayload(inputs)
      })
      return exits.success(toDestination(response))
    } catch (error) {
      return exits.couldNotCreateDestination(error.bachs || error)
    }
  }
})
