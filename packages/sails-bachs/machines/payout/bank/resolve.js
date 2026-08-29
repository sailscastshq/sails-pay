const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Resolve payout bank account',
  description: 'Resolves an NGN bank account name before destination creation.',
  moreInfoUrl:
    'https://docs.bachs.io/api-reference/payouts/resolve-bank-account',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    accountNumber: { type: 'string', required: true },
    bankCode: { type: 'string', required: true },
    currency: { type: 'string', defaultsTo: 'NGN' },
    accountId: { type: 'string' }
  },
  exits: {
    success: { outputVariableName: 'account', outputType: 'ref' },
    couldNotResolveBankAccount: {
      outputVariableName: 'error',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config

    try {
      const account = await fetch('/payouts/banks/resolve', {
        method: 'POST',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        headers: inputs.accountId
          ? { 'X-Account-Id': inputs.accountId }
          : undefined,
        body: {
          account_number: inputs.accountNumber,
          bank_code: inputs.bankCode,
          currency: inputs.currency
        }
      })
      return exits.success(account)
    } catch (error) {
      return exits.couldNotResolveBankAccount(error.bachs || error)
    }
  }
})
