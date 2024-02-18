const fetch = require('../helpers/fetch')
const generateJsonApiPayload = require('../helpers/generate-json-api-payload')
module.exports = require('machine').build({
  friendlyName: 'Checkout',
  description:
    'Creates and return a unique checkout URL for a specific variant.',
  moreInfoUrl: 'https://docs.lemonsqueezy.com/api/checkouts',
  inputs: {
    apiKey: require('../helpers/parameters').LEMON_SQUEEZY_API_KEY,
    store: require('../helpers/parameters').LEMON_SQUEEZY_STORE_ID,
    variant: {
      type: 'string',
      description: 'The ID of the variant associated with this checkout.'
    },
    customPrice: {
      type: 'number',
      description:
        'Represents a positive integer in cents representing the custom price of the variant.'
    },
    productOptions: {
      type: 'ref',
      description:
        'An object containing any overridden product options for this checkout. ',
      example: {
        name: '',
        description: '',
        media: [],
        redirect_url: '',
        receipt_button_text: '',
        receipt_link_url: '',
        receipt_thank_you_note: '',
        enabled_variants: [1]
      }
    },
    checkoutOptions: {
      type: 'ref',
      description: 'An object containing checkout options for this checkout.',
      example: {
        embed: false,
        media: true,
        logo: true,
        desc: true,
        discount: true,
        dark: false,
        subscription_preview: true,
        button_color: '#2DD272'
      }
    },
    checkoutData: {
      type: 'ref',
      description:
        'An object containing any prefill or custom data to be used in the checkout.',
      example: {
        email: '',
        name: '',
        billing_address: [],
        tax_number: '',
        discount_code: '',
        custom: [],
        variant_quantities: []
      }
    },
    preview: {
      type: 'boolean',
      description:
        'A boolean indicating whether to return a preview of the checkout. If true, the checkout will include a preview object with the checkout preview data.',
      example: true
    },
    testMode: {
      type: 'boolean',
      description:
        'A boolean indicating whether the checkout should be created in test mode.',
      example: false
    },
    expiresAt: {
      type: 'string',
      description:
        'An ISO 8601 formatted date-time string indicating when the checkout expires. Can be null if the checkout is perpetual.',
      example: '2022-10-30T15:20:06.000000Z'
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
      outputVariableName: 'errors',
      outputType: [
        {
          detail:
            'The POST method is not supported for route checkouts. Supported methods: GET, HEAD.',
          status: '405',
          title: 'Method Not Allowed'
        }
      ]
    }
  },

  fn: async function (
    {
      apiKey,
      store,
      variant,
      customPrice,
      productOptions,
      checkoutOptions,
      checkoutData,
      preview,
      testMode,
      expiresAt
    },
    exits
  ) {
    const adapterConfig = require('../adapter').config
    const payload = generateJsonApiPayload(
      'checkouts',
      {
        custom_price: customPrice || null,
        product_options: {
          redirect_url: adapterConfig.redirectUrl || null,
          ...productOptions
        },
        checkout_options: checkoutOptions,
        checkout_data: checkoutData,
        preview,
        test_mode: testMode,
        expires_at: expiresAt || null
      },
      {
        store: {
          data: {
            type: 'stores',
            id: store || adapterConfig.store
          }
        },
        variant: {
          data: {
            type: 'variants',
            id: variant
          }
        }
      }
    )

    const checkout = await fetch('/checkouts', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey || adapterConfig.apiKey}`
      },
      body: payload
    })
    if (checkout.errors) {
      const errors = checkout.errors
      return exits.couldNotCreateCheckoutUrl(errors)
    }

    const checkoutUrl = checkout.data.attributes.url
    return exits.success(checkoutUrl)
  }
})
