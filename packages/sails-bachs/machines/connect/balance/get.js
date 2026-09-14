const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
const { toBalances } = require('../../../helpers/connect')

module.exports = require('machine').build({
  friendlyName: 'Get connected account balance',
  description:
    'Retrieves the available and pending balance of a connected account in every currency it holds.',
  moreInfoUrl: 'https://docs.bachs.io/connect/balances',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    account: {
      type: 'string',
      required: true,
      description: 'The connected account ID.'
    }
  },
  exits: {
    success: {
      description: 'One entry per currency.',
      outputVariableName: 'balances',
      outputType: 'ref'
    },
    couldNotGetBalance: {
      description: 'The balance could not be retrieved.',
      outputVariableName: 'error',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config

    try {
      const response = await fetch('/balances', {
        method: 'GET',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        headers: { 'X-Account-Id': inputs.account }
      })

      return exits.success(toBalances(response))
    } catch (error) {
      return exits.couldNotGetBalance(error.bachs || error)
    }
  }
})
