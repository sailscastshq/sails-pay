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
      description: 'URL to redirect the customer after payment completion.',
      extendedDescription:
        'Paga will append query params: charge_reference (your payment_reference or Paga-generated), status_message ("success"), and status_code ("0" for success). Example redirect: https://yoursite.com/store?charge_reference=REF123&status_message=success&status_code=0'
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

    // Use provided callbackUrl or fall back to configured default
    const resolvedCallbackUrl = callbackUrl || adapterConfig.callbackUrl

    // Warn if localhost URLs are detected
    if (
      chargeUrl?.includes('localhost') ||
      resolvedCallbackUrl?.includes('localhost')
    ) {
      console.warn(
        '[sails-paga] Warning: localhost URLs will not work with Paga. Use a tunneling service like ngrok or localtunnel for local development.'
      )
    }

    // Build query parameters manually to avoid double-encoding of URLs
    const params = []
    params.push(
      `public_key=${encodeURIComponent(publicKey || adapterConfig.publicKey)}`
    )
    params.push(`amount=${encodeURIComponent(amount)}`)
    params.push(`email=${encodeURIComponent(email)}`)

    if (currency) params.push(`currency=${encodeURIComponent(currency)}`)
    if (paymentReference)
      params.push(`payment_reference=${encodeURIComponent(paymentReference)}`)
    if (chargeUrl) params.push(`charge_url=${encodeURIComponent(chargeUrl)}`)
    if (phoneNumber)
      params.push(`phone_number=${encodeURIComponent(phoneNumber)}`)
    if (displayImage)
      params.push(`display_image=${encodeURIComponent(displayImage)}`)
    if (resolvedCallbackUrl)
      params.push(`callback_url=${encodeURIComponent(resolvedCallbackUrl)}`)
    if (fundingSources)
      params.push(`funding_sources=${encodeURIComponent(fundingSources)}`)

    const checkoutUrl = `${baseUrl}?${params.join('&')}`
    return exits.success(checkoutUrl)
  }
})
