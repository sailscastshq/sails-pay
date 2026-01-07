const methods = require('./machines')
module.exports = {
  identity: 'sails-paga',
  config: {},
  checkout: methods.checkout
}
