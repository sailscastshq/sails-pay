const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
module.exports = require('machine').build({
  friendlyName: 'List bank',
  description:
    'Bank reference data and resolution supplied by the provider, not by the application.',
  moreInfoUrl: 'https://docs.bachs.io/api-reference/reference/list-banks',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    country: { type: 'string', required: true, minLength: 2, maxLength: 2 }
  },
  exits: {
    success: { outputType: 'ref' },
    couldNotListBanks: {
      outputType: 'ref',
      description: 'Bank request failed.'
    }
  },
  fn: async function (inputs, exits) {
    const config = require('../../../adapter').config
    try {
      const response = await fetch(
        `/reference/banks?country=${encodeURIComponent(
          inputs.country.toUpperCase()
        )}`,
        {
          method: 'GET',
          apiKey: inputs.apiKey || config.apiKey,
          baseUrl: inputs.baseUrl || config.baseUrl
        }
      )
      return exits.success(
        (response.banks || []).map(({ code, name }) => ({ code, name }))
      )
    } catch (error) {
      return exits.couldNotListBanks(error.bachs || error)
    }
  }
})
