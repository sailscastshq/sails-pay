/**
 * Translates Bachs Connect responses into the provider-agnostic shapes
 * returned by `sails.pay.connect`. Every adapter that implements Connect
 * returns these same shapes, so application code never reads provider fields.
 */

function capabilityStatus(capability) {
  const status = capability && capability.status
  if (status === 'active' || status === 'pending') return status
  return 'inactive'
}

function toAccount(account, { email } = {}) {
  const capabilities = {}
  for (const [name, capability] of Object.entries(
    (account && account.capabilities) || {}
  )) {
    capabilities[name] = capabilityStatus(capability)
  }

  return {
    id: account.id,
    email: account.contact_email || email || null,
    name: account.display_name || account.name || null,
    country: account.country || null,
    capabilities,
    requirements:
      (account.requirements && account.requirements.currently_due) || [],
    raw: account
  }
}

function toLink(link) {
  return {
    url: link.url,
    expiresAt: link.expires_at || null,
    raw: link
  }
}

function toTransfer(transfer) {
  return {
    id: transfer.id,
    account: transfer.destination,
    amount: transfer.amount,
    currency: transfer.currency,
    group: transfer.transfer_group || null,
    status: transfer.status === 'paid' ? 'paid' : 'pending',
    raw: transfer
  }
}

function toBalances(response) {
  return ((response && response.balances) || []).map((balance) => ({
    currency: balance.currency,
    available: balance.available_balance,
    pending: balance.pending_balance
  }))
}

function payoutStatus(status) {
  if (status === 'completed') return 'paid'
  if (status === 'failed') return 'failed'
  return 'pending'
}

function toPayoutQuote(quote) {
  return {
    id: quote.quote_id,
    fromCurrency: quote.from_currency,
    toCurrency: quote.to_currency,
    fromAmount: quote.from_amount,
    toAmount: quote.to_amount,
    exchangeRate: quote.exchange_rate,
    expiresAt: quote.expires_at,
    raw: quote
  }
}

function toPayout(payout, { account }) {
  return {
    id: payout.id,
    account,
    amount: payout.amount,
    currency: payout.currency,
    sourceCurrency: payout.source_currency || payout.currency,
    fee: payout.fee || null,
    totalDebited: payout.total_debited || null,
    destination: payout.destination || null,
    status: payoutStatus(payout.status),
    raw: payout
  }
}

module.exports = {
  toAccount,
  toLink,
  toTransfer,
  toBalances,
  toPayoutQuote,
  toPayout
}
