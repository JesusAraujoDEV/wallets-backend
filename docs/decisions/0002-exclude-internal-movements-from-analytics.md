# 0002 — Exclude internal movements and balance adjustments from analytics

- **Status**: Accepted
- **Date**: 2026-07-22
- **Owner role**: data-architect
- **Affects**: data (CategoryGroup + Category rows for userId=1), server/services/transactions/analytics_group_filter.js

## Context

After ADR 0001 and the `analyticsBehavior=include` default fix, ungrouped categories count as real income/expense. But several system categories represent money that never entered or left the user's net worth — the two legs of an account-to-account transfer, and balance-drift corrections. These were never assigned to an excluded group, so July income read $1075.14 instead of the ~$889 of genuine income. Transfers and adjustments are not economic events: a transfer moves money between the user's own buckets, and a balance adjustment reconciles Platica against reality — neither is money earned or spent.

## Decision

Structurally exclude internal-movement and balance-adjustment categories from analytics by assigning them to a single `CategoryGroup` with `analyticsBehavior='exclude'`, rather than hand-filtering category ids in query code.

Group "Movimientos internos" (id 19, `type='neutral'`, `analyticsBehavior='exclude'`, userId=1) holds these system categories:

- 169 "Transferencia (Salida)" — gasto (transfer source leg)
- 170 "Transferencia (Entrada)" — ingreso (transfer destination leg)
- 25 "Ajuste de Balance" — gasto
- 5 "Ajuste de Balance (-)" — gasto
- 6 "Ajuste de Balance (+)" — ingreso

The mechanism is the existing `resolveAnalyticsCategoryFilter` (`analytics_group_filter.js`): under the default `include` behavior it resolves every excluded-group category to a `notIn` id filter, so these legs drop out of `/summary/*` and `/transactions` totals while ungrouped categories pass through untouched. Group `type` is descriptive only — `assignCategoriesToGroup` does not validate that member category types match the group type — so a `neutral` group can hold both `ingreso` and `gasto` categories.

**Rule for future categories**: any category or system transaction type that is "not real income/expense" (new transfer types, new adjustment types) must be assigned to this excluded group, not filtered by id anywhere else in the codebase.

## Considered alternatives

- **Hand-filter category ids in the analytics queries** — a `notIn: [169,170,25,5,6]` literal in `list.js`/`summary.js`. Rejected: duplicates the exclusion in every query, drifts as categories change, and ignores the `analyticsBehavior` mechanism built for exactly this.
- **Also exclude "Me pasan" (58), FX gain/loss (175/176), commissions (23/174)** — they share a real-world origin with transfers. Rejected: the user considers "Me pasan" genuinely new money, and FX gain/loss is a real economic effect worth keeping visible. Excluding them is a product decision not made here.
- **Flag categories individually with a new `isInternal` column** — a schema change to encode what a group already encodes. Rejected as redundant with `analyticsBehavior`.

## Consequences

- **Positive**: transfer legs and adjustments no longer inflate income/expense; one group is the single place to exclude future internal movements. July (userId=1): income $1075.14 → $889.04, expense $1508.72 → $592.23, net -$433.58 → +$296.81.
- **Negative**: the exclusion lives in data, not code — it is invisible to a reader of the query code and only discoverable via this ADR and the group membership. A future engineer must know to check `analyticsBehavior='exclude'` groups.
- **Neutral**: FX gain/loss, commissions, and "Me pasan" remain counted, pending an explicit product decision.

## Migration notes

No code or schema change — data-only mutation via the live API:

1. `POST /api/category-groups` → group id 19 (`Movimientos internos`, neutral, exclude).
2. `PATCH /api/category-groups/19/assign-categories` with `[169,170,25,5,6]` → `updatedCount: 5`.

Reversible by reassigning those categories' `groupId` back to null (or to another group). Applies to userId=1 only; if the app grows to multi-user, each user needs their own excluded group and the same system categories assigned — a candidate for a seed/backfill.

## Open coordination points

- **product-strategist**: whether FX gain/loss (175/176), commissions (23/174), and "Me pasan" (58) should ever be excluded is a product call, deliberately left open here.
- **data-architect (multi-user)**: system categories and their excluded-group membership are per-user rows today; a future seed should auto-create this group and assignment for every new user.
