const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
const { toPayout } = require('../../../helpers/connect')

module.exports = require('machine').build({
  friendlyName: 'Create connected account payout',
  description:
    "Withdraws from a connected account's balance to one of its payout destinations, defaulting to the account's default destination for the currency.",
  moreInfoUrl: 'https://docs.bachs.io/connect/payouts',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    account: {
      type: 'string',
      required: true,
      description: 'The connected account withdrawing.'
    },
    amount: {
      type: 'string',
      required: true,
      description: 'Decimal amount the destination should receive.'
    },
    currency: {
      type: 'string',
      description:
        'ISO 4217 currency. Required when destination is omitted, so the default destination can be found.'
    },
    destination: {
      type: 'string',
      description: 'A payout destination ID. Omit to use the default one.'
    },
    reference: {
      type: 'string',
      maxLength: 128,
      description: 'Your reference for the payout.'
    },
    idempotencyKey: {
      type: 'string',
      description: 'Prevents a retry from paying out twice.'
    }
  },
  exits: {
    success: {
      description: 'The payout accepted for delivery.',
      outputVariableName: 'payout',
      outputType: 'ref'
    },
    noDestination: {
      description:
        'No destination was given and the account has no usable destination for the currency.',
      outputVariableName: 'error',
      outputType: 'ref'
    },
    couldNotCreatePayout: {
      description: 'The payout could not be created.',
      outputVariableName: 'error',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config
    const request = {
      apiKey: inputs.apiKey || adapterConfig.apiKey,
      baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
      headers: { 'X-Account-Id': inputs.account }
    }

    let destination = inputs.destination
    if (!destination) {
      if (!inputs.currency) {
        return exits.noDestination({
          message: 'Pass a destination, or a currency to use the default one.'
        })
      }

      try {
        const { destinations = [] } = await fetch(
          `/payouts/destinations?currency=${encodeURIComponent(
            inputs.currency
          )}`,
          { method: 'GET', ...request }
        )
        const usable = destinations.filter((candidate) => candidate.is_usable)
        const chosen =
          usable.find((candidate) => candidate.is_default) || usable[0]
        if (!chosen) {
          return exits.noDestination({
            message: `The account has no usable ${inputs.currency} payout destination.`
          })
        }
        destination = chosen.id
      } catch (error) {
        return exits.couldNotCreatePayout(error.bachs || error)
      }
    }

    try {
      const payout = await fetch('/payouts', {
        method: 'POST',
        ...request,
        idempotencyKey: inputs.idempotencyKey || inputs.reference,
        body: {
          destination,
          amount: inputs.amount,
          ...(inputs.reference && { reference: inputs.reference })
        }
      })

      return exits.success(toPayout(payout, { account: inputs.account }))
    } catch (error) {
      return exits.couldNotCreatePayout(error.bachs || error)
    }
  }
})
