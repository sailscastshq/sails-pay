module.exports = {
  friendlyName: 'Checkout',

  description: 'Checkout pay.',

  inputs: {},

  exits: {},

  fn: async function (inputs) {
    // All done.
    sails.helpers.pay.checkout.with({})
    sails.helpers.pay.charge.with({})
    sails.helpers.pay.charge.with({ provider: 'lemonsqueezy' })
    return
  }
}
