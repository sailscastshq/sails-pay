const fetch = require('../../helpers/fetch')
const parameters = require('../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Create transfer',
  description:
    'Moves funds between the platform and one Bachs connected account.',
  moreInfoUrl: 'https://docs.bachs.io/connect/transfers',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    destination: { type: 'string', required: true },
    amount: { type: 'string', required: true },
    currency: { type: 'string', required: true },
    transferGroup: { type: 'string' },
    description: { type: 'string' },
    idempotencyKey: { type: 'string' },
    accountId: {
      type: 'string',
      description:
        'Optional connected account source; omit when paying from the platform.'
    }
  },
  exits: {
    success: { outputVariableName: 'transfer', outputType: 'ref' },
    couldNotCreateTransfer: { outputVariableName: 'error', outputType: 'ref' }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../adapter').config
    try {
      const transfer = await fetch('/transfers', {
        method: 'POST',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        idempotencyKey: inputs.idempotencyKey,
        headers: inputs.accountId
          ? { 'X-Connected-Account-ID': inputs.accountId }
          : undefined,
        body: {
          destination: inputs.destination,
          amount: inputs.amount,
          currency: inputs.currency,
          ...(inputs.transferGroup && {
            transfer_group: inputs.transferGroup
          }),
          ...(inputs.description && { description: inputs.description })
        }
      })
      return exits.success(transfer)
    } catch (error) {
      return exits.couldNotCreateTransfer(error.bachs || error)
    }
  }
})
