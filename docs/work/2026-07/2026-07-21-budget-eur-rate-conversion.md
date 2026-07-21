# 2026-07-21 — Budget EUR rate_source now actually converts, instead of just labeling

## What changed
`getBudgetStatus` now converts a budget's `amount` to USD before comparing it against `spent` when `rate_source` is `'eur'`. Previously `rate_source` (added earlier today) was purely a cosmetic badge — the raw number stayed untouched regardless of which tag was selected, so a budget entered as "48" with the Euro tag was compared as if it were $48, not €48.

## Why
The owner set the Gym budget to `amount: 48` with `rate_source: 'eur'` (meaning "the gym costs €48"), expecting the app to know that. Instead the status screen showed "$54.74 / $48.00 — 114% usado" (over budget) when in reality €48 ≈ $54.74 at the day's rate — spending matched the budget exactly. Reported directly: "el pago se realizó con la tasa euro, en budgets sale que 54.74$ es mayor a 48euros... los está poniendo iguales."

## How
`budgetedInUsd(amount, rateSource, eurUsdRate)` in `server/services/budgets/status.js`: only `rate_source === 'eur'` triggers conversion (multiplies by the day's `eurRate/usdRate` cross rate, fetched once per `getBudgetStatus` call, not per budget). `'bcv'` and `'binance'` stay non-converting on purpose — those tags describe *which rate was used to reach a dollar figure that's already in the stored amount* (per the owner's original fixed-expense table, e.g. "Aveo $150 a tasa Binance" — $150 is already the real dollar target), whereas `'eur'` is the one tag where the stored number is genuinely in a foreign currency, not a USD figure. The response also carries `budgeted_original` (the pre-conversion number) when a conversion happened, so the frontend can show "meta: €48.00" next to the converted comparison instead of hiding the original entry. Frontend: `BudgetStatus`/`ApiBudgetStatus` types and `BudgetCard.tsx` updated to surface it.
Verified against production data: Gym went from the incorrect 114%-over-budget reading to the correct 100% (spent $54.74 of a $54.74-equivalent €48 target).

## Promoted knowledge
None — additive to the `rate_source` field shipped earlier today, no new pattern.

## Follow-ups
- [ ] The bcv/binance-vs-eur asymmetry (two tags are informational, one triggers real conversion) is implicit in the code, not enforced or explained anywhere the owner would see it before entering a number. If a future rate_source value is added, its conversion behavior needs the same explicit call.
- [ ] No automated test; verified manually via `node -e` against the running dev DB (same production database).
