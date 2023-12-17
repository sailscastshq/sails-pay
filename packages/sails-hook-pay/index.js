/**
 * pay hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */

module.exports = function (sails) {
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
      sails.log.info('Initializing custom hook (`pay`)')
    }
  }
}
