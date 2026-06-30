const { fetch: undiciFetch } = require('undici')
const normalizeError = require('./normalize-error')

const liveBaseUrl = 'https://api.bachs.io'
const sandboxBaseUrl = 'https://sandbox-api.bachs.io'
const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

let fetchImpl = typeof global.fetch !== 'undefined' ? global.fetch : undiciFetch

function resolveBaseUrl({ apiKey, baseUrl } = {}) {
  if (baseUrl) {
    return baseUrl
  }

  if (apiKey && apiKey.startsWith('sk_sandbox_')) {
    return sandboxBaseUrl
  }

  return liveBaseUrl
}

function getVersionedPath(path) {
  if (path.startsWith('/v1/')) {
    return path
  }

  return `/v1${path.startsWith('/') ? path : `/${path}`}`
}

async function parseJsonResponse(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    return text
  }
}

const fetch = async (path, options = {}) => {
  const { apiKey, baseUrl, idempotencyKey, headers, body, ...requestOptions } =
    options
  const url = new URL(
    getVersionedPath(path),
    resolveBaseUrl({ apiKey, baseUrl })
  ).toString()

  const mergedHeaders = {
    ...defaultHeaders,
    ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    ...(idempotencyKey && { 'Idempotency-Key': idempotencyKey }),
    ...(headers || {})
  }

  const response = await fetchImpl(url, {
    ...requestOptions,
    headers: mergedHeaders,
    ...(body !== undefined && {
      body: typeof body === 'string' ? body : JSON.stringify(body)
    })
  })
  const responseBody = await parseJsonResponse(response)

  if (!response.ok) {
    const error = new Error('Bachs API request failed')
    error.bachs = normalizeError(responseBody, response)
    throw error
  }

  return responseBody
}

fetch.resolveBaseUrl = resolveBaseUrl
fetch.setFetchImplementation = function setFetchImplementation(implementation) {
  fetchImpl = implementation
}
fetch.resetFetchImplementation = function resetFetchImplementation() {
  fetchImpl = typeof global.fetch !== 'undefined' ? global.fetch : undiciFetch
}

module.exports = fetch
