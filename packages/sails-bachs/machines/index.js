const checkout = require('./checkout')

checkout.get = require('./checkout/get')

module.exports = {
  checkout,
  verify: require('./verify'),
  webhooks: {
    verify: require('./webhooks/verify')
  },
  refund: {
    create: require('./refund/create')
  }
}
