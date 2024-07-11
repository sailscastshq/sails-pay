/**
 * Common input definitions (i.e. parameter definitions) that are shared by multiple files.
 *
 * @type {Dictionary}
 * @constant
 */

module.exports = {
  PAYSTACK_API_KEY: {
    type: 'string',
    friendlyName: 'API Key',
    description: 'A valid Paystack API Key',
    protect: true,
    whereToGet: {
      url: 'https://dashboard.paystack.com/#/settings/developers',
      description: 'Generate an API key in your Paystack dashboard.',
      extendedDescription:
        'To generate an API key, you will first need to log in to your Paystack account, or sign up for one if you have not already done so.'
    }
  }
}
