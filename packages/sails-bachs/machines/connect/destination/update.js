const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
const {
  toDestination,
  destinationPayload
} = require('../../../helpers/connect')
module.exports = require('machine').build({
  friendlyName: 'Update payout destination',
  description:
    'Manages a destination on the specified connected account. Routing changes require provider review before further payouts.',
  moreInfoUrl:
    'https://docs.bachs.io/api-reference/payouts/update-payout-destination',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    account: { type: 'string', required: true },
    destination: {
      type: 'string',
      required: true,
      description: 'Destination ID, scoped to this connected account.'
    },
    type: { type: 'string', isIn: ['bank', 'mobileMoney', 'crypto'] },
    currency: { type: 'string' },
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
    isDefault: { type: 'boolean' },
    metadata: { type: 'ref' }
  },
  exits: {
    success: { outputType: 'ref' },
    couldNotUpdateDestination: {
      outputType: 'ref',
      description: 'The destination request failed.'
    }
  },
  fn: async function (inputs, exits) {
    const config = require('../../../adapter').config
    try {
      const response = await fetch(
        `/payouts/destinations/${encodeURIComponent(inputs.destination)}`,
        {
          method: 'PATCH',
          apiKey: inputs.apiKey || config.apiKey,
          baseUrl: inputs.baseUrl || config.baseUrl,
          headers: { 'X-Account-Id': inputs.account },
          idempotencyKey: inputs.idempotencyKey,
          body: destinationPayload(inputs)
        }
      )
      return exits.success(toDestination(response))
    } catch (error) {
      return exits.couldNotUpdateDestination(error.bachs || error)
    }
  }
})
