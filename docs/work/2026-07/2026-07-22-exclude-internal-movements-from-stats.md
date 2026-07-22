# 2026-07-22 — Internal transfers and balance adjustments no longer count as income/expense

## What changed
Created a `CategoryGroup` ("Movimientos internos", id 19, `type=neutral`, `analyticsBehavior=exclude`) for userId=1 and assigned the 5 system categories that represent non-economic movement — Transferencia (Salida) 169, Transferencia (Entrada) 170, Ajuste de Balance 25, Ajuste de Balance (-) 5, Ajuste de Balance (+) 6 — to it via the live API. Data-only change, no source code touched.

## Why
The user flagged that Monthly Income showed $1075.14 for July when only ~$889 was real payroll income; the difference was the destination legs of two internal transfers (buying $65 USD from Salud, and the Bancamiga leg of the gym-payment-via-Cesar transfer) plus balance-adjustment transactions, all counted as regular income under the `analyticsBehavior=include` default fixed earlier today. Transfers move money between the user's own accounts and adjustments reconcile Platica against reality — neither is money earned or spent.

## How
No new code: this reuses `resolveAnalyticsCategoryFilter` (`services/transactions/analytics_group_filter.js`, shipped earlier today) exactly as designed — it already excludes categories belonging to an `analyticsBehavior=exclude` group. `POST /category-groups` created the group, `PATCH /category-groups/19/assign-categories` assigned the 5 categories. Verified: `GET /summary/balance?month=2026-07` — income $1075.14 → $889.04 (matches the user's own hand-tally to the cent), expense $1508.72 → $592.23. "Me pasan" (58), FX gain/loss (175/176), and commissions (23/174) were deliberately left ungrouped — see ADR for the reasoning.

## Promoted knowledge
[`docs/decisions/0002-exclude-internal-movements-from-analytics.md`](../../decisions/0002-exclude-internal-movements-from-analytics.md) — the canonical record of which categories are excluded, why, and the rule for assigning future ones.

## Follow-ups
- [ ] Multi-user: this exclusion lives in per-user data (group + category assignments), not a migration. A future multi-user rollout needs a seed that creates the same group and assigns the same system categories for every new user.
- [ ] Whether FX gain/loss and commissions should also be excluded is an open product question, not decided here.
