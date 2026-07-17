# 2026-07-17 — Exchange rate worker: self-healing sync instead of single daily upsert

## What changed
`upsertTodayRate()` (still exported, now a thin wrapper) is superseded as the worker's main entry point by a new `syncRecentRates(daysBack = 5)`, which checks the last 5 days against what's already in `exchange_rates` and fetches/upserts any that are still missing — not just "today." The cron moved from a single `15 0 * * *` run to four runs a day (`15 0,8,14,20 * * *`), and `server.js` now also calls `syncRecentRates()` once synchronously on startup.

## Why
The owner reported the Rates chart/table stuck two days behind (last point 2026-07-15 when "today" was 2026-07-17). Root cause: `upsertTodayRate` only ever fetched the exact current date, at a single fixed time (00:15), and silently wrote nothing if the BCV upstream API didn't have that date's rate yet or errored — there was no retry and no way for a missed day to ever get backfilled short of a manual script run.

## How
`syncRecentRates` queries `ExchangeRate` for existing dates in `[today - daysBack, today]`, then calls the existing `fetchRateFromProvider(date)` (unchanged, from `exchange_rate_provider.js`) only for the dates not already present, upserting each result. This makes the job idempotent and self-healing: a day that BCV hadn't published at 00:15 gets picked up by the 08:15/14:15/20:15 runs the same day, and any gap from downtime closes automatically within `daysBack` days of the service coming back up — no manual backfill needed. The read-path fallback (`getRateWithFallback`, used by `/current` and `/by-date`) is untouched; this only changes what gets *written* proactively.
Verified directly against the dev DB: before the fix, `getRateHistory({from: '2026-07-10', to: '2026-07-17'})` was missing 07-16/07-17; after restarting the server (which triggers the new startup sync), the same query returned all 8 consecutive dates through 07-17.

## Promoted knowledge
None — this is a reliability fix to an existing worker pattern, no new architecture.

## Follow-ups
- [ ] The BCV provider fetch (`exchange_rate_provider.js:57-59`) still swallows the actual axios error (`catch (_error) { return null; }`), so "no rate published yet" and "API is down" remain indistinguishable in logs. Not fixed here — `syncRecentRates`'s retry-on-next-run behavior papers over both cases equally, but if the upstream API has a longer outage than `daysBack` covers, it would still need investigation via logs that don't currently exist.
- [ ] No automated test covers `syncRecentRates`; verified manually via a one-off `node -e` query against the running dev DB, not a backend test.
