function withoutUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(withoutUndefined)
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.entries(value).reduce((memo, [key, entryValue]) => {
    if (entryValue !== undefined) {
      memo[key] = withoutUndefined(entryValue)
    }

    return memo
  }, {})
}

function buildCustomerPayload(inputs) {
  const checkoutData = inputs.checkoutData || {}
  const customer = inputs.customer || {}
  const customerId = customer.customerId || customer.id

  if (customerId) {
    return withoutUndefined({
      customer_id: customerId
    })
  }

  return withoutUndefined({
    email:
      customer.email ||
      inputs.customerEmail ||
      inputs.email ||
      checkoutData.email,
    name:
      customer.name || inputs.customerName || inputs.name || checkoutData.name,
    phone_number: customer.phoneNumber || inputs.phoneNumber
  })
}

function buildProductCart(items) {
  if (!items) {
    return undefined
  }

  return items.map((item) => {
    const pricing =
      item.amount !== undefined
        ? normalizePricing({
            type: 'fixed',
            amount: item.amount
          })
        : normalizePricing(item.pricing)

    return withoutUndefined({
      product_id: item.product || item.productId,
      quantity: item.quantity,
      pricing,
      amount: item.chosenAmount
    })
  })
}

function buildCheckoutSessionPayload(inputs, adapterConfig = {}) {
  const productCollectionId =
    inputs.productCollectionId || inputs.productCollection
  const productCart = buildProductCart(inputs.items)
  const checkoutData = inputs.checkoutData || {}
  const returnUrl =
    inputs.returnUrl ||
    inputs.successUrl ||
    adapterConfig.returnUrl ||
    adapterConfig.successUrl

  return withoutUndefined({
    customer: buildCustomerPayload(inputs),
    product_cart: productCart,
    product_collection_id: productCollectionId,
    // A session prices itself with products or with a raw amount, never both.
    pricing:
      productCart || productCollectionId
        ? undefined
        : buildPricingPayload(inputs),
    billing_currency: inputs.billingCurrency,
    allowed_payment_method_types: inputs.allowedPaymentMethodTypes,
    return_url: returnUrl,
    cancel_url: inputs.cancelUrl || adapterConfig.cancelUrl,
    reference: inputs.reference,
    metadata: inputs.metadata || checkoutData.custom,
    expires_in_minutes: inputs.expiresInMinutes,
    transfer_data: inputs.connect && {
      destination: inputs.connect.destination
    },
    platform_fee: inputs.connect && inputs.connect.platformFee
  })
}

function normalizePricing(pricing, fallbackCurrencyOptions) {
  if (!pricing || typeof pricing !== 'object' || Array.isArray(pricing)) {
    return undefined
  }

  const {
    type,
    presetAmount,
    minimumAmount,
    maximumAmount,
    currencyOptions,
    ...pricingInput
  } = pricing
  const normalizedPricing = withoutUndefined({
    ...pricingInput,
    price_type: type,
    preset_amount: presetAmount,
    minimum_amount: minimumAmount,
    maximum_amount: maximumAmount,
    currency_options:
      currencyOptions === undefined ? fallbackCurrencyOptions : currencyOptions
  })

  return Object.keys(normalizedPricing).length > 0
    ? normalizedPricing
    : undefined
}

function buildPricingPayload(inputs) {
  if (inputs.pricing) {
    return normalizePricing(inputs.pricing, inputs.currencyOptions)
  }

  return normalizePricing({
    currency: inputs.currency,
    amount: inputs.amount,
    currencyOptions: inputs.currencyOptions
  })
}

function buildRefundPayload(inputs) {
  return withoutUndefined({
    charge_id: inputs.chargeId,
    reference: inputs.reference,
    refund_address: inputs.refundAddress,
    amount: inputs.amount,
    fee_bearer: inputs.feeBearer,
    reason: inputs.reason,
    idempotency_key: inputs.idempotencyKey,
    simulated_outcome: inputs.simulatedOutcome
  })
}

module.exports = {
  buildCheckoutSessionPayload,
  buildRefundPayload,
  buildProductCart,
  buildCustomerPayload,
  normalizePricing,
  withoutUndefined
}
