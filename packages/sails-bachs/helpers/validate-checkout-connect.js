const allowedFields = new Set(['destination', 'platformFee'])
const decimalStringPattern = /^\d+(?:\.\d+)?$/

function invalid(field, message) {
  return {
    field,
    message: `${field} ${message}`
  }
}

/**
 * Validates the `connect` checkout input that splits a checkout between a
 * connected account and the platform. Returns an error object, or null.
 */
function validateCheckoutConnect(connect, { isCheckoutSession }) {
  if (!connect || typeof connect !== 'object' || Array.isArray(connect)) {
    return invalid('connect', 'must be an object.')
  }

  if (!isCheckoutSession) {
    return invalid(
      'connect',
      'is only supported on product checkout sessions (items or productCollectionId).'
    )
  }

  for (const field of Object.keys(connect)) {
    if (!allowedFields.has(field)) {
      return invalid(
        `connect.${field}`,
        'is not supported. Use connect.destination and connect.platformFee.'
      )
    }
  }

  if (typeof connect.destination !== 'string' || !connect.destination) {
    return invalid('connect.destination', 'must be a connected account ID.')
  }

  if (
    typeof connect.platformFee !== 'string' ||
    !decimalStringPattern.test(connect.platformFee) ||
    Number(connect.platformFee) <= 0
  ) {
    return invalid(
      'connect.platformFee',
      'must be a positive decimal string, e.g. "500.00".'
    )
  }

  return null
}

module.exports = validateCheckoutConnect
