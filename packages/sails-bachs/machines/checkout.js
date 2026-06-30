const fetch = require('../helpers/fetch')
const {
  buildCheckoutSessionPayload,
  buildPureCheckoutPayload
} = require('../helpers/payloads')
const parameters = require('../helpers/parameters')

module.exports = require('machine').build({
  friendlyName: 'Checkout',
  description:
    'Creates and returns a Bachs hosted checkout URL using products or pricing.',
  moreInfoUrl: 'https://docs.bachs.io/guides/checkout/checkout-sessions',
  inputs: {
    apiKey: parameters.BACHS_API_KEY,
    baseUrl: parameters.BACHS_BASE_URL,
    items: {
      type: 'ref',
      description:
        'Product items for Bachs Checkout Sessions. Each item should use product or productId plus optional quantity and amount.'
    },
    productCollectionId: {
      type: 'string',
      description:
        'Bachs product collection ID for selection-mode checkout sessions.'
    },
    productCollection: {
      type: 'string',
      description:
        'Alias for productCollectionId. Bachs maps this to product_collection_id.'
    },
    billingCurrency: {
      type: 'string',
      description:
        'Currency code used to select a product price row for checkout sessions.'
    },
    allowedPaymentMethodTypes: {
      type: 'ref',
      description: 'Payment method allowlist, e.g. ["bank_transfer", "card"].'
    },
    returnUrl: {
      type: 'string',
      description:
        'URL Bachs redirects to after a checkout-session payment. Maps to return_url.'
    },
    successUrl: {
      type: 'string',
      description:
        'URL Bachs redirects to after a pure checkout payment. Maps to success_url.'
    },
    cancelUrl: parameters.BACHS_CANCEL_URL,
    customer: {
      type: 'ref',
      description:
        'Customer details. Use customerId for existing customers or email/name/phoneNumber for new customers.'
    },
    customerEmail: {
      type: 'string',
      description: "Customer's email address."
    },
    customerName: {
      type: 'string',
      description: "Customer's full name."
    },
    phoneNumber: {
      type: 'string',
      description: "Customer's phone number."
    },
    email: {
      type: 'string',
      description: 'Compatibility alias for customerEmail.'
    },
    name: {
      type: 'string',
      description: 'Compatibility alias for customerName.'
    },
    reference: {
      type: 'string',
      description:
        'Merchant reference for the checkout. Bachs requires this to be unique per organization when supplied.'
    },
    metadata: {
      type: 'ref',
      description: 'Metadata returned in Bachs webhook payloads.'
    },
    checkoutData: {
      type: 'ref',
      description:
        'Compatibility shape for checkoutData.email, checkoutData.name, and checkoutData.custom.'
    },
    idempotencyKey: {
      type: 'string',
      description:
        'Optional Idempotency-Key header. Defaults to reference when available.'
    },
    pricing: {
      type: 'ref',
      description: 'Pure Checkout pricing object.'
    },
    amount: {
      type: 'string',
      description: 'Pure Checkout amount, e.g. "50.00".'
    },
    currency: {
      type: 'string',
      description: 'Pure Checkout currency, e.g. "USD" or "NGN".'
    },
    currencyOptions: {
      type: 'ref',
      description: 'Pure Checkout per-currency amount overrides.'
    },
    expiresInMinutes: {
      type: 'number',
      description: 'Pure Checkout expiry in minutes.'
    },
    simulatedOutcome: {
      type: 'string',
      description: 'Sandbox-only forced outcome.'
    }
  },
  exits: {
    success: {
      description: 'The hosted checkout URL.',
      outputVariableName: 'checkoutUrl',
      outputType: 'string'
    },
    invalidRequest: {
      description: 'The Bachs checkout request is missing required input.',
      outputVariableName: 'errors',
      outputType: 'ref'
    },
    couldNotCreateCheckoutUrl: {
      description: 'Checkout URL could not be created.',
      outputVariableName: 'errors',
      outputType: 'ref'
    }
  },
  fn: async function (inputs, exits) {
    const adapterConfig = require('../adapter').config
    const hasItems = Array.isArray(inputs.items) && inputs.items.length > 0
    const hasProductCollection = Boolean(
      inputs.productCollectionId || inputs.productCollection
    )
    const shouldUseCheckoutSession = hasItems || hasProductCollection
    const path = shouldUseCheckoutSession ? '/checkout-sessions' : '/checkouts'
    const payload = shouldUseCheckoutSession
      ? buildCheckoutSessionPayload(inputs, adapterConfig)
      : buildPureCheckoutPayload(inputs, adapterConfig)

    if (shouldUseCheckoutSession && hasItems === hasProductCollection) {
      return exits.invalidRequest({
        message:
          'Provide exactly one of items or productCollectionId for a Bachs checkout session.'
      })
    }

    if (!shouldUseCheckoutSession && !payload.pricing) {
      return exits.invalidRequest({
        message:
          'Provide product items/productCollectionId or pure checkout pricing.'
      })
    }

    try {
      const checkout = await fetch(path, {
        method: 'POST',
        apiKey: inputs.apiKey || adapterConfig.apiKey,
        baseUrl: inputs.baseUrl || adapterConfig.baseUrl,
        idempotencyKey: inputs.idempotencyKey || inputs.reference,
        body: payload
      })

      if (!checkout || !checkout.checkout_url) {
        return exits.couldNotCreateCheckoutUrl(checkout)
      }

      return exits.success(checkout.checkout_url)
    } catch (error) {
      return exits.couldNotCreateCheckoutUrl(error.bachs || error)
    }
  }
})
