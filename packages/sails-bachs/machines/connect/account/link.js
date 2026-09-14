const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
const { toLink } = require('../../../helpers/connect')

module.exports = require('machine').build({
  friendlyName: 'Create connected account link',
  description:
    'Creates a short-lived hosted link that walks a connected account through its outstanding requirements.',
  moreInfoUrl: 'https://docs.bachs.io/connect/guides/hosted-onboarding',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    account: {
      type: 'string',
      required: true,
      description: 'The connected account ID.'
    },
    type: {
      type: 'string',
      isIn: ['onboarding', 'update'],
      defaultsTo: 'onboarding',
      description:
        'Use "onboarding" for new accounts and "update" to edit details.'
    },
    returnUrl: {
      type: 'string',
      required: true,
      description: 'Where the account lands after leaving the hosted flow.'
    },
    refreshUrl: {
      type: 'string',
      required: true,
      description: 'Where an expired or already used link sends the account.'
    }
  },
  exits: {
    success: {
      description: 'The hosted link.',
      outputVariableName: 'link',
      outputType: 'ref'
    },
    couldNotCreateLink: {
      description: 'The hosted link could not be created.',
      outputVariableName: 'error',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config

    try {
      const link = await fetch(
        `/accounts/${encodeURIComponent(inputs.account)}/account-links`,
        {
          method: 'POST',
          apiKey: inputs.apiKey || adapterConfig.apiKey,
          baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
          body: {
            type: inputs.type,
            refresh_url: inputs.refreshUrl,
            return_url: inputs.returnUrl
          }
        }
      )

      return exits.success(toLink(link))
    } catch (error) {
      return exits.couldNotCreateLink(error.bachs || error)
    }
  }
})
