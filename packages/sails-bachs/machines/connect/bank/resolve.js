const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
module.exports = require('machine').build({
  friendlyName: 'Resolve bank',
  description:
    'Bank reference data and resolution supplied by the provider, not by the application.',
  moreInfoUrl:
    'https://docs.bachs.io/api-reference/misc/resolve-a-bank-account',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    country: { type: 'string', required: true, minLength: 2, maxLength: 2 },
    bankCode: { type: 'string', required: true },
    accountNumber: { type: 'string', required: true }
  },
  exits: {
    success: { outputType: 'ref' },
    couldNotResolveBank: {
      outputType: 'ref',
      description: 'Bank request failed.'
    }
  },
  fn: async function (inputs, exits) {
    const config = require('../../../adapter').config
    try {
      const response = await fetch('/misc/bank-accounts/resolve', {
        method: 'POST',
        apiKey: inputs.apiKey || config.apiKey,
        baseUrl: inputs.baseUrl || config.baseUrl,
        body: {
          country: inputs.country.toUpperCase(),
          bank_code: inputs.bankCode,
          account_number: inputs.accountNumber
        }
      })
      return exits.success({
        resolved: response.resolved === true,
        accountName:
          response.resolved === true ? response.account_name || null : null,
        accountNumber:
          response.resolved === true ? response.account_number || null : null,
        message: response.message || null
      })
    } catch (error) {
      return exits.couldNotResolveBank(error.bachs || error)
    }
  }
})
