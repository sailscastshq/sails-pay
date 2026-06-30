const fetch = require('../helpers/fetch')
const parameters = require('../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Verify charge',
  description: 'Retrieves the status and details of a Bachs charge.',
  moreInfoUrl: 'https://docs.bachs.io/guides/payments/get-charge-status',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    chargeId: {
      type: 'string',
      required: true,
      description: 'The Bachs charge ID.'
    }
  },
  exits: {
    success: {
      description: 'The Bachs charge.',
      outputVariableName: 'charge',
      outputType: 'ref'
    },
    couldNotVerifyCharge: {
      description: 'Charge could not be verified.',
      outputVariableName: 'errors',
      outputType: 'ref'
    }
  },
  fn: async function ({ apiKey, baseUrl, chargeId }, exits) {
    const adapterConfig = require('../adapter').config

    try {
      const charge = await fetch(
        `/payments/charges/${encodeURIComponent(chargeId)}`,
        {
          method: 'GET',
          apiKey: apiKey || adapterConfig.apiKey,
          baseUrl: baseUrl || adapterConfig.baseUrl
        }
      )

      return exits.success(charge)
    } catch (error) {
      return exits.couldNotVerifyCharge(error.bachs || error)
    }
  }
})
