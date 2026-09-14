const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
const { toAccount } = require('../../../helpers/connect')

module.exports = require('machine').build({
  friendlyName: 'Get connected account',
  description:
    'Retrieves a connected account with its capability statuses and currently due requirements.',
  moreInfoUrl: 'https://docs.bachs.io/connect/accounts',
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
      description: 'The connected account.',
      outputVariableName: 'account',
      outputType: 'ref'
    },
    couldNotGetAccount: {
      description: 'The account could not be retrieved.',
      outputVariableName: 'error',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config

    try {
      const account = await fetch(
        `/accounts/${encodeURIComponent(inputs.account)}`,
        {
          method: 'GET',
          apiKey: inputs.apiKey || adapterConfig.apiKey,
          baseUrl: inputs.baseUrl || adapterConfig.baseUrl
        }
      )

      return exits.success(toAccount(account))
    } catch (error) {
      return exits.couldNotGetAccount(error.bachs || error)
    }
  }
})
