const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
const { toTransfer } = require('../../../helpers/connect')

module.exports = require('machine').build({
  friendlyName: 'Create transfer',
  description:
    "Moves funds from the platform balance into a connected account's balance.",
  moreInfoUrl: 'https://docs.bachs.io/connect/transfers',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    account: {
      type: 'string',
      required: true,
      description: 'The connected account receiving the funds.'
    },
    amount: {
      type: 'string',
      required: true,
      description: 'Decimal amount, e.g. "10000.00".'
    },
    currency: {
      type: 'string',
      required: true,
      description: 'ISO 4217 currency, e.g. "NGN".'
    },
    group: {
      type: 'string',
      description: 'Groups related transfers, e.g. one payrun.'
    },
    idempotencyKey: {
      type: 'string',
      description: 'Prevents a retry from transferring twice.'
    }
  },
  exits: {
    success: {
      description: 'The created transfer.',
      outputVariableName: 'transfer',
      outputType: 'ref'
    },
    couldNotCreateTransfer: {
      description: 'The transfer could not be created.',
      outputVariableName: 'error',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config

    try {
      const transfer = await fetch('/transfers', {
        method: 'POST',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        idempotencyKey: inputs.idempotencyKey,
        body: {
          destination: inputs.account,
          amount: inputs.amount,
          currency: inputs.currency,
          ...(inputs.group && { transfer_group: inputs.group })
        }
      })

      return exits.success(toTransfer(transfer))
    } catch (error) {
      return exits.couldNotCreateTransfer(error.bachs || error)
    }
  }
})
