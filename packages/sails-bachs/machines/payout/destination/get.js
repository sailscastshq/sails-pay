const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Get payout destination',
  description:
    'Retrieves the review and usability state of a Bachs payout destination.',
  moreInfoUrl:
    'https://docs.bachs.io/api-reference/payouts/get-payout-destination',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    destinationId: { type: 'string', required: true },
    accountId: {
      type: 'string',
      description: 'Optional connected Bachs account to act on behalf of.'
    }
  },
  exits: {
    success: { outputVariableName: 'destination', outputType: 'ref' },
    couldNotGetDestination: { outputVariableName: 'error', outputType: 'ref' }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config

    try {
      const destination = await fetch(
        `/payouts/destinations/${encodeURIComponent(inputs.destinationId)}`,
        {
          method: 'GET',
          apiKey: inputs.apiKey || adapterConfig.apiKey,
          baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
          headers: inputs.accountId
            ? { 'X-Account-Id': inputs.accountId }
            : undefined
        }
      )
      return exits.success(destination)
    } catch (error) {
      return exits.couldNotGetDestination(error.bachs || error)
    }
  }
})
