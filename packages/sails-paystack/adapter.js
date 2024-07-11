const methods = require('./machines')
module.exports = {
  identity: 'sails-paystack',
  config: {},
  checkout: methods.checkout
}
