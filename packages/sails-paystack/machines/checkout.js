const fetch = require('../helpers/fetch')
module.exports = require('machine').build({
  friendlyName: 'Checkout',
  description: 'Creates and return a checkout authorization URL',
  moreInfoUrl: 'https://paystack.com/docs/api/transaction/#initialize',
  inputs: {
    apiKey: require('../helpers/parameters').PAYSTACK_API_KEY,
    amount: {
      type: 'number',
      description: 'Amount should be in the subunit of the supported currency'
    },
    email: {
      type: 'string',
      description: "Customer's email address"
    },
    currency: {
      type: 'string',
      description:
        'The transaction currency. Defaults to your integration currency.'
    },
    reference: {
      type: 'string',
      description:
        'Unique transaction reference. Only alphanumeric characters, hyphens (-), periods (.), and equal signs (=) are allowed.'
    },
    callbackUrl: {
      type: 'string',
      description:
        'Fully qualified url, e.g. https://example.com. Use this to override the callback url provided on the dashboard for this transaction'
    },
    plan: {
      type: 'string',
      description:
        'If transaction is to create a subscription to a predefined plan, provide plan code here. This would invalidate the value provided in amount'
    },
    invoiceLimit: {
      type: 'number',
      description:
        'Number of times to charge customer during subscription to plan'
    },
    metadata: {
      type: 'string',
      description: 'Stringified JSON object of custom data.',
      moreInfoUrl: 'https://paystack.com/docs/payments/metadata/'
    },
    channels: {
      type: 'ref',
      description:
        'An array of payment channels to control what channels you want to make available to the user to make a payment with.',
      extendedDescription:
        'Available channels include: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer", "eft"]'
    },
    splitCode: {
      type: 'string',
      description: 'The split code of the transaction split.'
    },
    subaccount: {
      type: 'string',
      description: 'The code for the subaccount that owns the payment.'
    },
    transactionCharge: {
      type: 'number',
      description:
        'An amount used to override the split configuration for a single split payment.',
      extendedDescription:
        'If set, the amount specified goes to the main account regardless of the split configuration.'
    },
    bearer: {
      type: 'string',
      description:
        'Use this param to indicate who bears the transaction charges',
      extendedDescription:
        'Allowed values are: account or subaccount (defaults to account).'
    }
  },
  exits: {
    success: {
      description: 'The checkout url.',
      outputVariableName: 'checkoutUrl',
      outputType: 'string'
    },
    couldNotCreateCheckoutUrl: {
      description: 'Checkout URL could not be created.',
      extendedDescription:
        'This indicates that an error was encountered during checkout url creation.',
      outputFriendlyName: 'Create checkout URL error report.',
      outputVariableName: 'errors'
    }
  },
  fn: async function (
    {
      apiKey,
      amount,
      email,
      currency,
      reference,
      callbackUrl,
      plan,
      invoiceLimit,
      metadata,
      channels,
      splitCode,
      subaccount,
      transactionCharge,
      bearer
    },
    exits
  ) {
    const adapterConfig = require('../adapter').config
    const payload = JSON.stringify({
      amount,
      email,
      currency,
      reference,
      callback_url: callbackUrl,
      plan,
      invoice_limit: invoiceLimit,
      metadata,
      channels,
      split_code: splitCode,
      subaccount,
      transaction_charge: transactionCharge,
      bearer
    })
    const checkout = await fetch('/transaction/initialize', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey || adapterConfig.apiKey}`
      },
      body: payload
    })
    if (!checkout.status) {
      const errors = checkout
      return exits.couldNotCreateCheckoutUrl(errors)
    }

    const checkoutUrl = checkout.data.authorization_url
    return exits.success(checkoutUrl)
  }
})
