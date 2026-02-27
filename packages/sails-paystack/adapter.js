const methods = require('./machines')
module.exports = {
  identity: 'sails-paystack',
  config: {},
  checkout: methods.checkout,
  verify: methods.verify
}
