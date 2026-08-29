const fetch = require('../../helpers/fetch')
const parameters = require('../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Get connected account',
  description: 'Retrieves a Bachs Connect account and its capabilities.',
  moreInfoUrl: 'https://docs.bachs.io/connect/guides/create-an-account',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    accountId: { type: 'string', required: true }
  },
  exits: {
    success: { outputVariableName: 'account', outputType: 'ref' },
    couldNotGetAccount: { outputVariableName: 'error', outputType: 'ref' }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../adapter').config
    try {
      const account = await fetch(
        `/accounts/${encodeURIComponent(inputs.accountId)}`,
        {
          method: 'GET',
          apiKey: inputs.apiKey || adapterConfig.apiKey,
          baseUrl: inputs.baseUrl || adapterConfig.baseUrl
        }
      )
      return exits.success(account)
    } catch (error) {
      return exits.couldNotGetAccount(error.bachs || error)
    }
  }
})
