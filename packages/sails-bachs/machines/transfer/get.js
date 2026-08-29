const fetch = require('../../helpers/fetch')
const parameters = require('../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Get transfer',
  description: 'Retrieves the current state of a Bachs Connect transfer.',
  moreInfoUrl: 'https://docs.bachs.io/connect/transfers',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    transferId: { type: 'string', required: true }
  },
  exits: {
    success: { outputVariableName: 'transfer', outputType: 'ref' },
    couldNotGetTransfer: { outputVariableName: 'error', outputType: 'ref' }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../adapter').config
    try {
      const transfer = await fetch(
        `/transfers/${encodeURIComponent(inputs.transferId)}`,
        {
          method: 'GET',
          apiKey: inputs.apiKey || adapterConfig.apiKey,
          baseUrl: inputs.baseUrl || adapterConfig.baseUrl
        }
      )
      return exits.success(transfer)
    } catch (error) {
      return exits.couldNotGetTransfer(error.bachs || error)
    }
  }
})
