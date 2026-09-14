const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
const { toAccount } = require('../../../helpers/connect')

module.exports = require('machine').build({
  friendlyName: 'Create connected account',
  description:
    'Creates a recipient account with its own balance that the platform can transfer to and that can withdraw.',
  moreInfoUrl: 'https://docs.bachs.io/connect/guides/create-an-account',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    email: {
      type: 'string',
      required: true,
      isEmail: true,
      description: 'Contact email of the person or business being onboarded.'
    },
    name: {
      type: 'string',
      description: 'Display name for the account.'
    },
    country: {
      type: 'string',
      defaultsTo: 'NG',
      description: 'ISO 3166-1 alpha-2 country of the account.'
    },
    capabilities: {
      type: ['string'],
      defaultsTo: ['transfers', 'payouts'],
      description: 'Capabilities to request, e.g. ["transfers", "payouts"].'
    },
    idempotencyKey: {
      type: 'string',
      description: 'Prevents a retry from creating a duplicate account.'
    }
  },
  exits: {
    success: {
      description: 'The created account.',
      outputVariableName: 'account',
      outputType: 'ref'
    },
    couldNotCreateAccount: {
      description: 'The account could not be created.',
      outputVariableName: 'error',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config
    const capabilities = {}
    for (const capability of inputs.capabilities) {
      capabilities[capability] = { requested: true }
    }

    try {
      const account = await fetch('/accounts', {
        method: 'POST',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        idempotencyKey: inputs.idempotencyKey,
        body: {
          contact_email: inputs.email,
          ...(inputs.name && { display_name: inputs.name }),
          country: inputs.country,
          entity_type: 'individual',
          configuration: { recipient: { capabilities } }
        }
      })

      return exits.success(toAccount(account, { email: inputs.email }))
    } catch (error) {
      return exits.couldNotCreateAccount(error.bachs || error)
    }
  }
})
