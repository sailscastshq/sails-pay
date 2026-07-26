const test = require('node:test')
const assert = require('node:assert/strict')
const {
  buildCheckoutSessionPayload,
  buildPureCheckoutPayload,
  buildRefundPayload,
  buildProductCart,
  normalizePricing
} = require('../helpers/payloads')

test('buildProductCart preserves catalog pricing and optional quantity', () => {
  assert.deepEqual(buildProductCart([{ product: 'prod_catalog' }]), [
    {
      product_id: 'prod_catalog'
    }
  ])

  assert.deepEqual(
    buildProductCart([{ product: 'prod_quantity', quantity: 2 }]),
    [
      {
        product_id: 'prod_quantity',
        quantity: 2
      }
    ]
  )
})

test('buildProductCart normalizes fixed pricing shorthand and explicit pricing', () => {
  const fixedPricing = {
    product_id: 'prod_fixed',
    pricing: {
      price_type: 'fixed',
      amount: '19.00'
    }
  }

  assert.deepEqual(
    buildProductCart([{ product: 'prod_fixed', amount: '19.00' }]),
    [fixedPricing]
  )

  assert.deepEqual(
    buildProductCart([
      {
        product: 'prod_fixed',
        pricing: {
          type: 'fixed',
          amount: '19.00'
        }
      }
    ]),
    [fixedPricing]
  )
})

test('buildProductCart normalizes custom pricing and chosenAmount', () => {
  assert.deepEqual(
    buildProductCart([
      {
        product: 'prod_custom',
        pricing: {
          type: 'custom',
          presetAmount: '10.00',
          minimumAmount: '5.00',
          maximumAmount: '100.00'
        },
        chosenAmount: '12.00'
      }
    ]),
    [
      {
        product_id: 'prod_custom',
        pricing: {
          price_type: 'custom',
          preset_amount: '10.00',
          minimum_amount: '5.00',
          maximum_amount: '100.00'
        },
        amount: '12.00'
      }
    ]
  )
})

test('buildProductCart normalizes free pricing', () => {
  assert.deepEqual(
    buildProductCart([
      {
        product: 'prod_free',
        pricing: {
          type: 'free'
        }
      }
    ]),
    [
      {
        product_id: 'prod_free',
        pricing: {
          price_type: 'free'
        }
      }
    ]
  )
})

test('buildProductCart maps catalog chosenAmount to the flat Bachs amount', () => {
  assert.deepEqual(
    buildProductCart([
      {
        product: 'prod_catalog_custom',
        chosenAmount: '12.00'
      }
    ]),
    [
      {
        product_id: 'prod_catalog_custom',
        amount: '12.00'
      }
    ]
  )
})

test('normalizePricing maps reusable pricing fields to Bachs snake case', () => {
  assert.deepEqual(
    normalizePricing({
      type: 'custom',
      presetAmount: '10.00',
      minimumAmount: '5.00',
      maximumAmount: '100.00',
      currencyOptions: {
        NGN: '15000.00'
      }
    }),
    {
      price_type: 'custom',
      preset_amount: '10.00',
      minimum_amount: '5.00',
      maximum_amount: '100.00',
      currency_options: {
        NGN: '15000.00'
      }
    }
  )
})

test('buildCheckoutSessionPayload maps product checkout inputs to Bachs snake case', () => {
  const payload = buildCheckoutSessionPayload(
    {
      items: [{ product: 'prod_abc123', quantity: 2, amount: '50.00' }],
      customer: {
        email: 'customer@example.com',
        name: 'Jane Doe',
        phoneNumber: '+2348012345678'
      },
      billingCurrency: 'NGN',
      allowedPaymentMethodTypes: ['bank_transfer', 'card'],
      returnUrl: 'https://example.com/return',
      cancelUrl: 'https://example.com/cancel',
      reference: 'order_9876',
      metadata: {
        orderId: '9876'
      }
    },
    {}
  )

  assert.deepEqual(payload, {
    customer: {
      email: 'customer@example.com',
      name: 'Jane Doe',
      phone_number: '+2348012345678'
    },
    product_cart: [
      {
        product_id: 'prod_abc123',
        quantity: 2,
        pricing: {
          price_type: 'fixed',
          amount: '50.00'
        }
      }
    ],
    billing_currency: 'NGN',
    allowed_payment_method_types: ['bank_transfer', 'card'],
    return_url: 'https://example.com/return',
    cancel_url: 'https://example.com/cancel',
    reference: 'order_9876',
    metadata: {
      orderId: '9876'
    }
  })
})

test('buildCheckoutSessionPayload maps productCollectionId and configured return URL', () => {
  const payload = buildCheckoutSessionPayload(
    {
      productCollectionId: 'pgrp_123',
      customer: {
        customerId: 'cust_123'
      }
    },
    {
      returnUrl: 'https://example.com/after',
      cancelUrl: 'https://example.com/cancel'
    }
  )

  assert.deepEqual(payload, {
    customer: {
      customer_id: 'cust_123'
    },
    product_collection_id: 'pgrp_123',
    return_url: 'https://example.com/after',
    cancel_url: 'https://example.com/cancel'
  })
})

test('buildPureCheckoutPayload maps amount checkout inputs to Bachs snake case', () => {
  const payload = buildPureCheckoutPayload(
    {
      amount: '50.00',
      currency: 'USD',
      currencyOptions: {
        NGN: '75000.00'
      },
      email: 'customer@example.com',
      name: 'Jane Doe',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      reference: 'order_9876',
      metadata: {
        orderId: '9876'
      },
      expiresInMinutes: 30,
      simulatedOutcome: 'success'
    },
    {}
  )

  assert.deepEqual(payload, {
    pricing: {
      currency: 'USD',
      amount: '50.00',
      currency_options: {
        NGN: '75000.00'
      }
    },
    customer_email: 'customer@example.com',
    customer_name: 'Jane Doe',
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
    reference: 'order_9876',
    metadata: {
      orderId: '9876'
    },
    expires_in_minutes: 30,
    simulated_outcome: 'success'
  })
})

test('buildPureCheckoutPayload reuses advanced pricing normalization', () => {
  const payload = buildPureCheckoutPayload({
    pricing: {
      type: 'custom',
      currency: 'USD',
      presetAmount: '10.00',
      minimumAmount: '5.00',
      maximumAmount: '100.00'
    },
    currencyOptions: {
      NGN: '15000.00'
    }
  })

  assert.deepEqual(payload, {
    pricing: {
      currency: 'USD',
      price_type: 'custom',
      preset_amount: '10.00',
      minimum_amount: '5.00',
      maximum_amount: '100.00',
      currency_options: {
        NGN: '15000.00'
      }
    }
  })
})

test('buildRefundPayload maps refund inputs to Bachs snake case', () => {
  const payload = buildRefundPayload({
    chargeId: 'chr_123',
    reference: 'refund_123',
    refundAddress: 'wallet-address',
    amount: '25.00',
    feeBearer: 'org',
    reason: 'Customer request',
    idempotencyKey: 'refund_123',
    simulatedOutcome: 'success'
  })

  assert.deepEqual(payload, {
    charge_id: 'chr_123',
    reference: 'refund_123',
    refund_address: 'wallet-address',
    amount: '25.00',
    fee_bearer: 'org',
    reason: 'Customer request',
    idempotency_key: 'refund_123',
    simulated_outcome: 'success'
  })
})
