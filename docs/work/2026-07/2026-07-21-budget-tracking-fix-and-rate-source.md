# 2026-07-21 — Budget spend-tracking bug fix, per-budget rate source

## What changed
Fixed a bug where every budget showed 0% used regardless of real spending: `aggregateSpentByCategory` (`budget_service.js`) required the transaction's category to belong to a `CategoryGroup` with `analyticsBehavior: 'include'` via an inner join — any category with no group (the common case for user-created categories like Carro, Gym, Claude) was silently excluded from all budget totals. Also added an optional `rate_source` field to budgets (`bcv` | `binance` | `eur` | `usd`) so a target amount can record which exchange rate it's meant to be measured against — the same Bs amount buys a different USD amount depending on which rate applies, and the owner's fixed-expense plan mixes both (e.g. Aveo/Gym at BCV, Curso Alemán/Claude at Binance).

## Why
The owner created seven monthly budgets from their savings plan and every single one showed $0/$X spent despite real transactions existing in those categories — reported directly ("si ya anotaste el gym, porque sale que 0% usado?"). Root cause: none of the seven categories had a `groupId` set (the only existing group doesn't include them), so the inner-join filter excluded them entirely — a silent, hard-to-notice failure mode for any groupless category, not specific to this user's data. The rate-source field was a separate, immediate follow-up ask once the totals were visible and the owner corrected two budget amounts that had been set using the wrong rate assumption (Aveo $185→$150 at Binance, not BCV as originally documented).

## How
- `listBudgetableCategoryIds(userId)`: fetches `gasto` categories with a `LEFT JOIN` (`required: false`) to `CategoryGroup`, then filters in JS — a category counts unless it belongs to a group explicitly marked `exclude`. Replaces the old inner-join `where: { analyticsBehavior: 'include' }, required: true` which demanded opt-in instead of defaulting to included.
- `aggregateSpentByCategory` now queries transactions with `categoryId: { [Op.in]: categoryIds }` from that allowlist instead of the nested-include filter.
- `rate_source`: new nullable `STRING(20)` column on `budgets` (migration `20260721000000-add-rate-source-to-budgets.js`), `rateSource` on the model, `rate_source` accepted/returned through `createBudget`/`updateBudget`/`listBudgets`/`getBudgetStatus`, validated in Joi (`budget_schema.js`) as one of the four allowed values. Frontend: `BudgetPeriodFields.tsx` (new, extracted from `BudgetFormDialog.tsx` to stay under the 150-line component ceiling) adds the selector; `BudgetCard.tsx` shows it as a secondary badge next to the period badge.
- Verified against the owner's real (production) data: Gym went from $0/$65 shown to the correct $54.74/$65 after the fix, matching an existing transaction; confirmed via direct service calls, not just code review.

## Promoted knowledge
None — this is a bug fix to existing behavior plus an additive field on an existing model, no new architectural pattern. The `stats/*.js` services (`comparative_mom.js`, heatmaps, etc.) use the same inner-join-on-group-include pattern for their own category filtering — **not fixed here**, flagged below since it likely has the same groupless-category blind spot.

## Follow-ups
- [ ] `server/services/stats/*.js` (comparative MoM, heatmaps, volatility) filter categories through the same `required: true` + `analyticsBehavior: 'include'` join pattern that just caused this bug in budgets. Not touched in this change because altering it would change historical stats output retroactively — needs its own explicit confirmation before changing, not a silent fix.
- [ ] No automated test covers `listBudgetableCategoryIds`/`aggregateSpentByCategory`; verified manually against production data via `node -e` scripts, not a test suite.
