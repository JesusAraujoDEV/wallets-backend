# 2026-07-14 — Logical delete for domain tables + 90-day purge

## What changed
`accounts`, `categories`, `category_groups`, `debts`, `recurring_transactions`, and `budgets` moved from physical `DELETE` to Sequelize `paranoid` soft-delete (`deleted_at` column). Deleting a category or account no longer breaks its historical transactions: they keep resolving the deleted parent's name/type via `paranoid: false` on reads. A daily cron hard-purges soft-deleted rows after 90 days. `transaction_service.js` and `stats_service.js` were split into smaller modules (`server/services/transactions/`, `server/services/stats/`) in the same change, forced by the project's file-size ceiling once the new includes were added.

## Why
All domain deletes were physical and unrecoverable. The owner asked for logical delete instead. Two decisions came out of consulting the crew: `security-compliance` rejected indefinite retention (personal/financial data, including third-party names in `debts`) in favor of a 90-day purge; `data-architect` flagged that several `Transaction` → `Category`/`CategoryGroup` reads use `required: true` (INNER JOIN), so soft-deleting a category would have silently dropped its transactions from every total unless those includes were updated.

## How
Single migration `20260714000000-add-soft-delete-to-domain-tables.js`: nullable `deleted_at` on the six tables (no backfill needed), plus `budgets`' two unique indexes rebuilt as partial (`WHERE deleted_at IS NULL`). Models got `paranoid: true`. Every `Transaction` read joining `Category`/`CategoryGroup`/`Account` got `paranoid: false`; write-path lookups of the category/account the user is actively selecting kept default behavior (a soft-deleted one must not be selectable). `transactions.category_id`/`account_id` keep their `onDelete: RESTRICT` as a dormant backstop. `transactions` itself is out of scope — its delete reverses an account balance, so soft-delete there needs balance-aware restore semantics (deferred). Verified end-to-end against production data: soft-deleted a real category with live transactions, confirmed it disappeared from the active list, the balance summary total was unchanged before/after, and the frontend dashboard rendered normally; then restored it.

## Promoted knowledge
`docs/decisions/0001-soft-delete-domain-tables.md` — the full decision, alternatives considered, and migration notes.

## Follow-ups
- [ ] Iteration 2: soft-delete for `transactions` (balance-aware restore, stats/export audit).
- [ ] Automated regression test for "soft-delete a category with active transactions, totals unchanged" — currently only verified manually.
- [ ] Revisit the 90-day retention window per the triggers `security-compliance` listed (real third-party users, `debts.contactName` at scale, published privacy policy).
