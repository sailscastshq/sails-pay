const fetch = require('../../helpers/fetch')
const parameters = require('../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Get balances',
  description: 'Retrieves spendable Bachs balances for payout checks.',
  moreInfoUrl: 'https://docs.bachs.io/api-reference/balance/get-balances',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    accountId: { type: 'string' }
  },
  exits: {
    success: { outputVariableName: 'balances', outputType: 'ref' },
    couldNotGetBalances: { outputVariableName: 'error', outputType: 'ref' }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../adapter').config

    try {
      const balances = await fetch('/balances', {
        method: 'GET',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        headers: inputs.accountId
          ? { 'X-Account-Id': inputs.accountId }
          : undefined
      })
      return exits.success(balances)
    } catch (error) {
      return exits.couldNotGetBalances(error.bachs || error)
    }
  }
})
