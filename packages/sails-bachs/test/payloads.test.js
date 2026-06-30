const test = require('node:test')
const assert = require('node:assert/strict')
const {
  buildCheckoutSessionPayload,
  buildPureCheckoutPayload,
  buildRefundPayload
} = require('../helpers/payloads')

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
        amount: '50.00'
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
