const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'List payout banks',
  description: 'Lists banks and routing codes supported for Bachs payouts.',
  moreInfoUrl: 'https://docs.bachs.io/api-reference/payouts/list-banks',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    country: { type: 'string', defaultsTo: 'NG' },
    currency: { type: 'string', defaultsTo: 'NGN' },
    accountId: { type: 'string' }
  },
  exits: {
    success: { outputVariableName: 'banks', outputType: 'ref' },
    couldNotListBanks: { outputVariableName: 'error', outputType: 'ref' }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config
    const query = new URLSearchParams({
      country: inputs.country,
      currency: inputs.currency
    })

    try {
      const banks = await fetch(`/payouts/banks?${query}`, {
        method: 'GET',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        headers: inputs.accountId
          ? { 'X-Account-Id': inputs.accountId }
          : undefined
      })
      return exits.success(banks)
    } catch (error) {
      return exits.couldNotListBanks(error.bachs || error)
    }
  }
})
