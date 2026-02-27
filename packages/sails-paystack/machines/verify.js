const fetch = require('../helpers/fetch')
module.exports = require('machine').build({
  friendlyName: 'Verify transaction',
  description: 'Verifies the status of a Paystack transaction by its reference',
  moreInfoUrl: 'https://paystack.com/docs/api/transaction/#verify',
  inputs: {
    secretKey: require('../helpers/parameters').PAYSTACK_SECRET_KEY,
    reference: {
      type: 'string',
      required: true,
      description: 'The transaction reference used to initiate the transaction.'
    }
  },
  exits: {
    success: {
      description: 'Transaction verified successfully.',
      outputVariableName: 'transaction',
      outputType: 'ref'
    },
    couldNotVerifyTransaction: {
      description: 'Transaction could not be verified.',
      extendedDescription:
        'This indicates that an error was encountered while verifying the transaction.',
      outputFriendlyName: 'Verify transaction error report.',
      outputVariableName: 'errors'
    }
  },
  fn: async function ({ secretKey, reference }, exits) {
    const adapterConfig = require('../adapter').config
    const result = await fetch(
      `/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${secretKey || adapterConfig.secretKey}`
        }
      }
    )
    if (!result.status) {
      return exits.couldNotVerifyTransaction(result)
    }

    return exits.success(result.data)
  }
})
