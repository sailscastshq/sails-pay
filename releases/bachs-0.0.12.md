# Bachs adapter 0.0.12

Adds three optional, mutually exclusive inputs to one-time checkout sessions:

- `allowPromoCodes` lets buyers enter a promo code on hosted checkout.
- `promoCodeId` applies a promo code automatically.
- `discountId` applies a Bachs discount directly without a code.

The adapter leaves the original amount intact. Checkouts that omit these options are unchanged.

Only the Bachs adapter is versioned in this release. The core hook is unchanged.

[Adapter changes](https://github.com/sailscastshq/sails-pay/pull/31)
