function normalizeError(error, response) {
  const body = error || {}
  const nestedError = body.error || {}

  return {
    statusCode: response && response.status,
    statusText: response && response.statusText,
    code: body.error_code || nestedError.code,
    message:
      body.detail ||
      body.message ||
      nestedError.message ||
      (response && response.statusText) ||
      'Bachs API request failed',
    errors: body.errors || nestedError.details,
    body
  }
}

module.exports = normalizeError
