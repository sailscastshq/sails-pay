const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
const {
  toDestination,
  destinationPayload
} = require('../../../helpers/connect')
module.exports = require('machine').build({
  friendlyName: 'Get payout destination',
  description:
    'Manages a destination on the specified connected account. Routing changes require provider review before further payouts.',
  moreInfoUrl:
    'https://docs.bachs.io/api-reference/payouts/get-payout-destination',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    account: { type: 'string', required: true },
    destination: {
      type: 'string',
      required: true,
      description: 'Destination ID, scoped to this connected account.'
    }
  },
  exits: {
    success: { outputType: 'ref' },
    couldNotGetDestination: {
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
          method: 'GET',
          apiKey: inputs.apiKey || config.apiKey,
          baseUrl: inputs.baseUrl || config.baseUrl,
          headers: { 'X-Account-Id': inputs.account }
        }
      )
      return exits.success(toDestination(response))
    } catch (error) {
      return exits.couldNotGetDestination(error.bachs || error)
    }
  }
})
