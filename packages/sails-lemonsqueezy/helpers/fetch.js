const { fetch: undiciFetch } = require('undici')

const baseUrl = 'https://api.lemonsqueezy.com'
const defaultHeaders = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json'
}

const fetchImpl =
  typeof global.fetch !== 'undefined' ? global.fetch : undiciFetch

const fetch = async (path, options = {}) => {
  const url = new URL(`/v1${path}`, baseUrl).toString()
  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  }

  try {
    const response = await fetchImpl(url, mergedOptions)

    const jsonResponse = await response.json()

    return jsonResponse
  } catch (error) {
    console.error('Error occurred during fetch:', error)
    throw error
  }
}

module.exports = fetch
