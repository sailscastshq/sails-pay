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
        const providerName = extractProviderName(
          sails.config.pay.providers[provider].adapter
        )
        switch (providerName) {
          case 'lemonsqueezy':
          case 'paystack':
            const paymentProvider = require(
              sails.config.pay.providers[provider].adapter
            )
            paymentProvider.config = sails.config.pay.providers[provider]
            return paymentProvider
          default:
            throw new Error(
              'Invalid payment provider provided, supported providers are lemonsqueezy and paystack.'
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
