const fetch = require('../../../helpers/fetch')
const parameters = require('../../../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Create payout destination',
  description:
    'Registers a bank account or wallet as a Bachs payout destination.',
  moreInfoUrl:
    'https://docs.bachs.io/api-reference/payouts/create-payout-destination',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    currency: { type: 'string', required: true },
    name: { type: 'string' },
    type: {
      type: 'string',
      required: true,
      isIn: ['bank_account', 'mobile_money', 'crypto_wallet']
    },
    accountNumber: { type: 'string' },
    bankCode: { type: 'string' },
    phoneNumber: { type: 'string' },
    mobileProvider: { type: 'string' },
    walletAddress: { type: 'string' },
    network: { type: 'string' },
    metadata: { type: 'ref' },
    idempotencyKey: { type: 'string' },
    accountId: {
      type: 'string',
      description: 'Optional connected Bachs account to act on behalf of.'
    }
  },
  exits: {
    success: { outputVariableName: 'destination', outputType: 'ref' },
    couldNotCreateDestination: {
      outputVariableName: 'error',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../../../adapter').config
    const optionalFields = {
      name: inputs.name,
      type: inputs.type,
      account_number: inputs.accountNumber,
      bank_code: inputs.bankCode,
      phone_number: inputs.phoneNumber,
      mobile_provider: inputs.mobileProvider,
      wallet_address: inputs.walletAddress,
      network: inputs.network,
      metadata: inputs.metadata
    }
    const body = { currency: inputs.currency }
    for (const [key, value] of Object.entries(optionalFields)) {
      if (value !== undefined) body[key] = value
    }

    try {
      const destination = await fetch('/payouts/destinations', {
        method: 'POST',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        idempotencyKey: inputs.idempotencyKey,
        headers: inputs.accountId
          ? { 'X-Account-Id': inputs.accountId }
          : undefined,
        body
      })
      return exits.success(destination)
    } catch (error) {
      return exits.couldNotCreateDestination(error.bachs || error)
    }
  }
})
