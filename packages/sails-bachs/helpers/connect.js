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

function toDestination(destination) {
  return {
    id: destination.id,
    name: destination.name || null,
    type:
      {
        bank_account: 'bank',
        mobile_money: 'mobileMoney',
        crypto_wallet: 'crypto'
      }[destination.type] || destination.type,
    currency: destination.currency,
    status:
      destination.status === 'approved'
        ? 'approved'
        : destination.status === 'rejected'
          ? 'rejected'
          : 'pending',
    statusReason: destination.status_reason || null,
    isUsable: destination.is_usable === true,
    isDefault: destination.is_default === true,
    accountNumber: destination.account_number || null,
    accountName: destination.account_name || null,
    bankCode: destination.bank_code || null,
    bankName: destination.bank_name || null,
    phoneNumber: destination.phone_number || null,
    mobileProvider: destination.mobile_provider || null,
    walletAddress: destination.wallet_address || null,
    network: destination.network || null,
    raw: destination
  }
}

function destinationPayload(inputs) {
  const body = {}
  const fields = {
    name: 'name',
    currency: 'currency',
    accountNumber: 'account_number',
    accountName: 'account_name',
    bankCode: 'bank_code',
    bankName: 'bank_name',
    phoneNumber: 'phone_number',
    mobileProvider: 'mobile_provider',
    walletAddress: 'wallet_address',
    network: 'network',
    isDefault: 'is_default',
    metadata: 'metadata'
  }
  for (const [field, key] of Object.entries(fields)) {
    if (
      inputs[field] !== undefined &&
      inputs[field] !== null &&
      inputs[field] !== ''
    )
      body[key] = inputs[field]
  }
  if (inputs.type)
    body.type = {
      bank: 'bank_account',
      mobileMoney: 'mobile_money',
      crypto: 'crypto_wallet'
    }[inputs.type]
  return body
}

module.exports = {
  toDestination,
  destinationPayload,
  toAccount,
  toLink,
  toTransfer,
  toBalances,
  toPayoutQuote,
  toPayout
}
