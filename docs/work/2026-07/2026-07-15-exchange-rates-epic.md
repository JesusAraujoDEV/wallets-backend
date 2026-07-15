# 2026-07-15 — Exchange rates: backend-owned BCV integration + Tasas screen

## What changed
Added a persisted `exchange_rates` table, a daily cron that upserts today's BCV rate, and three endpoints (`/api/exchange-rates/current`, `/by-date`, `/history`) backed by it. Consolidated the BCV walk-back/fallback logic that previously existed twice in the backend (`exchange_rate_service.js` for transfers, `transactions/exchange.js` for VES transaction conversion) into one shared `exchange_rate_provider.js`. On the frontend, `src/lib/rates.ts` — which fetched `https://bcv-api.irissoftware.lat` directly from the browser with its own `localStorage` cache — now calls only the new backend endpoints; legacy exports (`useVESExchangeRate`, `getRateByDate`, `convertToUSD`, `convertToUSDByDate`) were kept as thin wrappers so the seven existing consumers didn't need touching. A new "Tasas" page shows current USD/EUR/USDT rates and a historical chart+table (30/90/180/365-day ranges).

## Why
The owner flagged that the frontend calling BCV directly looked architecturally wrong and asked for a review. `system-architect` confirmed: third-party integrations belong to the backend (single contract, single cache/fallback policy, no per-browser rate-limiting exposure). The BCV history endpoint only paginates (no date range), so serving a range-filterable chart required persisting history in our own Postgres table rather than proxying live.

## How
`exchange_rate_provider.js` (shared fetch + cache + fallback) → `exchange_rate_service.js` (public API: `getUsdRateByDate`, `getCurrentRate`, `getRateForDate`, `getRateHistory`, `upsertTodayRate`) → `exchange_rate_controller.js` + `exchange_rate_router.js` mounted at `/api/exchange-rates`. Migration `20260714010000-create-exchange-rates.js` (nullable-free, `date` unique). One-off `server/scripts/backfill_exchange_rates.js` pulled the provider's full paginated history (336 days) into the table. Cron `exchange_rate_worker_service.js` runs daily at 00:15, before the existing 00:30 purge worker.

Frontend: `src/lib/rates.ts` rewritten with a new `ExchangeRate`-shaped core (`fetchCurrentRate`, `fetchRateByDate`, `fetchRateHistory`, matching React Query hooks) plus a legacy-shaped compatibility layer (`ExchangeSnapshot`, `useVESExchangeRate`, `getRateByDate`, `convertToUSD`, `convertToUSDByDate`) so `AccountManager`, `AccountSelector`, `ConfirmPaymentModal`, `DebtPayDialog`, `PayNowModal`, `TransactionsList`, and `Index` kept working unchanged. `TransactionForm.tsx` (631 lines, already over the code-quality ceiling) and `SidebarLayout.tsx` (179 lines after adding the "Tasas" nav entry) were split into smaller files in the same change — required by the crew plugin's file-size hook before it would let the edits through, not a scope choice.

Verified end-to-end: migration ran against the real database, backfill loaded 336 days, `/current` and `/history` returned live data via curl, and the frontend was driven in-browser (login, dialog open via triggered click, tab switch to Transfer) confirming both the single-transaction and transfer forms render correctly post-split and that VES accounts show their live USD-equivalent balance.

## Promoted knowledge
None — no ADR was written for this one (unlike the soft-delete change); the architecture call came from `system-architect` inline and is captured in this entry and the code comments in `rates.ts`.

## Follow-ups
- [ ] No automated test covers the by-date/history endpoints or the frontend Rates page.
- [ ] The seven legacy `rates.ts` consumers were not migrated to the new `ExchangeRate` shape — if `ExchangeSnapshot` needs new fields (e.g. `usdtRate`) later, it has to be threaded through the compatibility layer too.
- [ ] `TransactionForm.tsx` and `SidebarLayout.tsx` splits were done reactively to unblock this change; no dedicated regression pass beyond manual browser verification above.
