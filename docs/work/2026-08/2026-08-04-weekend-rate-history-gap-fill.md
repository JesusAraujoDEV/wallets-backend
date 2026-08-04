# 2026-08-04 — Weekend/holiday gaps in rate history left unfilled

## What changed
`getRateHistory({from, to})` in `services/exchange_rate_service.js` queried the `exchange_rates` table directly and returned exactly the rows present, with no gap-filling — only today's row got a special live-fetch patch. Since BCV never publishes a rate for Saturday/Sunday, those dates simply have no DB row, so any date range spanning a weekend came back with holes. Rewrote it to build a `Map` keyed by date, then walk every date in `[from, to]` carrying the closest prior day's rate forward into any missing slot (plus one lookback query if `from` itself starts on a gap day).

## Why
User reported the frontend's per-day "Tasa USD" header showed "…" on weekends (e.g. Saturday Aug 1, Sunday Jul 26) while weekdays displayed fine. Traced to `useDailyRates` (`wallets-frontend`) doing `history.find(h => h.date === d)` against this endpoint's response — with no row for that date, the lookup returns `undefined`. The single-date lookup path (`/current`, `byDate` → `getRateForDate` → `getRateWithFallback`) already did this walk-back correctly; the range endpoint never had the same treatment.

## How
- Extracted `toPlainRate(r)` to normalize a raw `ExchangeRate` row/object consistently (was duplicated inline for the DB rows and the today-patch branch).
- Switched the row collection from an array to a `Map<date, rate>` for O(1) lookups during the fill pass.
- Gap-fill loop: iterate `cursor` from `from` to `to` (inclusive, `shiftDateUtc` day-by-day); if `byDate` has the cursor date, that becomes the new `carry`; otherwise, if a `carry` exists, clone it under the cursor's date. If `from` itself isn't in `byDate`, one extra query (`ExchangeRate.findOne` ordered `date DESC`, `date < from`) seeds `carry` before the loop starts.
- Verified with a standalone Node sanity check (not a DB test) that the carry-forward logic correctly threads Fri→Sat→Sun→Mon given a DB that only has Fri and Mon rows.

## Promoted knowledge
None — this is a correctness fix to an existing sync/read pattern, no new architecture. Any future range-based rate consumer should keep going through `getRateHistory`, not re-query `ExchangeRate` directly.

## Follow-ups
- [ ] None — verified the fix against the real range-query pattern the frontend uses; no further gaps identified in this pass.
