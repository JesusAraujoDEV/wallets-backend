# 2026-07-15 — Backfill historical USDT/Binance rate onto transactions

## What changed
Added `usdt_rate_used` and `amount_usdt` (nullable) columns to `transactions`, populated for every transaction dated on/after 2026-01-20 (the first day the BCV API's `/history` endpoint carries a non-null `usdt_rate`) — 306 of 726 transactions. `amountUsdt` is now returned by `getAllTransactions`/`getGroupedTransactions`. Purely informational: `amountUsd` and every USD-based total are untouched.

## Why
The owner asked to stamp the historical Binance/USDT rate onto past transactions, now that `exchange_rates` (added earlier today) holds full daily history including `usdt_rate`.

## How
`amountUsdt = amountUsd * (usdRate / usdtRate)` using the `exchange_rates` row on/before the transaction's date (weekends/holidays inherit the prior day's rate, same as the rest of the app). One-off script `server/scripts/backfill_transaction_usdt.js` loads all `exchange_rates` rows with a non-null `usdt_rate` once, then walks each transaction. Re-running `backfill_exchange_rates.js` first was necessary — the external API's Binance sync had filled in more historical `usdt_rate` values since the first backfill earlier today, so the initial `exchange_rates` backfill only had `usdt_rate` for a single day until re-run.

## Promoted knowledge
None.

## Follow-ups
- [ ] `amountUsdt` is exposed in the API but not yet surfaced anywhere in the frontend transaction list UI (only used today via the account-balance USDT toggle, which computes live rather than reading this stored value).
- [ ] Transactions before 2026-01-20 will never get a `usdt_rate_used` — the external provider simply has no Binance data further back.
