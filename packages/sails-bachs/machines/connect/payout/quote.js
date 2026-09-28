const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')
const { toPayoutQuote } = require('../../../helpers/connect')

module.exports = require('machine').build({
  friendlyName: 'Quote connected account payout',
  description:
    "Quotes a payout from one currency in a connected account's balance to another.",
  moreInfoUrl:
    'https://docs.bachs.io/api-reference/payouts/create-payout-quote',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    account: {
      type: 'string',
      required: true,
      description: 'The connected account whose balance will be debited.'
    },
    fromCurrency: { type: 'string', required: true },
    toCurrency: { type: 'string', required: true },
    amount: {
      type: 'string',
      required: true,
      description: 'Decimal amount in the source currency to quote.'
    }
  },
  exits: {
    success: { outputType: 'ref' },
    couldNotCreateQuote: { outputType: 'ref' }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config
    try {
      const quote = await fetch('/payouts/quotes', {
        method: 'POST',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        headers: { 'X-Account-Id': inputs.account },
        body: {
          from_currency: inputs.fromCurrency,
          to_currency: inputs.toCurrency,
          amount: inputs.amount
        }
      })
      return exits.success(toPayoutQuote(quote))
    } catch (error) {
      return exits.couldNotCreateQuote(error.bachs || error)
    }
  }
})
