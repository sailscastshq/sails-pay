/**
 * Common input definitions (i.e. parameter definitions) that are shared by multiple files.
 *
 * @type {Dictionary}
 * @constant
 */

module.exports = {
  PAYSTACK_SECRET_KEY: {
    type: 'string',
    friendlyName: 'Secret Key',
    description: 'A valid Paystack Secret Key',
    protect: true,
    whereToGet: {
      url: 'https://dashboard.paystack.com/#/settings/developers',
      description: 'Generate a secret key in your Paystack dashboard.',
      extendedDescription:
        'To generate a secret key, you will first need to log in to your Paystack account, or sign up for one if you have not already done so.'
    }
  },
  PAYSTACK_PUBLIC_KEY: {
    type: 'string',
    friendlyName: 'Public Key',
    description: 'A valid Paystack Public Key',
    whereToGet: {
      url: 'https://dashboard.paystack.com/#/settings/developers',
      description: 'Get your public key from your Paystack dashboard.',
      extendedDescription:
        'To get your public key, you will first need to log in to your Paystack account, or sign up for one if you have not already done so.'
    }
  },
  PAYSTACK_CALLBACK_URL: {
    type: 'string',
    friendlyName: 'Callback URL',
    description: 'The default callback URL for Paystack transactions',
    extendedDescription:
      'This URL will be used as the default callback for all transactions unless overridden per request.'
  }
}
