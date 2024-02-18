/**
 * Common input definitions (i.e. parameter definitions) that are shared by multiple files.
 *
 * @type {Dictionary}
 * @constant
 */

module.exports = {
  LEMON_SQUEEZY_API_KEY: {
    type: 'string',
    friendlyName: 'API Key',
    description: 'A valid Lemon Squeezy API Key',
    protect: true,
    whereToGet: {
      url: 'https://app.lemonsqueezy.com/settings/api',
      description: 'Generate an API key in your Lemon Squeezy dashboard.',
      extendedDescription:
        'To generate an API key, you will first need to log in to your Lemon Squeezy account, or sign up for one if you have not already done so.'
    }
  },
  LEMON_SQUEEZY_STORE_ID: {
    type: 'string',
    friendlyName: 'Store ID',
    description: 'A valid Lemon Squeezy store ID',
    whereToGet: {
      url: 'https://app.lemonsqueezy.com/settings/stores',
      description: 'The ID is the number next to the store name.',
      extendedDescription:
        'To find your Lemon Squeezy Store ID, visit your Stores page in the Lemon Squeezy dashboard.'
    }
  }
}
