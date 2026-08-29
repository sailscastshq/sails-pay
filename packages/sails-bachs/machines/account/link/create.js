const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Create connected account link',
  description: 'Creates a short-lived Bachs hosted onboarding link.',
  moreInfoUrl: 'https://docs.bachs.io/connect/guides/hosted-onboarding',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    accountId: { type: 'string', required: true },
    type: {
      type: 'string',
      isIn: ['onboarding', 'update'],
      defaultsTo: 'onboarding'
    },
    refreshUrl: { type: 'string', required: true },
    returnUrl: { type: 'string', required: true },
    idempotencyKey: { type: 'string' }
  },
  exits: {
    success: { outputVariableName: 'accountLink', outputType: 'ref' },
    couldNotCreateAccountLink: {
      outputVariableName: 'error',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config
    try {
      const link = await fetch(
        `/connected-accounts/${encodeURIComponent(
          inputs.accountId
        )}/account-links`,
        {
          method: 'POST',
          apiKey: inputs.apiKey || adapterConfig.apiKey,
          baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
          idempotencyKey: inputs.idempotencyKey,
          body: {
            type: inputs.type,
            refresh_url: inputs.refreshUrl,
            return_url: inputs.returnUrl
          }
        }
      )
      return exits.success(link)
    } catch (error) {
      return exits.couldNotCreateAccountLink(error.bachs || error)
    }
  }
})
