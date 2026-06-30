const fetch = require('../../helpers/fetch')
const parameters = require('../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Get checkout',
  description: 'Retrieves a Bachs checkout by checkout ID.',
  moreInfoUrl: 'https://docs.bachs.io/api-reference/checkouts/get-checkout',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    checkoutId: {
      type: 'string',
      required: true,
      description: 'The Bachs checkout ID.'
    }
  },
  exits: {
    success: {
      description: 'The Bachs checkout.',
      outputVariableName: 'checkout',
      outputType: 'ref'
    },
    couldNotGetCheckout: {
      description: 'Checkout could not be retrieved.',
      outputVariableName: 'errors',
      outputType: 'ref'
    }
  },
  fn: async function ({ apiKey, baseUrl, checkoutId }, exits) {
    const adapterConfig = require('../../adapter').config

    try {
      const checkout = await fetch(
        `/checkouts/${encodeURIComponent(checkoutId)}`,
        {
          method: 'GET',
          apiKey: apiKey || adapterConfig.apiKey,
          baseUrl: baseUrl || adapterConfig.baseUrl
        }
      )

      return exits.success(checkout)
    } catch (error) {
      return exits.couldNotGetCheckout(error.bachs || error)
    }
  }
})
