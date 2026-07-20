# 2026-07-17 — Backend "God File" audit

Identification only — nothing in this document has been refactored. Companion to the frontend split done the same day (`wallets-frontend`, 17 files decomposed under `src/pages/*/` and `src/components/*/`). Same goal here: locate files that violate `standards/code-quality.md`'s file-size ceilings, so they can be split later the same way.

## Ceilings applied (from `standards/code-quality.md`)

| Kind | Max lines |
|---|---|
| Service / store | 150 |
| Generic module (controllers, routes, models, middlewares, swagger docs) | 200 |

## Precedent already in this repo

Two services are **already** split this way — point future refactors at these as the reference pattern, not at the frontend's React structure:

- `server/services/stats_service.js` (19 lines, pure re-export) → `server/services/stats/*.js`, one file per stat (`comparative_mom.js`, `spending_heatmap.js`, `monthly_forecast.js`, …) plus a `shared.js` for common date/format helpers.
- `server/services/transaction_service.js` (27 lines, pure re-export) → `server/services/transactions/*.js`.

Every file below should end up looking like one of these two: a thin top-level re-export plus a same-named subdirectory holding one file per concern.

## Priority 1 — Services over 150 lines (business logic, highest value to split)

| File | Lines | Functions inside | Suggested split |
|---|---|---|---|
| `server/services/debt_service.js` | 463 | `listDebts`, `getDebtById`, `createDebt`, `updateDebt`, `deleteDebt`, `payDebt` (**~180 lines by itself**, lines 147–327), `calcPaidAmount`, `computeStatus`, `linkTransactions` | `debts/crud.js` (list/get/create/update/delete) · `debts/pay.js` (`payDebt` + `calcPaidAmount` + `computeStatus` — `payDebt` alone also breaks the 30-line function-length rule and needs internal decomposition, not just a file move) · `debts/link_transactions.js` |
| `server/services/auth_service.js` | 461 | token/username helpers, `login`, `register`, `loginWithGoogle`, `forgotPassword`, `resetPassword`, `updateProfile`, `requestEmailChange`, `verifyOldEmailOtp`, `confirmNewEmail`, `unlinkGoogle`, `changePassword` | `auth/credentials.js` (login/register/token+username helpers) · `auth/google.js` (`loginWithGoogle`, `unlinkGoogle`) · `auth/password_reset.js` (`forgotPassword`, `resetPassword`) · `auth/email_change.js` (the 3-step OTP flow: request/verify/confirm) · `auth/profile.js` (`updateProfile`, `changePassword`) |
| `server/services/export_service.js` | 372 | `createTransfersPdfBuffer` (~77 lines), `createTransactionsListPdfBuffer` (~96 lines), `buildTransfersExport`, `buildTransactionsListExport`, `buildTransactionsExportFromDb` | `export/transfers_pdf.js` · `export/transactions_pdf.js` · `export/build_exports.js` (the three orchestrator functions that call into the two PDF builders) |
| `server/services/budget_service.js` | 323 | period helpers (`toMonthRange`, `toYearRange`, `currentUtcMonth`, `normalizeSpecificMonth`, `assertValidPeriod`, `assertValidSpecificMonthIfNeeded`), `shapeBudgetOutput`, `findDuplicateBudget`, `aggregateSpentByCategory`, `validateCategoryOwnershipAndType`, CRUD (`createBudget`/`listBudgets`/`updateBudget`/`deleteBudget`), `getBudgetStatus` (~60 lines) | `budgets/period_helpers.js` (all the date/period math) · `budgets/crud.js` · `budgets/status.js` (`aggregateSpentByCategory` + `getBudgetStatus`, the two that do the real work) |
| `server/services/recurring_transaction_service.js` | 220 | `normalizeInput`, `shapeRecurringTransaction`, `ensureOwnedReferences`, `createRecurringTransaction`, `listRecurringTransactions`, `updateRecurringTransaction`, `deleteRecurringTransaction`, `payNowRecurringTransaction` | Smallest offender — `recurring/crud.js` + `recurring/pay_now.js` would do it. Lower urgency than the four above. |
| `server/services/category_service.js` | 185 | `normalizeType`, `list`, `create`, `update`, `remove`, `listFiltered`, `createDefaultCategories` | Smallest offender. Likely just needs `createDefaultCategories`' embedded default-category data array pulled into a `category_defaults.js` constants file to drop under 150 — check before assuming a full multi-file split is needed. |

## Priority 2 — Controllers over 200 lines

| File | Lines | Note |
|---|---|---|
| `server/controllers/auth_controller.js` | 216 | 14 thin route handlers (login/me/logout/register/google/forgot-password/reset-password/email-change ×3/unlink-google/change-password). Barely over — grouping by concern (`session`, `password`, `email`, `google`) would mirror the `auth_service.js` split above and keep controller/service boundaries aligned. |

`transaction_controller.js` (174 lines) and every other controller/route/model/middleware file are **under** the 200-line ceiling — not flagged.

## Priority 3 — Swagger/OpenAPI doc files (mechanical, lower value)

These are JSDoc comment blocks consumed by `swagger-jsdoc`, not business logic — splitting them is about `one-symbol-per-file` hygiene and findability, not complexity reduction. Safe to defer; a wrong edit here only breaks API docs, not runtime behavior, but there's still no reason to carry 500+ line comment files.

| File | Lines |
|---|---|
| `server/swagger/auth/auth.js` | 570 |
| `server/swagger/transactions/transactions.js` | 544 |
| `server/swagger/debts/debts.js` | 536 |
| `server/swagger/recurring-transactions/recurring-transactions.js` | 412 |
| `server/swagger/stats/stats.js` | 367 |
| `server/swagger/budgets/budgets.js` | 352 |
| `server/swagger/summary/summary.js` | 272 |
| `server/swagger/category-groups/category-groups.js` | 210 |
| `server/swagger/categories/categories.js` | 191 |

Suggested split: one file per endpoint (or small endpoint group) inside a same-named subdirectory, same shape as everything above — `swagger-jsdoc` just globs files, so this is a pure file-count change with zero behavioral risk.

## Not flagged

- `server/db/migrations/*` — excluded on purpose; migrations are historical, immutable, and not subject to the size ceiling.
- `server/services/recurring_worker_service.js` (136), `agenda_service.js` (122), `category_group_service.js` (120) — under the 150-line service ceiling, listed here only to show they were checked, not skipped.

## Next step (not taken here)

Same protocol as the frontend split: one agent per file (or per tightly-related group, e.g. `auth_service.js` + `auth_controller.js` together since their splits should mirror each other), each verifying with the project's own lint/test commands before reporting back. Priority 1 first — that's where the real complexity and the 180-line `payDebt` function live.
