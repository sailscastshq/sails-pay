const checkout = require('./checkout')

checkout.get = require('./checkout/get')

module.exports = {
  checkout,
  connect: {
    account: {
      create: require('./connect/account/create'),
      get: require('./connect/account/get'),
      link: require('./connect/account/link')
    },
    transfer: {
      create: require('./connect/transfer/create')
    },
    balance: {
      get: require('./connect/balance/get')
    },
    payout: {
      create: require('./connect/payout/create')
    }
  },
  customer: {
    portal: require('./customer/portal')
  },
  verify: require('./verify'),
  webhooks: {
    verify: require('./webhooks/verify')
  },
  refund: {
    create: require('./refund/create')
  }
}
