const methods = require('./machines')
module.exports = {
  identity: 'sails-lemonsqueezy',
  config: {},
  checkout: methods.checkout,
  subscription: {
    get: methods.subscription.get
  }
}
