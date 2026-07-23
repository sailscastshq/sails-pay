const methods = require('./machines')

module.exports = {
  identity: 'sails-bachs',
  config: {},
  checkout: methods.checkout,
  customer: {
    portal: methods.customer.portal
  },
  verify: methods.verify,
  webhooks: {
    verify: methods.webhooks.verify
  },
  refund: {
    create: methods.refund.create
  }
}
