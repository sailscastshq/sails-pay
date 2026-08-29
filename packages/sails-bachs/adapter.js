const methods = require('./machines')

module.exports = {
  identity: 'sails-bachs',
  config: {},
  checkout: methods.checkout,
  account: methods.account,
  transfer: methods.transfer,
  payout: methods.payout,
  balance: methods.balance,
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
