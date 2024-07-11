const { fetch: undiciFetch } = require('undici')

const baseUrl = 'https://api.paystack.co'
const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

const fetchImpl = undiciFetch

const fetch = async (path, options = {}) => {
  const url = new URL(path, baseUrl).toString()
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
