const fetch = require('../../helpers/fetch')
const parameters = require('../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Get payout',
  description: 'Retrieves the current state of a Bachs payout.',
  moreInfoUrl: 'https://docs.bachs.io/api-reference/payouts/get-payout',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    payoutId: { type: 'string', required: true },
    accountId: {
      type: 'string',
      description: 'Optional connected Bachs account to act on behalf of.'
    }
  },
  exits: {
    success: { outputVariableName: 'payout', outputType: 'ref' },
    couldNotGetPayout: { outputVariableName: 'error', outputType: 'ref' }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../adapter').config

    try {
      const payout = await fetch(
        `/payouts/${encodeURIComponent(inputs.payoutId)}`,
        {
          method: 'GET',
          apiKey: inputs.apiKey || adapterConfig.apiKey,
          baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
          headers: inputs.accountId
            ? { 'X-Account-Id': inputs.accountId }
            : undefined
        }
      )
      return exits.success(payout)
    } catch (error) {
      return exits.couldNotGetPayout(error.bachs || error)
    }
  }
})
