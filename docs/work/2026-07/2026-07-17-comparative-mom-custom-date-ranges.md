# 2026-07-17 — Comparative MoM: arbitrary date-range comparisons, locale-neutral period boundaries

## What changed
`comparative_mom.js` and `comparative_mom_income.js` accept four new optional query params (`current_from`, `current_to`, `previous_from`, `previous_to`) that, when all present, replace the default current-month-to-date-vs-previous-month-to-date window with any two arbitrary periods. Both services also stopped returning a pre-formatted, Spanish-only period label (`current_period_name`/`previous_period_name`, built from a hardcoded `MONTH_NAMES` array); they now return raw ISO boundaries (`current_period_start/end`, `previous_period_start/end`) and leave label formatting to the caller.

## Why
The frontend (`wallets-frontend`) needed a way to compare user-chosen periods for a new Statistics page, not just "this month vs last month." Separately, the owner reported the comparison card mixing Spanish month names ("Comparando Julio MTD...") into an otherwise-English UI — the root cause was this endpoint building a localized string server-side with no knowledge of the client's language.

## How
Both services keep their existing MTD-vs-prior-MTD default path (used unchanged by the frontend's own dashboard) behind a guard: if the four range params aren't all supplied, the original date-math runs exactly as before. When supplied, the four dates are used directly as the query windows, skipping the MTD-trim logic entirely. The controller (`stats_controller.js`) passes the new snake_case params straight through as camelCase service args; no Joi schema exists for these routes to update. Swagger docs (`server/swagger/stats/stats.js`) updated with the new params and response shape.

## Promoted knowledge
None — this extends an existing endpoint pattern already documented via its own swagger annotations; no new architectural doc needed.

## Follow-ups
- [ ] `MONTH_NAMES` in `server/services/stats/shared.js` is now unused by these two services but still hardcoded Spanish and still consumed elsewhere (grep before removing). `WEEKDAYS` (same file) is still Spanish-only and still returned by `spending_heatmap.js`/`income_heatmap.js` — the frontend now ignores those strings and relocalizes client-side, so `WEEKDAYS` could eventually be dropped from the response, but wasn't touched here to keep this change backward compatible.
- [ ] No automated test covers the new custom-range branch; verified manually via the frontend Statistics page wiring, not via a backend test.
