const fetch = require('../../helpers/fetch')
const parameters = require('../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Create connected account',
  description:
    'Creates a recipient-only Bachs Connect account for a seller or contractor.',
  moreInfoUrl: 'https://docs.bachs.io/connect/guides/create-an-account',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    contactEmail: { type: 'string', required: true },
    displayName: { type: 'string' },
    country: { type: 'string', defaultsTo: 'NG' },
    entityType: { type: 'string', defaultsTo: 'individual' },
    capabilities: {
      type: 'ref',
      defaultsTo: { transfers: true, payouts: true }
    },
    idempotencyKey: { type: 'string' }
  },
  exits: {
    success: { outputVariableName: 'account', outputType: 'ref' },
    couldNotCreateAccount: { outputVariableName: 'error', outputType: 'ref' }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../adapter').config
    const requestedCapabilities = {}
    for (const [name, requested] of Object.entries(inputs.capabilities || {})) {
      if (requested === true) {
        requestedCapabilities[name] = { requested: true }
      }
    }

    try {
      const account = await fetch('/accounts', {
        method: 'POST',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        idempotencyKey: inputs.idempotencyKey,
        body: {
          contact_email: inputs.contactEmail,
          ...(inputs.displayName && { display_name: inputs.displayName }),
          country: inputs.country,
          entity_type: inputs.entityType,
          configuration: {
            recipient: { capabilities: requestedCapabilities }
          }
        }
      })
      return exits.success(account)
    } catch (error) {
      return exits.couldNotCreateAccount(error.bachs || error)
    }
  }
})
