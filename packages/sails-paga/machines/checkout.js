module.exports = require('machine').build({
  friendlyName: 'Checkout',
  description: 'Creates and returns a Paga checkout URL',
  moreInfoUrl: 'https://developer-docs.paga.com/docs/checkout-link',
  inputs: {
    publicKey: {
      type: 'string',
      description:
        'Paga public key. Falls back to configured publicKey if not provided.'
    },
    amount: {
      type: 'number',
      required: true,
      description:
        'Amount to charge in the smallest currency unit (kobo for NGN)'
    },
    email: {
      type: 'string',
      required: true,
      description: "Customer's email address"
    },
    currency: {
      type: 'string',
      description: 'Transaction currency. Defaults to NGN.'
    },
    paymentReference: {
      type: 'string',
      description:
        'Unique payment identifier. If not provided, Paga will generate one.'
    },
    chargeUrl: {
      type: 'string',
      description: 'URL to redirect the customer after payment completion'
    },
    phoneNumber: {
      type: 'string',
      description: "Customer's phone number"
    },
    displayImage: {
      type: 'string',
      description: 'Merchant logo URL to display on checkout'
    },
    callbackUrl: {
      type: 'string',
      description: 'Webhook URL to receive payment notifications'
    },
    fundingSources: {
      type: 'string',
      description:
        'Comma-separated list of allowed payment methods. Available options: CARD, PAGA, TRANSFER, AGENT, USSD'
    }
  },
  exits: {
    success: {
      description: 'The checkout URL.',
      outputVariableName: 'checkoutUrl',
      outputType: 'string'
    }
  },
  fn: async function (
    {
      publicKey,
      amount,
      email,
      currency,
      paymentReference,
      chargeUrl,
      phoneNumber,
      displayImage,
      callbackUrl,
      fundingSources
    },
    exits
  ) {
    const adapterConfig = require('../adapter').config

    // Use configured baseUrl, defaulting to live environment
    const baseUrl = adapterConfig.baseUrl || 'https://checkout.paga.com/'

    // Build query parameters
    const params = new URLSearchParams()
    params.append('public_key', publicKey || adapterConfig.publicKey)
    params.append('amount', amount)
    params.append('email', email)

    if (currency) params.append('currency', currency)
    if (paymentReference) params.append('payment_reference', paymentReference)
    if (chargeUrl) params.append('charge_url', chargeUrl)
    if (phoneNumber) params.append('phone_number', phoneNumber)
    if (displayImage) params.append('display_image', displayImage)

    // Use provided callbackUrl or fall back to configured default
    const resolvedCallbackUrl = callbackUrl || adapterConfig.callbackUrl
    if (resolvedCallbackUrl) params.append('callback_url', resolvedCallbackUrl)

    if (fundingSources) params.append('funding_sources', fundingSources)

    const checkoutUrl = `${baseUrl}?${params.toString()}`
    return exits.success(checkoutUrl)
  }
})
