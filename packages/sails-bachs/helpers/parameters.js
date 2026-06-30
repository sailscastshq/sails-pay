/**
 * Common input definitions shared by the Bachs machines.
 *
 * @type {Dictionary}
 * @constant
 */

module.exports = {
  BACHS_API_KEY: {
    type: 'string',
    friendlyName: 'API Key',
    description: 'A valid Bachs secret API key.',
    protect: true,
    whereToGet: {
      url: 'https://bachs.io',
      description: 'Generate a secret key in your Bachs dashboard.'
    }
  },
  BACHS_BASE_URL: {
    type: 'string',
    friendlyName: 'Base URL',
    description:
      'Optional Bachs API base URL. Defaults from the API key environment.'
  },
  BACHS_WEBHOOK_SECRET: {
    type: 'string',
    friendlyName: 'Webhook Secret',
    description: 'The signing secret for your Bachs webhook destination.',
    protect: true
  },
  BACHS_RETURN_URL: {
    type: 'string',
    friendlyName: 'Return URL',
    description:
      'Default URL Bachs redirects to after checkout-session payment.'
  },
  BACHS_SUCCESS_URL: {
    type: 'string',
    friendlyName: 'Success URL',
    description: 'Default URL Bachs redirects to after pure checkout payment.'
  },
  BACHS_CANCEL_URL: {
    type: 'string',
    friendlyName: 'Cancel URL',
    description: 'Default URL Bachs redirects to when checkout is cancelled.'
  }
}
