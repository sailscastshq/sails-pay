const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
const {
  toDestination,
  destinationPayload
} = require('../../../helpers/connect')
module.exports = require('machine').build({
  friendlyName: 'List payout destination',
  description:
    'Manages a destination on the specified connected account. Routing changes require provider review before further payouts.',
  moreInfoUrl:
    'https://docs.bachs.io/api-reference/payouts/list-payout-destinations',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    account: { type: 'string', required: true },
    currency: { type: 'string' },
    limit: { type: 'number', defaultsTo: 100, min: 1, max: 100 },
    offset: { type: 'number', defaultsTo: 0, min: 0 }
  },
  exits: {
    success: { outputType: 'ref' },
    couldNotListDestinations: {
      outputType: 'ref',
      description: 'The destination request failed.'
    }
  },
  fn: async function (inputs, exits) {
    const config = require('../../../adapter').config
    try {
      const response = await fetch(
        `/payouts/destinations?limit=${inputs.limit}&offset=${inputs.offset}${
          inputs.currency
            ? '&currency=' + encodeURIComponent(inputs.currency)
            : ''
        }`,
        {
          method: 'GET',
          apiKey: inputs.apiKey || config.apiKey,
          baseUrl: inputs.baseUrl || config.baseUrl,
          headers: { 'X-Account-Id': inputs.account }
        }
      )
      return exits.success({
        destinations: (response.destinations || []).map(toDestination),
        total:
          response.total === undefined
            ? (response.destinations || []).length
            : response.total,
        limit: response.limit === undefined ? inputs.limit : response.limit,
        offset: response.offset === undefined ? inputs.offset : response.offset
      })
    } catch (error) {
      return exits.couldNotListDestinations(error.bachs || error)
    }
  }
})
