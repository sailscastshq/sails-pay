const checkout = require('./checkout')

checkout.get = require('./checkout/get')

module.exports = {
  checkout,
  account: {
    create: require('./account/create'),
    get: require('./account/get'),
    link: {
      create: require('./account/link/create')
    }
  },
  transfer: {
    create: require('./transfer/create'),
    get: require('./transfer/get')
  },
  payout: {
    create: require('./payout/create'),
    get: require('./payout/get'),
    destination: {
      create: require('./payout/destination/create'),
      get: require('./payout/destination/get')
    },
    bank: {
      list: require('./payout/bank/list'),
      resolve: require('./payout/bank/resolve')
    }
  },
  balance: {
    get: require('./balance/get')
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
