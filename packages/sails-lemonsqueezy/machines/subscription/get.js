const fetch = require('../../helpers/fetch')

module.exports = require('machine').build({
  friendly: 'Get Subscription',
  description: 'Get a subscription by ID.',
  moreInfoUrl: 'https://docs.lemonsqueezy.com/api/subscriptions',
  inputs: {
    apiKey: require('../../helpers/parameters').LEMON_SQUEEZY_API_KEY,
    id: {
      type: 'string',
      description: 'The ID of the subscription to get.',
      allowNull: true
    }
  },
  exits: {
    success: {
      outputFriendlyName: 'Subscription',
      outputDescription: 'The subscription that was retrieved.'
    },
    error: {
      outputFriendlyName: 'Error',
      outputDescription: 'An unexpected error occurred.'
    }
  },
  fn: async function ({ apiKey, id }, exits) {
    const adapterConfig = require('../../adapter').config

    const subscription = await fetch(`/subscriptions/${id}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${apiKey || adapterConfig.apiKey}`
      }
    })
    if (subscription.errors) {
      const errors = subscription.errors
      return exits.error(errors)
    }

    return exits.success(subscription)
  }
})
