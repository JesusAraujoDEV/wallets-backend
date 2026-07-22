# 2026-07-22 — Close the analytics-exclusion gap in the stats module

## What changed
The 8 stats services (`cash_flow`, `spending_heatmap`, `expense_volatility`, `monthly_forecast`, `income_heatmap`, `income_volatility`, `comparative_mom`, `comparative_mom_income`) each carried their own copy of the group-filter bug: an unconditional INNER JOIN to `CategoryGroup` via `buildIncludedGroupWhere(groupId)` that dropped every transaction whose category had no group — i.e. almost all of them. The spending heatmap showed only `["Comision"]` (the one gasto category that happened to belong to a group) and the monthly forecast projected ~$0.03. All 8 now reuse `resolveAnalyticsCategoryFilter` / `applyAnalyticsCategoryFilter` from the transactions module, so ungrouped categories are included and only the "Movimientos internos" exclude-group (transfers + balance adjustments, ADR 0002) is filtered out.

## Why
This is the same root cause fixed earlier today for `/summary/*` and `/transactions` (see `2026-07-22-transfer-fx-direction-and-analytics-include-bug.md`), but a separate, still-broken copy lived in `stats/shared.js`. The stats version was worse: the JOIN was `required: true` unconditionally, with no include/exclude toggle exposed, so every stats chart only ever saw categories that belonged to a group.

## How
Ported the transactions-module pattern to each of the 8 files: dropped the nested `CategoryGroup` sub-include, and before each query resolved a `categoryId` filter with `resolveAnalyticsCategoryFilter({ userId, behavior: 'include', groupId })` (behavior is hardcoded `'include'` — these endpoints expose no toggle, marked with a `ponytail:` comment) merged into the transaction `where` via `applyAnalyticsCategoryFilter`. The `Category` type include (`type: 'gasto'|'ingreso'`, `required: true`) stays. `buildIncludedGroupWhere` is now dead and was removed from `stats/shared.js`. `analytics_group_filter.js` was reused in place under `services/transactions/` (stats import it as `../transactions/analytics_group_filter`) — not duplicated or relocated, since one canonical copy already existed.

Verified live against the production DB via the local nodemon server (localhost:4001, new code) since production still runs the old code pending deploy:
- spending-heatmap (2026-02-01 → 2026-07-31): categories `["Comision"]` → 20 real categories (Carro, Comida, Gym, Gasolina, Universidad, …), transfers/adjustments correctly absent.
- monthly-forecast (2026-07-22): `current_spending_mtd` $0.02 → $592.23 (matches the July expense total from `/summary/balance`, confirming stats and summary now agree), projected $0.03 → $834.51.

Files changed (9): `server/services/stats/{shared,spending_heatmap,income_heatmap,cash_flow,monthly_forecast,expense_volatility,income_volatility,comparative_mom,comparative_mom_income}.js`. All pass `node --check`. No schema or API-contract change.

## Promoted knowledge
None new — this closes a gap where ADR 0002 (`docs/decisions/0002-exclude-internal-movements-from-analytics.md`) was not yet applied. That ADR remains the living source: internal transfers and balance adjustments are excluded from analytics via the `analyticsBehavior=exclude` group + `resolveAnalyticsCategoryFilter`, and future "not real income/expense" categories go in that group, not into per-query filters.

## Follow-ups
- [ ] Deploy required: this is a source-code change and there is no CI/CD auto-deploy for this backend — production keeps returning `["Comision"]` until manually deployed.
