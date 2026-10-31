# Bachs adapter 0.0.11 — release preparation

Status: prepared locally; unpublished. Public npm metadata checked on 31 October
2026 reports `@sails-pay/bachs` latest as `0.0.10`, with versions through `0.0.10`.
`0.0.11` is the next patch version. Recheck immediately before publication.

## Release notes

Bachs Connect balance reads now include `pendingSettlements` for each currency.
Each entry contains the provider-supplied `date` and decimal-string `amount`.
Existing `currency`, `available` and `pending` fields are unchanged. When no
schedule is supplied, `pendingSettlements` is an empty array. Amounts and dates
never cross currency boundaries.

Applications can explain when received funds are still pending settlement and
show an expected availability date when Bachs provides one. Only available funds
can cover a withdrawal and its fee. No settlement date or currency conversion is
inferred by the adapter.

## Package and repository conventions

The adapter is an independently versioned npm workspace. This preparation changes
`packages/sails-bachs/package.json` and its workspace entry in the root lockfile,
matching the previous adapter-only `0.0.10` release. The core `sails-pay` hook stays
at `0.2.6`. There is no automated publish workflow or Changesets configuration in
this checkout. Existing root `v0.2.x` tags belong to the core hook; do not use a
root `v0.0.11` tag for this adapter release. The verified adapter tag convention is `bachs-v0.0.11`,
following `bachs-v0.0.10`. Creating this GitHub release does not publish npm;
Kelvin runs the npm command below separately.

## Checks before approval

Run from the sails-pay repository root, on Node.js 22 or later:

```sh
node --test packages/sails-bachs/test/*.test.js
npx prettier --check packages/sails-bachs/helpers/connect.js packages/sails-bachs/test/connect.test.js packages/sails-bachs/package.json package-lock.json README.md releases/bachs-0.0.11.md
npm pack --dry-run --ignore-scripts --workspace=@sails-pay/bachs
npm view @sails-pay/bachs version versions dist-tags --json
```

Confirm the archive contains `adapter.js`, `helpers/connect.js` and
`machines/connect/balance/get.js`. Confirm `0.0.11` is still unpublished. Review
and merge the adapter changes through the normal feature-branch review flow.
Publication and merge require separate approval.

## Publication step — execute only after approval

From the reviewed main checkout containing this release preparation:

```sh
npm publish --workspace=@sails-pay/bachs --access public
npm view @sails-pay/bachs@0.0.11 version dist.integrity --json
```

If publication has an uncertain outcome, inspect registry metadata before doing
anything else. Never republish blindly. Do not change the core hook version.

## FLOSSAfrica dependency update — after registry verification

FLOSSAfrica remains pinned to `0.0.10` in the prepared app change, so installation
continues to work before this release exists. Once npm confirms `0.0.11`, run from
the reviewed FLOSSAfrica branch:

```sh
npm install --save-exact @sails-pay/bachs@0.0.11
npm ci
npm ls @sails-pay/bachs
npm run lint
npm run test:unit
node --test --test-concurrency=1 tests/functional/funding/pending-settlement.test.js tests/functional/funding/withdrawal.test.js tests/functional/funding/payout-bank.test.js tests/functional/funding/payout-picker.test.js tests/functional/funding/reconciliation.test.js tests/functional/webhooks/transfer-created.test.js
node --test --test-concurrency=1 tests/e2e/pages/pending-settlement.test.js tests/e2e/pages/withdrawal-limit.test.js
```

Review and commit both `package.json` and `package-lock.json`; npm must supply the
real registry URL and integrity. Run the production Shipwright build and the
project's remaining release checks before deployment approval. Local pre-release
UI verification used the modified adapter in an isolated dependency copy; the
post-publication clean install above must confirm the published package. No local
sibling path dependency should be committed.

## Separate technical announcement

Verified public repository and README:
https://github.com/sailscastshq/sails-pay/blob/main/README.md#connect

The README's advertised docs URL, https://docs.sailscasts.com/pay/, currently
returns HTTP 404. The working canonical Connect documentation is
https://docs.sailscasts.com/sails-pay/connect. Use that URL or the repository
README for the technical announcement. The settlement-schedule example on the
feature branch must be merged before announcing that example as publicly live.

Suggested release-note wording, to publish only once the package is live:

> Sails Pay's Bachs adapter now preserves settlement schedules alongside available
> and pending balances, separately for each currency. FLOSSAfrica uses this to
> show received funds awaiting settlement and when Bachs expects them to become
> available. Withdrawal checks continue to use available funds and include fees.

Link FLOSSAfrica's product update to the separate technical announcement once
its real public URL exists. No announcement URL is reserved or invented here,
and no post, email or external message has been sent.
