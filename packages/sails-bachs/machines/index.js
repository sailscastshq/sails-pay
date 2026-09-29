const checkout = require('./checkout')

checkout.get = require('./checkout/get')

module.exports = {
  checkout,
  connect: {
    bank: {
      list: require('./connect/bank/list'),
      resolve: require('./connect/bank/resolve')
    },
    destination: {
      list: require('./connect/destination/list'),
      get: require('./connect/destination/get'),
      create: require('./connect/destination/create'),
      update: require('./connect/destination/update')
    },
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
      create: require('./connect/payout/create'),
      quote: require('./connect/payout/quote')
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
