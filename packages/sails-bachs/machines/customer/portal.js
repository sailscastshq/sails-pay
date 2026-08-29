const fetch = require('../../helpers/fetch')
const parameters = require('../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Create customer portal session',
  description:
    'Creates a fresh Bachs customer portal session and returns its hosted URL.',
  moreInfoUrl:
    'https://docs.bachs.io/guides/customer-portal/create-portal-session',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    customerId: {
      type: 'string',
      required: true,
      description: 'The Bachs customer ID.'
    }
  },
  exits: {
    success: {
      description: 'The fresh customer portal URL.',
      outputVariableName: 'portalUrl',
      outputType: 'string'
    },
    couldNotCreatePortalUrl: {
      description: 'Customer portal URL could not be created.',
      outputVariableName: 'errors',
      outputType: 'ref'
    }
  },
  fn: async function ({ apiKey, baseUrl, customerId }, exits) {
    const adapterConfig = require('../../adapter').config

    try {
      const portalSession = await fetch(
        `/customers/${encodeURIComponent(customerId)}/portal-sessions`,
        {
          method: 'POST',
          apiKey: apiKey || adapterConfig.apiKey,
          baseUrl: baseUrl || adapterConfig.baseUrl
        }
      )

      if (
        !portalSession ||
        typeof portalSession.url !== 'string' ||
        portalSession.url.length === 0
      ) {
        return exits.couldNotCreatePortalUrl(portalSession)
      }

      return exits.success(portalSession.url)
    } catch (error) {
      return exits.couldNotCreatePortalUrl(error.bachs || error)
    }
  }
})
