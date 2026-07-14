# 0001 — Adopt logical delete on domain tables via Sequelize paranoid

- **Status**: Accepted
- **Date**: 2026-07-14
- **Owner role**: data-architect
- **Affects**: server/models, server/db/migrations, server/services/stats, server/services/transactions

## Context

All domain tables used physical `DELETE` via Sequelize `.destroy()`. Accidental or destructive deletes were unrecoverable, and there was no retention story for user data after deletion.

## Decision

Adopt Sequelize `paranoid: true` (column `deleted_at`, timestamp, nullable) on `accounts`, `categories`, `category_groups`, `debts`, `recurring_transactions`, `budgets`. `deleted_at IS NULL` is the single source of truth for "exists" — no redundant boolean flag.

Soft-deleting a category or account is allowed even when active (non-deleted) `transactions` still reference it — the historical reference stays intact ("Option B"). Every read that joins `Transaction` to `Category`, `CategoryGroup`, or `Account` uses `paranoid: false` on that include, because several of those joins are `required: true` (INNER JOIN): without the flag, soft-deleting a category would silently drop every past transaction referencing it from totals and summaries. Standalone lookups inside write flows (`findByPk`/`findOne` resolving a category the user just selected) keep default `paranoid` behavior — a soft-deleted category must not be selectable for new transactions.

`transactions.category_id` / `transactions.account_id` keep their `onDelete: RESTRICT` foreign keys. Under `paranoid`, `.destroy()` never issues a real `DELETE`, so `RESTRICT` is dormant in normal operation — it remains only as a backstop against orphaning rows if a future `force: true` purge runs out of order.

`transactions` itself is explicitly out of scope for this iteration: its user-facing delete reverses an account balance before removing the row, so soft-delete there requires balance-aware restore semantics and a full audit of stats/summary/export queries. Deferred to a follow-up story.

Retention: soft-deleted rows are hard-purged after 90 days by a daily cron (`soft_delete_purge_service.js`), per security-compliance review — indefinite retention of personal/financial data (including third-party contact names on `debts`) was rejected.

## Considered alternatives

- **Hand-rolled `is_deleted` boolean + manual `defaultScope`** — reimplements what `paranoid` already does natively, and is easy to get wrong on associations/counts. Rejected in favor of the native feature.
- **Block soft-delete when active children exist (Option A)** — preserves today's behavior exactly (mirrors the current `RESTRICT` guard) but blocks users from removing a category/account they no longer want while old history still references it. Rejected in favor of Option B.
- **Indefinite retention of soft-deleted rows** — simplest, but retains personal/financial data (incl. third-party names in `debts`) with no time bound; flagged by security-compliance as the weakest point against limitation-of-purpose principles. Rejected in favor of a 90-day purge.

## Consequences

- **Positive**: deletes are recoverable within the retention window; historical transactions keep resolving category/account/group names after the parent is deleted.
- **Negative**: every read touching `Transaction` + `Category`/`CategoryGroup`/`Account` had to be audited for `paranoid: false`; missing it silently drops rows from totals (already true before this change, but now a live footgun for new code — see `standards/code-quality.md` follow-up recommendation to grep for this pattern in review).
- **Neutral**: `transaction_service.js` and `stats_service.js` were split into smaller modules (`server/services/transactions/`, `server/services/stats/`) as part of this change, to stay under the project's file-size ceiling while adding the `paranoid: false` includes — a pre-existing size violation this change happened to touch, not a scope expansion.

## Migration notes

Migration `20260714000000-add-soft-delete-to-domain-tables.js`: adds nullable `deleted_at` to the six tables; converts `budgets`' two unique indexes to partial (`WHERE deleted_at IS NULL`, plus `category_id IS NULL` on the global one) so a new budget can reuse a key after the old one is deleted. No backfill required — no pre-existing deleted rows to reconstruct. Migration ships before any code depending on the column; `paranoid: true` is enabled in the same deploy since Sequelize models are versioned with the app, not independently toggled.

`transactions` (iteration 2, not yet scheduled): needs balance-aware restore, stats/export audit, and its own ADR addendum before implementation.

## Open coordination points

- **QA**: regression coverage for "soft-delete a category/account with active transactions, totals unchanged" is the one case worth a dedicated test — verified manually against production data for this change (category 5, `Ajuste de Balance (-)`), not yet captured as an automated test.
- **SEC**: revisit the 90-day retention window if/when `users` grows beyond accounts controlled by the project owner, or when `debts.contactName` starts identifying real third parties at scale.
