const pricingTypes = new Set(['fixed', 'custom', 'free'])
const pricingMoneyFields = [
  'amount',
  'presetAmount',
  'minimumAmount',
  'maximumAmount'
]
const customPricingFields = ['presetAmount', 'minimumAmount', 'maximumAmount']
const decimalStringPattern = /^\d+(?:\.\d+)?$/

function fieldWasProvided(object, field) {
  return object[field] !== undefined
}

function invalid(field, message) {
  return {
    field,
    message: `${field} ${message}`
  }
}

function validateMoney(value, field) {
  if (typeof value !== 'string' || !decimalStringPattern.test(value)) {
    return invalid(field, 'must be a non-negative decimal string.')
  }
}

function validatePricingMoney(pricing, itemPath) {
  for (const field of pricingMoneyFields) {
    if (fieldWasProvided(pricing, field)) {
      const error = validateMoney(
        pricing[field],
        `${itemPath}.pricing.${field}`
      )

      if (error) {
        return error
      }
    }
  }
}

function validateItem(item, index) {
  const itemPath = `items[${index}]`

  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return invalid(itemPath, 'must be an object.')
  }

  if (
    fieldWasProvided(item, 'quantity') &&
    (!Number.isInteger(item.quantity) || item.quantity < 1)
  ) {
    return invalid(`${itemPath}.quantity`, 'must be an integer of at least 1.')
  }

  const hasAmount = fieldWasProvided(item, 'amount')
  const hasPricing = fieldWasProvided(item, 'pricing')
  const hasChosenAmount = fieldWasProvided(item, 'chosenAmount')

  if (hasAmount && hasPricing) {
    return invalid(
      itemPath,
      'must not provide both amount and pricing; amount is the fixed-price shorthand.'
    )
  }

  if (hasAmount) {
    const error = validateMoney(item.amount, `${itemPath}.amount`)

    if (error) {
      return error
    }

    if (hasChosenAmount) {
      return invalid(
        `${itemPath}.chosenAmount`,
        'can only be used with catalog custom pricing or ad-hoc custom pricing.'
      )
    }
  }

  if (hasChosenAmount) {
    const error = validateMoney(item.chosenAmount, `${itemPath}.chosenAmount`)

    if (error) {
      return error
    }
  }

  if (!hasPricing) {
    return
  }

  if (
    !item.pricing ||
    typeof item.pricing !== 'object' ||
    Array.isArray(item.pricing)
  ) {
    return invalid(`${itemPath}.pricing`, 'must be an object.')
  }

  const pricing = item.pricing

  if (!pricingTypes.has(pricing.type)) {
    return invalid(
      `${itemPath}.pricing.type`,
      'must be fixed, custom, or free.'
    )
  }

  if (pricing.type === 'fixed') {
    if (!fieldWasProvided(pricing, 'amount')) {
      return invalid(
        `${itemPath}.pricing.amount`,
        'is required for fixed pricing.'
      )
    }

    const customField = customPricingFields.find((field) =>
      fieldWasProvided(pricing, field)
    )

    if (customField) {
      return invalid(
        `${itemPath}.pricing.${customField}`,
        'is not allowed with fixed pricing.'
      )
    }

    if (hasChosenAmount) {
      return invalid(
        `${itemPath}.chosenAmount`,
        'can only be used with catalog custom pricing or ad-hoc custom pricing.'
      )
    }
  }

  if (pricing.type === 'custom' && fieldWasProvided(pricing, 'amount')) {
    return invalid(
      `${itemPath}.pricing.amount`,
      'is not allowed with custom pricing.'
    )
  }

  if (pricing.type === 'free') {
    const monetaryField = pricingMoneyFields.find((field) =>
      fieldWasProvided(pricing, field)
    )

    if (monetaryField) {
      return invalid(
        `${itemPath}.pricing.${monetaryField}`,
        'is not allowed with free pricing.'
      )
    }

    if (hasChosenAmount) {
      return invalid(
        `${itemPath}.chosenAmount`,
        'is not allowed with free pricing.'
      )
    }
  }

  return validatePricingMoney(pricing, itemPath)
}

module.exports = function validateCheckoutItems(items) {
  for (let index = 0; index < items.length; index++) {
    const error = validateItem(items[index], index)

    if (error) {
      return error
    }
  }
}
