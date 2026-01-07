/**
 * pay hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */

module.exports = function (sails) {
  function extractProviderName(fullName) {
    const parts = fullName.split('/')
    return parts[parts.length - 1]
  }

  /**
   * Get default environment variables for each provider.
   * These are used as fallbacks when config values are not provided.
   */
  function getEnvDefaults(providerName) {
    switch (providerName) {
      case 'lemonsqueezy':
        return {
          apiKey: process.env.LEMON_SQUEEZY_API_KEY,
          store: process.env.LEMON_SQUEEZY_STORE,
          redirectUrl: process.env.LEMON_SQUEEZY_REDIRECT_URL,
          signingSecret: process.env.LEMON_SQUEEZY_SIGNING_SECRET
        }
      case 'paystack':
        return {
          apiKey: process.env.PAYSTACK_SECRET_KEY
        }
      case 'paga':
        return {
          publicKey: process.env.PAGA_PUBLIC_KEY,
          secretKey: process.env.PAGA_SECRET_KEY,
          callbackUrl: process.env.PAGA_CALLBACK_URL
        }
      case 'flutterwave':
        return {
          clientId: process.env.FLUTTERWAVE_CLIENT_ID,
          clientSecret: process.env.FLUTTERWAVE_SECRET,
          encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY
        }
      default:
        return {}
    }
  }

  return {
    defaults: {
      pay: {
        provider: 'default',
        providers: {}
      }
    },
    /**
     * Runs when this Sails app loads/lifts.
     */
    initialize: async function () {
      function getPaymentProvider(provider) {
        if (!sails.config.pay.providers[provider]) {
          throw new Error('The provided payment provider coult not be found.')
        }
        const providerConfig = sails.config.pay.providers[provider]
        const providerName = extractProviderName(providerConfig.adapter)
        const envDefaults = getEnvDefaults(providerName)

        switch (providerName) {
          case 'lemonsqueezy':
          case 'paystack':
          case 'paga':
          case 'flutterwave':
            const paymentProvider = require(providerConfig.adapter)
            // Merge env defaults with config (config takes precedence)
            paymentProvider.config = { ...envDefaults, ...providerConfig }
            return paymentProvider
          default:
            throw new Error(
              'Invalid payment provider provided, supported providers are lemonsqueezy, paystack, paga, and flutterwave.'
            )
        }
      }

      sails.hooks.pay.paymentProvider = getPaymentProvider(
        sails.config.pay.provider
      )
      sails.hooks.pay.paymentProvider.provider = function (provider) {
        return getPaymentProvider(provider)
      }

      sails.pay = sails.hooks.pay.paymentProvider

      sails.log.info('Initializing custom hook (`pay`)')
    }
  }
}
